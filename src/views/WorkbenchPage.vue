<script lang='tsx'>
import { Component, Vue, Watch } from 'vue-property-decorator';
import { CreateElement } from 'vue';
import { Page, Plugin, Pendant } from '@/config';
import { stateCommon, stateUi, stateWorkbench, stateActivity, statePoster } from '@/state/index';
import { SaveState } from '@/state/module/workbench';
import RenderPlugins from '@/components/main/RenderPlugins.vue';
import RenderView from '@/components/main/RenderView.vue';
import RenderEditor from '@/components/main/RenderEditor.vue';
import api from '../api';
import Clipboard from 'clipboard';
import qrcode from '@/utils/qrcode.js';
import utils from '../utils';
import PosterDialog from '@/components/poster/PosterDialog.vue';
import EventBusKey from '../utils/EventBusKey';

let debugClickCount = 0;

@Component
export default class WorkbenchPage extends Vue {

    private get saveState() {
        switch(stateWorkbench.data.saveState) {
            case SaveState.INIT:
                return '页面将自动保存';
            case SaveState.SAVING:
                return '已自动保存';
            case SaveState.SAVED:
                return `最近保存 ${stateWorkbench.data.saveTime}`;
            case SaveState.SAVEDFAIL:
                return '自动保存失败';
        }
        return '';
    }

    private renderPublishBtn() {
        let disabled = false;
        const activeTab = stateWorkbench.data.activeTab;
        const editor = stateWorkbench.data.workbench?.workbenchConfig.editor;
        if ((activeTab + 1) < (editor?.length || 1)) {
            disabled = true;
        }
        stateWorkbench.data.stageStatus.editor.forEach(item=> {
            if (!item.checkSuccess) {
                disabled = true;
            }
        });
        const views: JSX.Element[] = [];
        const roles = stateCommon.data.userInfo?.role?.split(',') || [];
        roles.forEach(role=> {
            switch(role) {
                case '0001':
                    views.push(<el-button disabled={disabled} class='item' size='mini' type='primary' onClick={()=> stateWorkbench.toAudit()}>提交发布</el-button>);
                    break;
                case '0002':
                    views.push(<el-button disabled={disabled} class='item' size='mini' type='primary' onClick={()=> stateWorkbench.publish()}>发布</el-button>);
                    break;
            }
        });
        return views;
    }

    private renderSaveStatus() {
        const roles = stateCommon.data.userInfo?.role?.split(',') || [];
        if (roles.includes('0001')) {
            return [
                <div class='item save-state'>{this.saveState}</div>,
                <el-button class='item' size='mini' plain type='primary' onClick={()=> stateWorkbench.save()}>保存</el-button>
            ];
        }
    }

    public render(h: CreateElement) {
        // if (!stateUi.data.config) {
        //     return '';
        // }
        // const activeTab = stateWorkbench.data.activeTab;
        return (
            <div class='workbench-page'>
                <div class='app-header'>
                    <div class='wrap'>
                        <el-page-header onBack={()=> {
                            window.location.href = process.env.VUE_APP_CDN_URL + '/activity-center/index.html';
                        }}></el-page-header>
                        <img onClick={()=> {
                            if (stateWorkbench.data.debug) {
                                return;
                            }
                            debugClickCount++;
                            if (debugClickCount >= 10) {
                                debugClickCount = 0;
                                this.$message.success('开启调试模式');
                                this.$bus.emit(EventBusKey.SETTING_DEBUG, true);
                            }
                        }} class='item logo' src='https://cdn.via.cool/jtp-host/2020-06-06/6c1f1983e2ea42449714814547cefed0' />
                        <div class='item activity-name'>{stateActivity.data.baseConfig?.name}</div>
                        {
                            // <el-button class='item' size='mini' disabled>
                            // {
                            //     stateUi.data.status === 'publish' ? '已发布' : '未发布'
                            // }
                            // </el-button>
                        }
                        {
                            // stateUi.data.status === 'publish' &&
                            <el-dropdown class='item' placement='bottom'>
                                <el-button class='item' size='mini' plain type='primary'>
                                    活动地址
                                </el-button>
                                <el-dropdown-menu slot='dropdown'>
                                    <div class='copy-qrcode-url'>
                                        <img class='img' src={qrcode.create(stateWorkbench.data.publishUrl)} />
                                        <el-button class='item' size='mini' plain type='primary'
                                            onClick={()=> utils.copyText(stateWorkbench.data.publishUrl)}>
                                            复制链接
                                        </el-button>
                                    </div>
                                </el-dropdown-menu>
                            </el-dropdown>
                        }
                        {
                            stateWorkbench.data.debug && <el-button class='item' size='mini' onClick={()=> {
                                this.$message.success('关闭调试模式');
                                this.$bus.emit(EventBusKey.SETTING_DEBUG, false);
                            }}>
                            关闭调试
                            </el-button>
                        }
                    </div>
                    <div class='wrap'>
                        {
                            this.renderSaveStatus()
                        }
                        {
                            this.renderPublishBtn()
                        }
                    </div>
                </div>
                <div class='app-content'>
                    <RenderPlugins />
                    <RenderView />
                    <RenderEditor />
                </div>
                <PosterDialog />
            </div>
        );
    }
}
</script>

<style lang="less">
.workbench-page {
    position: fixed;
    width: 100vw;
    height: 100vh;
    min-height: 600px;
    >.app-header {
        position: relative;
        width: 100vw;
        height: 60px;
        box-shadow: 0px 0px 10px 5px #eeeeee;
        z-index: 2;
        padding: 10px;
        box-sizing: border-box;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: white;
        >.wrap {
            display: flex;
            align-items: center;
            >.logo {
                height: 48px;
            }
            >.item+.item {
                margin-left: 10px;
            }
            >.save-state {
                font-size: 12px;
                opacity: 0.6;
            }
        }
    }
    >.app-content {
        position: relative;
        width: 100vw;
        height: calc(100vh - 60px);
        display: flex;
        z-index: 1;
        overflow-x: scroll;
    }
}
</style>
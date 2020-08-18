<script lang='tsx'>
import { Component, Vue, Watch, Prop } from 'vue-property-decorator';
import { CreateElement } from 'vue';
import { Page, Plugin } from '@/config';
import { VIFRAME_KEY } from '@/VIFRAME';
import { stateCommon, stateUi, stateWorkbench } from '@/state/index';
import { PluginType } from '@/state/module/activity';
import EditorPlugin from './EditorPlugin.vue';
import EditorDialog from './EditorDialog.vue';
import BaseSetting from '../setting/BaseSetting.vue';
import GiftSetting from '../setting/GiftSetting.vue';
import GiftSetting2 from '../setting/GiftSetting2.vue';
import RaffleSetting from '../setting/RaffleSetting.vue';
import EventBusKey from '../../utils/EventBusKey';
import utils from '../../utils';
import CSteps from '../common/CSteps/index.vue';
import CStep from '../common/CSteps/CStep.vue';

const tabList = {
    base: {
        zhName: '基础配置'
    },
    gift: {
        zhName: '奖品设置'
    },
    raffle: {
        zhName: '抽奖设置'
    },
    ui: {
        zhName: '界面设置'
    }
};

const touchEvent = {
    move: (ev: any)=> {},
    end: (ev: any)=> {},
};

const touchRecord: {
    touching: boolean,          // 是否有触摸
    sx: number,                 // 按下的x值
    sy: number,                 // 按下的y值
} = {
    touching: false,
    sx: 0,
    sy: 0
};

@Component({
    components: {
        'c-step': CStep
    }
})
export default class RenderEditor extends Vue {

    private getContentView(): JSX.Element | null {
        const data = stateWorkbench.data;
        const workbenchEditor = stateWorkbench.data.workbench?.workbenchConfig.editor;
        if (!workbenchEditor) {
            return null;
        }
        let contentView: JSX.Element | null = null;
        switch(workbenchEditor[data.currentTab].name) {
            case 'base':
                return <BaseSetting />;
            case 'gift':
                return <GiftSetting />;
            case 'raffle':
                return <RaffleSetting />;
            case 'ui':
                if (stateUi.data.currentDialog) {
                    return <EditorDialog />;
                }
                if (stateWorkbench.data.currentShare) {
                    return <div style='padding: 12px;opacity: 0.6;'>
                        系统将自动读取“基础配置页”的“分享设置”内容。
                    </div>;
                }
                return <EditorPlugin />;
        }
        return null;
    }

    private renderBtn() {
        const data = stateWorkbench.data;
        if (data.currentTab + 1 === data.workbench?.workbenchConfig.editor.length) {
            return '';
        }
        const index = data.currentTab;
        const tabName = data.workbench?.workbenchConfig.editor[index].name;
        const tab = data.stageStatus.editor.find(item=> item.name === tabName);
        const success = tab?.checkSuccess;
        return <el-button
                disabled={!success}
                class='next-btn'
                size='mini'
                type='primary'
                onClick={()=> stateWorkbench.toNextStep()}>
                下一步
            </el-button>;
    }

    public render(h: CreateElement) {
        const data = stateWorkbench.data;
        const workbenchEditor = stateWorkbench.data.workbench?.workbenchConfig.editor;
        if (!workbenchEditor) {
            return '';
        }
        return (
            <div class='render-editor' style={{
                width: stateWorkbench.data.width.editor + 'px'
            }}>
                <CSteps props={{
                    active: data.activeTab,
                    finishStatus: 'process',
                    processStatus: 'finish'
                }}>
                    {
                        workbenchEditor.map((item, index)=> {
                            const stage = data.stageStatus.editor.find(s=> s.name === item.name);
                            const hiddenBadge = stage?.checkSuccess || data.activeTab < index;
                            return <c-step
                                    status={index === data.currentTab ? 'finish' : ''}
                                    nativeOnClick={async ()=> {
                                        if (index > data.activeTab) {
                                            return;
                                        }
                                        if (index === data.currentTab) {
                                            return;
                                        }
                                        const next = await stateWorkbench.currentTabCheck();
                                        if (next) {
                                            data.currentTab = index;
                                        }
                                    }
                                }>
                                <el-badge slot='title' is-dot hidden={hiddenBadge}>
                                    {
                                        tabList[item.name].zhName
                                    }
                                </el-badge>
                            </c-step>;
                        })
                    }
                </CSteps>
                <div class='content'>
                    {
                        this.getContentView()
                    }
                    <div class='btn-wrap'>
                    {
                        this.renderBtn()
                    }
                    </div>
                </div>
                <div class='adjust-line-wrap' onMousedown={this.startAdjust}>
                    <div class='adjust-button'></div>
                </div>
            </div>
        );
    }

    private startAdjust(ev: MouseEvent) {
        touchEvent.move = this.adjustMove.bind(this);
        touchEvent.end = this.adjustEnd.bind(this);
        touchRecord.touching = true;
        touchRecord.sx = ev.pageX;
        document.addEventListener('mousemove', touchEvent.move, false);
        document.addEventListener('mouseup', touchEvent.end, false);
    }

    private adjustMove(ev: MouseEvent) {
        if (!touchRecord.touching) {
            return;
        }
        ev.stopPropagation();
        ev.preventDefault();
        const cx = ev.pageX;
        const width = stateWorkbench.data.width.editor + (touchRecord.sx - cx);
        stateWorkbench.data.width.editor = Math.max(width, 300);
        touchRecord.sx = cx;
    }

    private emitResetView = utils.throttle(()=> this.$bus.emit(EventBusKey.RESET_RENDERVIEW), 200);

    private adjustEnd(ev: MouseEvent) {
        if (!touchRecord.touching) {
            document.removeEventListener('mousemove', touchEvent.move, false);
            document.removeEventListener('mouseup', touchEvent.end, false);
            return;
        }
        touchRecord.touching = false;
        document.removeEventListener('mousemove', touchEvent.move, false);
        document.removeEventListener('mouseup', touchEvent.end, false);
        localStorage.setItem('workbench:editorWidth', `${stateWorkbench.data.width.editor}`);
        this.$nextTick(this.emitResetView);
    }
}
</script>

<style lang="less">
.render-editor {
    position: relative;
    // min-width: 640px;
    height: 100%;
    min-height: 600px;
    background-color: white;
    box-shadow: 0px 10px 10px 5px #eeeeee;
    z-index: 1;
    box-sizing: border-box;
    // flex: 1;
    display: flex;
    flex-direction: column;
    > .content {
        position: relative;
        flex: 1;
        width: 100%;
        overflow: scroll;
        &::-webkit-scrollbar {
            display: none;
        }
        > .btn-wrap {
            width: 100%;
            height: 100px;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            padding: 10px 18px;
            box-sizing: border-box;
        }
    }
    > .adjust-line-wrap {
        position: absolute;
        z-index: 99;
        left: 0;
        top: 0;
        width: 2px;
        height: 100%;
        cursor: ew-resize;
        &:hover {
            background-color: #589ef8;
            > .adjust-button {
                background-color: #589ef8;
                &::before {
                    background-color: white;
                }
            }
        }
        > .adjust-button {
            position: absolute;
            left: 0px;
            top: 50%;
            height: 30px;
            width: 10px;
            background-color: white;
            transform: translate3d(-100%, -50%, 0);
            display: flex;
            align-items: center;
            justify-content: center;
            &::before {
                content: '';
                background-color: #999999;
                width: 1px;
                height: 15px;
            }
        }
    }
}
.el-steps--simple {
    // padding: 13px 4% !important;
    .el-step__title {
        font-size: 14px !important;
    }
}
</style>
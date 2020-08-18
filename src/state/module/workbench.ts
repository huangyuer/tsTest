import Vue from 'vue';
import BaseModule from './base';
import api from '@/api/index';
import { ActivityConfig, Page, Poster } from '@/config';
import { stateUi, stateGift, stateRaffle, stateCommon, stateActivity } from '..';
import { VIFRAME_KEY } from '@/VIFRAME';
import { PluginType } from './activity';
import EventBusKey from '@/utils/EventBusKey';
import eventBus from '@/utils/eventBus';

export enum EditorTabName {
    Base = 'base',          // 基础配置
    Gift = 'gift',          // 奖品配置
    Raffle = 'raffle',      // 抽奖配置
    Ui = 'ui'               // 页面配置
}

export enum SaveState {
    INIT,       // 初始状态
    SAVING,     // 保存中
    SAVED,      // 已保存
    SAVEDFAIL,  // 保存失败
}

class Workbench extends BaseModule<{
    workbench: {                                            // 工作台配置
        id: string;                                         // 模板id
        name: string;                                       // 模板名称
        type: string;                                       // 模板类型
        urlKey: string;                                     // 模板id
        workbenchConfig: {                                  // 工作台配置
            [key: string]: any;
            editor: Array<{                                 // 编辑区需要显示的tab
                name: EditorTabName;
                pannel: Array<{
                    name: string;
                }>;
            }>;
        };
    } | null;
    status: string;                                         // 发布状态
    publishUrl: string;                                     // 发布链接
    stageConfig: {                                          // 编辑区的配置
        [key: string]: any;
        editor: EditorTabName[];
    };
    stageStatus: {
        editor: Array<{
            name: EditorTabName;
            checkSuccess: boolean;
        }>;
    };
    publishVersion: number;                                 // 发布版本
    currentTab: number;                                     // 编辑区当前选中的tab
    activeTab: number;                                      // 编辑区已激活的最后一个tab
    currentTabStatus: boolean;                              // 编辑区当前tab的状态，true表示可以点击下一步
    saveTime: string;                                       // 自动保存的时间
    saveState: SaveState;                                   // 自动保存状态
    currentShare: 'weixin' | 'app' | null;                  // 当前选中的分享预览页面
    startRenderPreview: boolean;                            // 是否可以开始渲染H5
    currentPoster: Poster | null;                           // 当前选中的海报预览页面
    width: {
        editor: number,
        pageList: number,
        pluginList: number
    },
    debug: boolean;                                         // 是否开启debug模式
}> {

    private savingMessage: any = null;
    private savingResult: any = null;

    public constructor() {
        super({
            saveTime: '',
            saveState: SaveState.INIT,
            workbench: null,
            stageConfig: {
                editor: []
            },
            stageStatus: {
                editor: []
            },
            publishVersion: 0,
            status: '',
            publishUrl: '',
            currentTab: 0,
            activeTab: 0,
            currentTabStatus: false,
            currentShare: null,
            startRenderPreview: false,
            currentPoster: null,
            width: {
                editor: Number(localStorage.getItem('workbench:editorWidth')) || 600,
                pageList: 120,
                pluginList: 150
            },
            debug: Number(localStorage.getItem('workbench:debug')) === 1
        });
        eventBus.on(EventBusKey.SETTING_DEBUG, (enable)=> {
            localStorage.setItem('workbench:debug', enable ? '1' : '0');
            this.data.debug = enable;
        });
    }

    /**
     * 获取基础配置
     */
    public async boot() {
        const baseRes = await Promise.all([
            api.vAuthGet('/api/backweb/workbench/base/boot', {
                refresh: true
            }),
            api.vAuthGet('/api/backweb/workbench/workbench/boot', {
                refresh: true
            })
        ]);
        const [bootRes, workbenchRes] = baseRes;
        if (+bootRes.code !== 0 || +workbenchRes.code !== 0) {
            throw bootRes.msg;
        }

        // 工作台配置
        const workbench = workbenchRes.data.workbench;
        workbench.workbenchConfig = JSON.parse(workbench.workbenchConfig) || {};
        this.data.workbench = workbench;
        // 初始化状态
        this.data.stageStatus.editor = this.data.workbench?.workbenchConfig.editor.map(item=> {
            return {
                name: item.name,
                checkSuccess: true
            };
        }) || [];
        // 编辑步骤
        this.data.stageConfig = JSON.parse(bootRes.data.stageConfig || '{"editor": []}');
        if (this.data.stageConfig.editor.length === 0) {
            this.data.stageConfig.editor.push(EditorTabName.Base);
        }
        this.data.publishVersion = bootRes.data.publishVersion;
        this.data.activeTab = this.data.stageConfig.editor.length - 1;
        this.data.currentTab = this.data.activeTab;
        // 加载其它tab的内容
        await this.getTabRes();
        // 基础配置
        this.data.status = bootRes.data.status;
        this.data.publishUrl = bootRes.data.url;

        stateActivity.setConfig(baseRes);
        stateUi.setConfig(baseRes);

        return baseRes;
    }

    private async getTabRes() {
        const editor = this.data.stageConfig.editor;
        if (editor.find(item=> item === EditorTabName.Raffle)) {
            // loadRaffleConfig时已经有loadGiftConfig
            await stateRaffle.loadRaffleConfig();
        } else if (editor.find(item=> item === EditorTabName.Gift)) {
            await stateGift.loadGiftConfig();
        }
    }

    public async autoSaveStart(saveApi?: Promise<any>, showTip: boolean = true) {
        this.data.saveState = SaveState.SAVING;
        if (this.savingMessage) {
            this.savingMessage.close();
            this.savingMessage = null;
        }
        if (showTip) {
            this.savingMessage = Vue.prototype.$message({
                message: '保存中',
                iconClass: 'el-icon-loading',
                duration: 0
            });
        }
        if (saveApi) {
            const res = await saveApi.catch(err=> console.log(err));
            if (res && Number(res.code) === 0) {
                this.autoSaveEnd(true, showTip);
            } else {
                console.log(res);
                this.autoSaveEnd(false, showTip);
            }
            return res;
        }
        return null;
    }

    public autoSaveEnd(isSuccess: boolean = false, showTip: boolean = true) {
        if (this.savingMessage) {
            this.savingMessage.close();
            this.savingMessage = null;
        }
        if (this.savingResult) {
            this.savingResult.close();
            this.savingResult = null;
        }
        if (showTip) {
            this.savingResult = Vue.prototype.$message({
                message: isSuccess ? '保存成功' : '保存失败',
                type: isSuccess ? 'success' : 'error'
            });
        }
        this.data.saveState = isSuccess ? SaveState.SAVED : SaveState.SAVING;
        this.data.saveTime = `${new Date().getHours()}`.padStart(2, '0') + ':' + `${new Date().getMinutes()}`.padStart(2, '0');
    }

    public async save() {
        const index = this.data.currentTab;
        const tabName = this.data.workbench?.workbenchConfig.editor[index].name;
        // const canNext = await this.currentTabCheck(true);
        // if (!canNext) {
        //     Vue.prototype.$alert('当前页面有数据未完成，请先填写必填数据', '提示', {
        //         confirmButtonText: '确定',
        //         showClose: false
        //     });
        //     return;
        // }
        switch(tabName) {
            case EditorTabName.Base:
                // 保存基础配置
                stateActivity.saveBaseConfig();
                break;
            case EditorTabName.Gift:
                // 保存奖品列表配置
                // 第二个参数传name是为了触发iframe中的更新
                stateGift.changeGift(stateGift.data.giftList, ['name']);
                break;
            case EditorTabName.Raffle:
                // 保存抽奖配置
                stateRaffle.changeShowConfig({
                    hitLimitType: stateRaffle.data.raffleConfig.hitLimitType,
                    hitLimitNum: stateRaffle.data.raffleConfig.hitLimitNum,
                    raffleTimesType: stateRaffle.data.raffleConfig.raffleTimesType,
                    raffleTimes: stateRaffle.data.raffleConfig.raffleTimes,
                    useRaffleTimesLimit: stateRaffle.data.raffleConfig.useRaffleTimesLimit
                });
                break;
            case EditorTabName.Ui:
                // 保存页面ui配置
                stateUi.save();
                break;
        }
    }

    /**
     * 显示分享预览
     * @param type
     */
    public async showSharePreview(type: 'weixin' | 'app' | null) {
        this.data.currentShare = type;
        this.data.currentPoster = null;
        // 通知iframe关闭弹窗
        Vue.prototype.VIFRAME.send(VIFRAME_KEY.CLOSE_DIALOG);
        stateUi.data.currentDialog = null;
    }

    public async showPreviewPoster(poster: Poster) {
        this.data.currentPoster = poster;
        // 通知iframe关闭弹窗
        Vue.prototype.VIFRAME.send(VIFRAME_KEY.CLOSE_DIALOG);
        stateUi.data.currentDialog = null;
        this.data.currentShare = null;

        // TODO：目的是为了激活海报对应的组件
        // const page = stateUi.data.config?.pages.find(p=> p.id === poster.pageId) || null;
        // stateUi.data.currentPlugin = null;
        // if (!page) {
        //     return;
        // }
        // stateUi.switchPage(page, false);
        // if (stateUi.data.currentPage) {
        //     Vue.prototype.$nextTick(()=> {
        //         let plugin = stateUi.data.currentPage?.plugins.find(p=> p.id === poster.pluginId);
        //         let pluginType = PluginType.Plugin;
        //         if (!plugin) {
        //             pluginType = PluginType.Pendant;
        //             plugin = stateUi.data.currentPage?.pendants.find(p=> p.id === poster.pluginId);
        //         }
        //         if (plugin) {
        //             stateUi.activePlugin(plugin, pluginType);
        //         }
        //     });
        // }
    }

    /**
     * 点击下一步
     */
    public async toNextStep() {
        const editorTab = this.data.workbench?.workbenchConfig.editor;
        if (!editorTab) {
            return;
        }
        // 如果下一步已经被激活过，直接切换到下一步就行
        if (this.data.currentTab < this.data.activeTab) {
            this.data.currentTab++;
        } else {
            // 否则需要更新接口，记录已激活的tab
            this.data.currentTab++;
            this.data.activeTab = this.data.currentTab;
            if (editorTab[this.data.currentTab]) {
                this.data.stageConfig.editor.push(editorTab[this.data.currentTab].name);
                stateActivity.saveBaseConfig({
                    stageConfig: JSON.stringify(this.data.stageConfig)
                });
            }
        }
    }

    public async publish() {
        const confirm = await new Promise(resolve=> {
            Vue.prototype.$confirm('发布成功后，真实用户即可参加活动。', '确认发布', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            })
            .then(() => resolve(true))
            .catch(() => resolve(false));
        });
        if (!confirm) {
            return;
        }
        stateCommon.showLoading();
        const res = await api.vAuthGet('/api/backweb/workbench/workbench/publish', {
            refresh: true
        });
        stateCommon.hideLoading();
        if (+res.code === 0) {
            this.data.status = 'publish';
            Vue.prototype.$message.success('发布成功');
        } else {
            Vue.prototype.$message.error('发布失败.' + res.msg);
        }
        return res;
    }

    public async toAudit() {
        stateCommon.showLoading();
        const res = await api.vAuthGet('/api/backweb/workbench/workbench/audit', {
            refresh: true
        });
        stateCommon.hideLoading();
        if (+res.code === 0) {
            this.data.status = 'publish';
            Vue.prototype.$message.success('提交成功');
        } else {
            Vue.prototype.$message.error('提交失败.' + res.msg);
        }
        return res;
    }

    public async currentTabCheck() {
        const index = this.data.currentTab;
        const tabName = this.data.workbench?.workbenchConfig.editor[index].name;
        switch(tabName) {
            case EditorTabName.Base:
                return await stateUi.check(true);
            case EditorTabName.Gift:
                return await stateGift.check(true);
            case EditorTabName.Raffle:
                return await stateRaffle.check(true);
            case EditorTabName.Ui:
                return await stateActivity.check(true);
        }
        return true;
    }
}

export default Workbench;

import Vue from 'vue';
import BaseModule from './base';
import api from '@/api/index';
import { ActivityConfig, Page, Plugin, Pendant, Dialog } from '@/config';
import { VIFRAME_KEY } from '@/VIFRAME';
import { stateCommon, stateGift, stateRaffle, stateWorkbench, statePoster } from '../index';
import utils, { uuid } from '@/utils/index';
import EventBusKey from '@/utils/EventBusKey';

export enum PluginType {
    Plugin = 'plugin',      // 组件
    Pendant = 'pendant'     // 挂件
}

let lockSwitchDialog = false;

/**
 * 组件配置
 */
class Ui extends BaseModule<{
    config: ActivityConfig | null;                          // 整个活动的页面配置
    currentPage: Page | null;                               // 当前选中的页面
    currentDialog: Dialog | null;                           // 当前选中的弹窗
    currentPlugin: Plugin | Pendant | null;                 // 当前选中的组件
    currentPluginType: PluginType | '';                     // 当前选中的组件类型（组件、挂件）
}> {

    public constructor() {
        super({
            config: null,
            currentPage: null,
            currentDialog: null,
            currentPlugin: null,
            currentPluginType: ''
        });
    }

    public setConfig(baseRes) {
        const [bootRes] = baseRes;
        // 基础配置
        this.mergeDefaultConfig(JSON.parse(bootRes.data.pageConfig) as ActivityConfig);
        this.data.currentPage = this.data.config?.pages[0] || null;
    }

    private mergeDefaultConfig(config: ActivityConfig | null) {
        if (!config) {
            return;
        }
        let update = false;
        // TODO 比较hack的写法，先这样，后续再看看怎么处理新增数据的合并
        if (config?.pages) {
            if (config.name === 'TRaffle') {
                const helpPage = config.pages.find(item=> item.name === 'helpOperation');
                if (!helpPage) {
                    config.pages.push({id:'page-helpOperation',name:'helpOperation',zhName:'好友助力页',config:{animation:'',title:'',backgroundImage:'',backgroundColor:'#fff'},plugins:[{id:'20200703160729967-04468108',name:'TRaffleVHelpOperation',zhName:'好友助力组件',tName:'helpOperation',deletable:false,outConfig:{margin:{left:'0',right:'0',top:'0',bottom:'0'},hidden:false,align:'center',backgroundColor:'',backgroundImage:'',width:'',height:'',border:{open:false,radius:{topLeft:'',topRight:'',bottomLeft:'',bottomRight:''},radiusType:'percentage'},shadow:{open:false,h:'0',v:'0',blur:'0',spread:'2',color:'#000000',inset:false}},config:{winhelpBgc:'#0000004d',winhelpcolor:'#f9f9f9',helpBtnText:'为他助力',helpdescription:'我正在抢一折流量券, 快帮我助力',helpBtnTextcolor:'#fff',helpBtnTextBgc:'#ff6d41',helpdescriptionColor:'#333',helpdescriptionBgc:'#fff'}}],pendants:[],deletable:false,isFristPage:false});
                }
            }
        }
        config?.pages.forEach(page=> {
            page.config.title = page.config.title || page.zhName;
            page.plugins = page.plugins.map(item=> {
                const list = window.VEDITOR.components[`WEditor${item.name}`]?.workbenchPuginItemList;
                const editorItem = list?.find(json=> json.tName === item.tName) || (list && list.length > 0 && list[0]);
                const pluginJson = editorItem?.json;
                if (!item.outConfig) {
                    item.outConfig = {
                        margin: (item as any).margin || {
                            top: '0',
                            left: '0',
                            right: '0',
                            bottom: '0'
                        },
                        hidden: false,
                        align: 'center',
                        backgroundColor: '',
                        backgroundImage: '',
                        width: '',
                        height: '',
                        border: {
                            open: false,
                            radius: {
                                topLeft: '',
                                topRight: '',
                                bottomLeft: '',
                                bottomRight: ''
                            },
                            radiusType: 'percentage'
                        },
                        shadow: {
                            open: false,
                            h: '0',
                            v: '0',
                            blur: '2',
                            spread: '2',
                            color: '#000000',
                            inset: false
                        }
                    };
                    delete (item as any).margin;
                }
                if (pluginJson) {
                    item = utils.deepObjectMerge(JSON.parse(JSON.stringify(pluginJson)), item);
                }
                return item;
            });
            page.pendants = page.pendants.map(item=> {
                const list = window.VEDITOR.components[`WEditor${item.name}`]?.workbenchPuginItemList;
                const editorItem = list?.find(json=> json.tName === item.tName) || (list && list.length > 0 && list[0]);
                const pluginJson = editorItem?.json;
                if (!item.outConfig) {
                    item.outConfig = {
                        margin: (item as any).margin || {
                            top: '0',
                            left: '0',
                            right: '0',
                            bottom: '0'
                        },
                        hidden: false,
                        align: 'center',
                        backgroundColor: '',
                        backgroundImage: '',
                        width: '',
                        height: '',
                        border: {
                            open: false,
                            radius: {
                                topLeft: '',
                                topRight: '',
                                bottomLeft: '',
                                bottomRight: ''
                            },
                            radiusType: 'percentage'
                        },
                        shadow: {
                            open: false,
                            h: '0',
                            v: '0',
                            blur: '2',
                            spread: '2',
                            color: '#000000',
                            inset: false
                        }
                    };
                    delete (item as any).margin;
                }
                if (pluginJson) {
                    item = utils.deepObjectMerge(JSON.parse(JSON.stringify(pluginJson)), item);
                }
                return item;
            });
        });
        if (config?.dialogs) {
            let len = config.dialogs.length;
            // TODO: 向后兼容，删除就活动的这几个弹窗，后续删除掉
            config.dialogs = config.dialogs.filter(item=> !['rule', 'end', 'pause', 'notstart', 'login'].includes(item.dialogName));
            update = config.dialogs.length !== len;
            // 所有活动注入公共弹窗
            Object.keys(window.VDIALOG_INJECT).forEach(key=> {
                const dialogJson = window.VDIALOG_INJECT[key];
                const index = config?.dialogs.findIndex(d=> d.dialogName === dialogJson.dialogName);
                if (index === -1) {
                    dialogJson.id = `dialog-${uuid()}`;
                    config.dialogs.push(dialogJson);
                    update = true;
                }
                //  else {
                //     config.dialogs[index] = utils.deepObjectMerge(dialogJson, config.dialogs[index]);
                // }
            });
        }
        config?.dialogs.forEach((dialog, index)=> {
            const dialogJson = window.VEDITOR.dialogComponents[dialog.dialogName];
            if (dialogJson) {
                config.dialogs[index] = utils.deepObjectMerge(dialogJson, config.dialogs[index]);
            }
        });
        if (config && !config.posters) {
            config.posters = [];
        }
        this.data.config = config;
        if (update) {
            this.save(false);
        }
        config.rule = config.rule || '';
        return config;
    }

    /**
     * 切换页面
     * @param page
     */
    public switchPage(page: string | Page, userClick: boolean = true) {
        Vue.prototype.VIFRAME.send(VIFRAME_KEY.CLOSE_DIALOG);
        this.data.currentDialog = null;
        stateWorkbench.data.currentShare = null;
        if (userClick) {
            stateWorkbench.data.currentPoster = null;
        }
        let toPage: Page | null = null;

        if (typeof page === 'string') {
            // 通过页面名字找到页面配置
            const cachePage = this.data.config?.pages.find((item: Page) => item.name === page);
            if (cachePage) {
                toPage = cachePage;
            }
        } else {
            toPage = page;
        }
        if (this.data.currentPage?.id !== toPage?.id) {
            this.data.currentPage = toPage;
            this.data.currentPluginType = '';
            this.data.currentPlugin = null;
            Vue.prototype.VIFRAME.send(VIFRAME_KEY.CHANGE_PAGE, this.data.currentPage);
        }
    }

    /**
     * 切换显示弹窗
     * @param dialog
     */
    public switchDialog(dialog: string | Dialog) {
        if (lockSwitchDialog) {
            return;
        }
        lockSwitchDialog = true;
        setTimeout(() => {
            lockSwitchDialog = false;
        }, 100);
        let toDialog: Dialog | null = null;
        stateWorkbench.data.currentShare = null;
        stateWorkbench.data.currentPoster = null;
        if (typeof dialog === 'string') {
            if (this.data.currentDialog?.dialogName === dialog) {
                Vue.prototype.VIFRAME.send(VIFRAME_KEY.CLOSE_DIALOG);
                this.data.currentDialog = null;
                return;
            }
        } else {
            if (this.data.currentDialog?.id === dialog.id) {
                Vue.prototype.VIFRAME.send(VIFRAME_KEY.CLOSE_DIALOG);
                this.data.currentDialog = null;
                return;
            }
        }
        if (typeof dialog === 'string') {
            // 通过页面名字找到页面配置
            const cacheDialog = this.data.config?.dialogs.find((item: Dialog) => item.dialogName === dialog);
            if (cacheDialog) {
                toDialog = cacheDialog;
            }
        } else {
            toDialog = dialog;
        }
        console.log(toDialog);
        if (this.data.currentDialog?.id !== toDialog?.id) {
            this.data.currentDialog = toDialog;
            if (toDialog) {
                Vue.prototype.VIFRAME.send(VIFRAME_KEY.SHOW_DIALOG, {name: toDialog.dialogName, data: toDialog.config});
            }
        }
    }

    /**
     * 预览修改弹窗配置
     * @param kvs
     */
    public previewDialogConfigs(kvs: Array<{key: string, value: any}>) {
        if (!this.data.currentDialog) {
            return;
        }
        const config = JSON.parse(JSON.stringify(this.data.currentDialog.config));
        kvs.forEach(({key, value})=> {
            const keys = key.split('.');
            if (keys.length === 0) {
                return;
            }
            const item = keys
                .splice(0, keys.length - 1)
                .reduce((pre: any, cur: string)=> {
                    return pre[cur] || {};
                }, config);
            item[keys[0]] = value;
        });
        Vue.prototype.VIFRAME.send(VIFRAME_KEY.CHANGE_DIALOG_DATA, config);
    }

    /**
     * 修改弹窗配置
     * @param kvs
     */
    public saveDialogConfigs(kvs: Array<{key: string, value: any}>) {
        if (!this.data.currentDialog) {
            return;
        }
        kvs.forEach(({key, value})=> {
            const keys = key.split('.');
            if (keys.length === 0) {
                return;
            }
            if (!this.data.currentDialog) {
                return;
            }
            const item = keys
                .splice(0, keys.length - 1)
                .reduce((pre: any, cur: string)=> {
                    return pre[cur] || {};
                }, this.data.currentDialog.config);
            item[keys[0]] = value;
        });
        this.save();
    }

    /**
     * 重置激活组件
     */
    public resetActivePlugin() {
        this.data.currentPluginType = '';
        this.data.currentPlugin = null;
        Vue.prototype.VIFRAME.send(VIFRAME_KEY.RESET_ACTIVE_PLUGIN);
    }

    /**
     * 激活组件
     * @param plugin
     * @param type
     */
    public activePlugin<T extends Plugin>(plugin: T, type: PluginType) {
        if (this.data.currentPlugin?.id === plugin.id) {
            return;
        }
        this.data.currentPluginType = type;
        this.data.currentPlugin = plugin;
        Vue.prototype.VIFRAME.send(VIFRAME_KEY.ACTIVE_PLUGIN, {id: plugin.id, type});
    }

    /**
     * 通过组件id激活组件
     * @param id
     * @param type
     * @param activeIframe
     */
    public activePluginFromId(id: string, type: PluginType, activeIframe: boolean = false) {
        this.data.currentPluginType = type;
        if (this.data.currentPage) {
            const list = this.data.currentPage[type + 's'];
            this.data.currentPlugin = list?.find(item=> item.id === id) || null;
        } else {
            this.data.currentPlugin = null;
        }
        if (activeIframe) {
            Vue.prototype.VIFRAME.send(VIFRAME_KEY.ACTIVE_PLUGIN, {id: this.data.currentPlugin?.id, type});
        }
    }

    /**
     * 组件移动位置
     * @param newIndex
     * @param oldIndex
     * @param updateIframe
     */
    public swapPlugin(newIndex: number, oldIndex: number, updateIframe?: boolean) {
        const plugins = this.data.currentPage?.plugins;
        if (!plugins) {
            return;
        }
        if (newIndex < oldIndex) {
            plugins.splice(newIndex, 0, plugins[oldIndex]);
            plugins.splice(oldIndex + 1, 1);
        } else {
            plugins.splice(newIndex + 1, 0, plugins[oldIndex]);
            plugins.splice(oldIndex, 1);
        }
        if (updateIframe) {
            Vue.prototype.VIFRAME.send(VIFRAME_KEY.MOVE_INDEX, {type: 'plugin', newIndex, oldIndex});
        }
        this.save();
    }

    /**
     * 挂件移动位置
     * @param neIndex
     * @param olIndex
     * @param updateframe
     */
    public swapPendant(newIndex: number, oldIndex: number, updateIframe?: boolean) {
        const plugins = this.data.currentPage?.pendants;
        if (!plugins) {
            return;
        }
        if (newIndex < oldIndex) {
            plugins.splice(newIndex, 0, plugins[oldIndex]);
            plugins.splice(oldIndex + 1, 1);
        } else {
            plugins.splice(newIndex + 1, 0, plugins[oldIndex]);
            plugins.splice(oldIndex, 1);
        }
        if (updateIframe) {
            Vue.prototype.VIFRAME.send(VIFRAME_KEY.MOVE_INDEX, {type: 'pendant', newIndex, oldIndex});
        }
        this.save();
    }

    public addPage() {
        const customPage = {
            id: utils.uuid(),
            zhName: '自定义页面',
            name: 'customPage-' + utils.uuid(),
            plugins: [],
            pendants: [],
            deletable: true,
            config: {
                animation: '',
                backgroundColor: '',
                backgroundImage: '',
                title: '自定义页面'
            }
        };
        this.data.config?.pages.push(customPage);
        Vue.prototype.$nextTick(()=> {
            this.switchPage(customPage);
        });
    }

    /**
     * 添加组件
     * @param sourceJson
     * @param type
     */
    public addPlugin(sourceJson: Plugin, type: PluginType) {
        if (!this.data.currentPage) {
            return;
        }
        let plugin: Plugin = JSON.parse(JSON.stringify(sourceJson));
        // if (type === PluginType.Pendant) {
        //     plugin = Object.assign({
        //         mode: 'dragable',
        //         alignH: 'left',
        //         alignV: 'top',
        //         position: {
        //             left: 0,
        //             right: 0,
        //             top: 0,
        //             bottom: 0
        //         }
        //     }, plugin);
        // }
        plugin.id = utils.uuid();
        plugin.deletable = true;
        this.data.currentPage[type + 's'].push(plugin);
        Vue.prototype.VIFRAME.send(VIFRAME_KEY.ADD_PLUGIN, {plugin, type});
        this.activePlugin(plugin, type);
        Vue.prototype.$nextTick(()=> {
            // 要setTimeout一下,不然会跟激活组件冲突
            setTimeout(() => {
                document.querySelector('#__plugin-list-add-btn')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }, 0);
        });
        this.save();
    }

    /**
     * 删除组件
     * @param index
     * @param type
     */
    public deletePlugin(index: number, type: PluginType) {
        if (!this.data.currentPage) {
            return;
        }
        const list = this.data.currentPage[type + 's'];
        const [item] = list.splice(index, 1);
        Vue.prototype.$bus.emit(EventBusKey.PLUGIN_DELETE, {type, id: item.id, plugin: item});
        Vue.prototype.VIFRAME.send(VIFRAME_KEY.DELETE_PLUGIN, {index, type, id: item.id});
        if (item.id === this.data.currentPlugin?.id) {
            this.data.currentPlugin = null;
        }
        this.save();
    }

    /**
     * 预览修改活动属性
     * @param key
     * @param value
     * @param changeWorkbench
     */
    public previewActivityConfig(key: string, value: any, changeWorkbench: boolean = false) {
        if (!this.data.config) {
            return;
        }
        if (changeWorkbench) {
            const keys = key.split('.');
            if (keys.length === 0) {
                return;
            }
            const item = keys
                .splice(0, keys.length - 1)
                .reduce((pre: any, cur: string)=> {
                    return pre[cur] || {};
                }, this.data.config);
            item[keys[0]] = value;
        }
        Vue.prototype.VIFRAME.send(VIFRAME_KEY.CHANGE_ACTIVITY_CONFIG, {
            key,
            value
        });
    }

    /**
     * 预览批量修改活动属性
     * @param kvs
     */
    public previewActivityConfigs(kvs: Array<{key: string, value: any, changeWorkbench: boolean}>) {
        if (!this.data.config) {
            return;
        }
        kvs.filter(item=> item.changeWorkbench)
            .forEach(({key, value})=> {
                // 监听页面配置改变
                const keys = key.split('.');
                if (keys.length === 0) {
                    return;
                }
                const item = keys
                    .splice(0, keys.length - 1)
                    .reduce((pre: any, cur: string)=> {
                        return pre[cur] || {};
                    }, this.data.config);
                item[keys[0]] = value;
            });
        Vue.prototype.VIFRAME.send(VIFRAME_KEY.CHANGE_ACTIVITY_CONFIGS, kvs);
    }

    /**
     * 预览修改页面属性
     * @param key
     * @param value
     * @param changeWorkbench
     */
    public previewPageConfig(key: string, value: any, changeWorkbench: boolean = false) {
        if (!this.data.currentPage) {
            return;
        }
        if (changeWorkbench) {
            const keys = key.split('.');
            if (keys.length === 0) {
                return;
            }
            const item = keys
                .splice(0, keys.length - 1)
                .reduce((pre: any, cur: string)=> {
                    return pre[cur] || {};
                }, this.data.currentPage);
            item[keys[0]] = value;
        }
        Vue.prototype.VIFRAME.send(VIFRAME_KEY.CHANGE_PAGE_CONFIG, {
            key,
            value
        });
    }

    /**
     * 预览批量修改页面属性
     * @param kvs
     */
    public previewPageConfigs(kvs: Array<{key: string, value: any, changeWorkbench: boolean}>) {
        if (!this.data.currentPage) {
            return;
        }
        kvs.filter(item=> item.changeWorkbench)
            .forEach(({key, value})=> {
                // 监听页面配置改变
                const keys = key.split('.');
                if (keys.length === 0) {
                    return;
                }
                const item = keys
                    .splice(0, keys.length - 1)
                    .reduce((pre: any, cur: string)=> {
                        return pre[cur] || {};
                    }, this.data.currentPage);
                item[keys[0]] = value;
            });
        Vue.prototype.VIFRAME.send(VIFRAME_KEY.CHANGE_PAGE_CONFIGS, kvs);
    }

    /**
     * 预览修改组件属性
     * @param id
     * @param type
     * @param key
     * @param value
     */
    public previewPluginConfig(id: string, type: PluginType, key: string, value: any) {
        if (!this.data.currentPage) {
            return;
        }
        const list = this.data.currentPage[type + 's'];
        const index = list.findIndex((p: Plugin | Pendant)=> p.id === id);
        if (index === -1) {
            return;
        }
        Vue.prototype.VIFRAME.send(VIFRAME_KEY.CHANGE_PLUGIN_CONFIG, {
            id,
            key: type + 's.' + index + '.' + key,
            value
        });
    }

    /**
     * 预览批量修改组件属性
     * @param id
     * @param type
     * @param kvs
     */
    public previewPluginConfigs(id: string, type: PluginType, kvs: Array<{key: string, value: any}>) {
        if (!this.data.currentPage) {
            return;
        }
        const list = this.data.currentPage[type + 's'];
        const index = list.findIndex((p: Plugin | Pendant)=> p.id === id);
        if (index === -1) {
            return;
        }
        kvs.forEach(item=> {
            item.key = type + 's.' + index + '.' + item.key;
        });
        Vue.prototype.VIFRAME.send(VIFRAME_KEY.CHANGE_PLUGIN_CONFIGS, {id, list: kvs});
    }

    /**
     * 保存修改组件属性
     * @param id
     * @param type
     * @param key
     * @param value
     */
    public async savePluginConfigs(id: string, type: PluginType, kvs: Array<{key: string, value: any}>) {
        if (!this.data.currentPage) {
            return false;
        }
        const list = this.data.currentPage[type + 's'];
        const index = list.findIndex((p: Plugin | Pendant)=> p.id === id);
        if (index === -1) {
            return false;
        }
        kvs.forEach(kv=> {
            // 监听页面配置改变
            const keys = kv.key.split('.');
            if (keys.length === 0) {
                return;
            }
            const item = keys
                .splice(0, keys.length - 1)
                .reduce((pre: any, cur: string)=> {
                    return pre[cur] || {};
                }, list[index]);
            item[keys[0]] = kv.value;
        });
        return await this.save();
    }

    /**
     * 预保存修改组件属性
     * @param id
     * @param type
     * @param key
     * @param value
     */
    public async preSavePluginConfigs(id: string, type: PluginType, kvs: Array<{key: string, value: any}>) {
        if (!this.data.currentPage) {
            return false;
        }
        const list = this.data.currentPage[type + 's'];
        const index = list.findIndex((p: Plugin | Pendant)=> p.id === id);
        if (index === -1) {
            return false;
        }
        kvs.forEach(kv=> {
            // 监听页面配置改变
            const keys = kv.key.split('.');
            if (keys.length === 0) {
                return;
            }
            const item = keys
                .splice(0, keys.length - 1)
                .reduce((pre: any, cur: string)=> {
                    return pre[cur] || {};
                }, list[index]);
            item[keys[0]] = kv.value;
        });
    }

    /**
     * 保存修改组件属性
     * @param id
     * @param type
     * @param key
     * @param value
     */
    public savePluginConfig(id: string, type: PluginType, key: string, value: any) {
        if (!this.data.currentPage) {
            return;
        }
        const list = this.data.currentPage[type + 's'];
        const index = list.findIndex((p: Plugin | Pendant)=> p.id === id);
        if (index === -1) {
            return;
        }
        // 监听页面配置改变
        const keys = key.split('.');
        if (keys.length === 0) {
            return;
        }
        const item = keys
            .splice(0, keys.length - 1)
            .reduce((pre: any, cur: string)=> {
                return pre[cur] || {};
            }, list[index]);
        item[keys[0]] = value;
        this.save();
    }

    /**
     * 保存（用于保存页面配置json数据，目前是整份数据覆盖保存）
     */
    public async save(showTip: boolean = true) {
        if (!this.data.config) {
            return false;
        }
        const res = await stateWorkbench.autoSaveStart(
            api.vAuthPost('/api/backweb/workbench/page/change', {
                data: {
                    pageConfig: JSON.stringify(this.data.config)
                },
                refresh: true
            }),
            showTip
        );
        console.log('自动保存', this.data.config);
        Vue.prototype.VIFRAME.send(VIFRAME_KEY.CHANGE_CONFIG, this.data.config);
        if (res && Number(res.code) === 0) {
            return true;
        }
        return false;
    }

    public async check(showDialog: boolean = false) {
        return true;
    }
}

export default Ui;

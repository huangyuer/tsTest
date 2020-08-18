<script lang='tsx'>
import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import { CreateElement } from 'vue';
import { Page, Plugin, ActivityConfig, Pendant, WorkbenchPuginItem } from '@/config';
import { VIFRAME_KEY } from '@/VIFRAME';
import { stateCommon, stateUi, stateWorkbench, stateActivity } from '@/state/index';
import { PluginType } from '@/state/module/activity';
import { EditorTabName } from '@/state/module/workbench';
import EventBusKey from '../../utils/EventBusKey';

interface PluginListInfo {
    editorName: string;
    workbenchPuginItemList: Array<WorkbenchPuginItem<Plugin | Pendant>>;
}

interface PluginInfo {
    editorName: string;
    config: WorkbenchPuginItem<Plugin | Pendant>;
}

@Component
export default class RenderPlugins extends Vue {

    private showAllPlugin: boolean = false;

    private allPluginList: PluginInfo[] = [];

    // private pluginWrapWidth: number = 150;

    public created() {
        this.allPluginList = Object.entries<PluginListInfo>(window.VEDITOR.components)
            .map(([k, v])=> {
                return {
                    editorName: k,
                    ...v
                };
            })
            .filter(item=> item.workbenchPuginItemList?.length > 0)
            .reduce((cur: PluginInfo[], pre: PluginListInfo)=> {
                cur.push(...pre.workbenchPuginItemList.map(item=> {
                    return {
                        editorName: pre.editorName,
                        config: item
                    };
                }));
                return cur;
            }, []);
        this.VIFRAME.on(VIFRAME_KEY.MOVE_INDEX, ({newIndex, oldIndex}: {newIndex: number, oldIndex: number})=> {
            // 监听iframe的移动组件事件（拖动组件）
            stateUi.swapPlugin(newIndex, oldIndex);
        }).on(VIFRAME_KEY.ACTIVE_PLUGIN, (data: {type: PluginType, id: string})=> {
            stateUi.activePluginFromId(data.id, data.type);
            this.$el.querySelector(`#plugins-list-${data.id}`)?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }).on(VIFRAME_KEY.MOVE_PENDANT_END, ({position, id})=> {
            const pendant = stateUi.data.currentPage?.pendants.find(item=> item.id === id);
            if (pendant) {
                pendant.position = position;
                stateUi.save();
            }
        });
    }

    public render(h: CreateElement) {
        return (
            <div class='render-plugins'>
                {
                    this.renderPages()
                }
                <transition name='fade-slide-from-left'>
                {
                    this.renderPlugins()
                }
                </transition>
            </div>
        );
    }

    private renderDialog() {
        const config = stateUi.data.config;
        if (!config || config.dialogs.length <= 0) {
            return '';
        }
        const views: JSX.Element[] = [];
        views.push(<div class='title'>全部弹窗</div>);
        views.push(
            ...config.dialogs.map(item=> {
                const className = ['__item'];
                if (item.id === stateUi.data.currentDialog?.id) {
                    className.push('active');
                }
                return <div class={className} onClick={()=> stateUi.switchDialog(item)}>
                    {item.zhName}
                </div>;
            })
        );
        return views;
    }

    private renderShare() {
        if (!stateActivity.data.baseConfig?.shareConfig?.canShare) {
            return;
        }
        const views: JSX.Element[] = [];
        views.push(<div class='title'>分享效果</div>);
        views.push(
            <div class={['__item', stateWorkbench.data.currentShare === 'weixin' ? 'active' : '']}
                onClick={()=> {
                    if (stateWorkbench.data.currentShare === 'weixin') {
                        stateWorkbench.showSharePreview(null);
                    } else {
                        stateWorkbench.showSharePreview('weixin');
                    }
                }}>
                微信分享
            </div>
        );
        return views;
    }

    private renderPoster() {
        const config = stateUi.data.config;
        if (!config || config.posters.length <= 0) {
            return '';
        }
        const views: JSX.Element[] = [];
        views.push(<div class='title'>全部海报</div>);
        views.push(
            ...config.posters.map(item=> {
                const className = ['__item'];
                if (item.id === stateWorkbench.data.currentPoster?.id) {
                    className.push('active');
                }
                let name = '';
                const associate = stateUi.data.config?.posterAssociate?.find(a=> a.posterId === item.id);
                if (associate && associate.dataList.length > 0) {
                    const first = associate.dataList[0];
                    let plugin: any = '';
                    if (first.type === 'dialog') {
                        plugin = stateUi.data.config?.dialogs.find(dialog=> dialog.id === first.id);
                    } else {
                        const page = stateUi.data.config?.pages.find(p=> p.id === first.pageId);
                        if (page) {
                            plugin = page[first.type + 's'].find(p=> p.id === first.id);
                        }
                    }
                    if (plugin) {
                        name = plugin.zhName;
                    }
                }
                return <div class={className} onClick={()=> {
                    stateWorkbench.showPreviewPoster(item);
                }}>
                    {
                        name && <span class='sub-tip'>({name})</span>
                    }
                    {item.zhName}
                </div>;
            })
        );
        return views;
    }

    private renderPages() {
        const config = stateUi.data.config;
        return <div class='wrap page'>
            <div class='title'>全部页面</div>
            {
                config?.pages.map(item=> {
                    const className = ['__item'];
                    if (item.id === stateUi.data.currentPage?.id) {
                        className.push('active');
                    }
                    // return <div class={className} onClick={()=> stateUi.switchPage(item)}>
                    //     {item.zhName}
                    // </div>;
                    const inputNameId = `${item.id}-input`;
                    return <div class={className}
                        id={item.id}
                        key={item.id}
                        onDblclick={()=> this.focusDom(inputNameId)}
                        onClick={()=> stateUi.switchPage(item)}>
                        <input class='page-name'
                            id={inputNameId}
                            disabled={true}
                            value={item.zhName}
                            onBlur={()=> {
                                const dom = document.getElementById(inputNameId) as any;
                                if (dom) {
                                    dom.disabled = true;
                                }
                                stateUi.save();
                            }}
                            onInput={(value)=> {
                                item.zhName = value.target.value;
                            }} />
                        {
                            item.deletable && <i class='el-icon-delete right-icon' onClick={(e: MouseEvent)=> {
                                e.stopPropagation();
                                // stateUi.deletePlugin(index, PluginType.Plugin);
                            }}></i>
                        }
                    </div>;
                })
            }
            {
            // <div style='width: 100%;margin-bottom: 12px;text-align: center;'>
            //     <el-button size='mini' type='primary' id='__plugin-list-add-btn' onClick={()=> stateUi.addPage()}>新增页面</el-button>
            // </div>
            }
            {
                this.renderDialog()
            }
            {
                this.renderShare()
            }
            {
                this.renderPoster()
            }
        </div>;
    }

    private focusDom(id: string) {
        const dom = document.getElementById(id) as any;
        if (dom) {
            dom.disabled = false;
            dom.focus();
            const len = dom.value.length;
            if ((document as any).selection) {
                const sel = dom.createTextRange();
                sel.moveStart('character', len);
                sel.collapse();
                sel.select();
            } else if (typeof dom.selectionStart === 'number' && typeof dom.selectionEnd === 'number') {
                dom.selectionStart = dom.selectionEnd = len;
            }
        }
    }

    @Watch('pluginWrapWidth')
    private pluginWrapWidthChange() {
        this.$nextTick(()=> {
            setTimeout(() => {
                this.$bus.emit(EventBusKey.RESET_RENDERVIEW);
            }, 150);
        });
    }

    private get pluginWrapWidth() {
        const workbenchWidthData = stateWorkbench.data.width;
        workbenchWidthData.pluginList = 150;
        if (stateUi.data.currentDialog?.id || stateWorkbench.data.currentShare) {
            workbenchWidthData.pluginList = 0;
        }
        if (workbenchWidthData.pluginList) {
            const index = stateWorkbench.data.currentTab;
            const tabName = stateWorkbench.data.workbench?.workbenchConfig.editor[index].name;
            if (tabName !== 'ui') {
                workbenchWidthData.pluginList = 0;
            }
        }
        if  (workbenchWidthData.pluginList) {
            const editor = stateWorkbench.data.workbench?.workbenchConfig.editor;
            if (!editor?.find(item=> item.name === EditorTabName.Ui)) {
                workbenchWidthData.pluginList = 0;
            }
        }
        return workbenchWidthData.pluginList;
    }

    private renderPlugins() {
        const currentPage = stateUi.data.currentPage;
        const currentPlugin = stateUi.data.currentPlugin;
        const currentPluginType = stateUi.data.currentPluginType;
        return <div class='wrap plugin' style={{
                'margin-left': (this.pluginWrapWidth - 150) + 'px'
            }}>
            <div class='plugin-list' style={{
                transform: `translate3d(${this.pluginWrapWidth - 150}px, 0, 0)`
            }}>
                <div class='title'>组件列表</div>
                <draggable
                    value={currentPage?.plugins}
                    draggable='.plugin-drag-item'
                    animation='200'
                    onChange={this.onDragPluginChange.bind(this)}>
                    {
                        currentPage?.plugins.map((item, index)=> {
                            const className = ['__item', 'plugin-drag-item'];
                            if (currentPluginType === PluginType.Plugin && item.id === currentPlugin?.id) {
                                className.push('active');
                            }
                            const id = `plugins-list-${item.id}`;
                            const inputNameId = `${id}-input`;
                            return <div
                                    class={className}
                                    id={id}
                                    key={item.id}
                                    onDblclick={()=> this.focusDom(inputNameId)}
                                    onClick={()=> stateUi.activePlugin(item, PluginType.Plugin)}>
                                    <i class='iconfont icon-drag left-icon'></i>
                                    <input class='name'
                                        id={inputNameId}
                                        disabled={true}
                                        value={item.zhName}
                                        title={item.zhName}
                                        onBlur={()=> {
                                            const dom = document.getElementById(inputNameId) as any;
                                            if (dom) {
                                                dom.disabled = true;
                                            }
                                            stateUi.save();
                                        }}
                                        onInput={(value)=> {
                                            item.zhName = value.target.value;
                                        }} />
                                    {
                                        item.deletable && <i class='el-icon-delete right-icon' onClick={(e: MouseEvent)=> {
                                            e.stopPropagation();
                                            stateUi.deletePlugin(index, PluginType.Plugin);
                                        }}></i>
                                    }
                                </div>;
                        })
                    }
                </draggable>
                <div class='title'>挂件列表</div>
                <draggable
                    value={currentPage?.pendants}
                    draggable='.plugin-drag-item'
                    animation='200'
                    onChange={this.onDragPendantChange.bind(this)}>
                    {
                        currentPage?.pendants.map((item, index)=> {
                            const className = ['__item', 'plugin-drag-item'];
                            if (currentPluginType === PluginType.Pendant && item.id === currentPlugin?.id) {
                                className.push('active');
                            }
                            const id = `plugins-list-${item.id}`;
                            const inputNameId = `${id}-input`;
                            return <div class={className}
                                    id={id}
                                    onClick={()=> stateUi.activePlugin(item, PluginType.Pendant)}
                                    onDblclick={()=> this.focusDom(inputNameId)}>
                                    <i class='iconfont icon-drag left-icon'></i>
                                        <input class='name'
                                            id={inputNameId}
                                            disabled={true}
                                            value={item.zhName}
                                            onBlur={()=> {
                                                const dom = document.getElementById(inputNameId) as any;
                                                if (dom) {
                                                    dom.disabled = true;
                                                }
                                                stateUi.save();
                                            }}
                                            onInput={(value)=> {
                                                item.zhName = value.target.value;
                                            }} />
                                    {
                                        item.deletable && <i class='el-icon-delete right-icon' onClick={()=> stateUi.deletePlugin(index, PluginType.Pendant)}></i>
                                    }
                                </div>;
                        })
                    }
                </draggable>
                <div style='width: 100%;margin-top: 12px;text-align: center;'>
                    <el-button size='mini' type='primary' id='__plugin-list-add-btn' onClick={()=> this.showAllPlugin = true}>新增组件/挂件</el-button>
                </div>
                <div class='tip'>
                    注：组件名称将作为BI数据分析依据，建议根据需要修改。
                </div>
            </div>
            <transition name='fade-slide-from-top'>
            {
                this.renderAllPluginList()
            }
            </transition>
            <transition name='fade-slide-from-top'>
            {
                this.renderMask()
            }
            </transition>
        </div>;
    }

    private renderAllPluginList() {
        if (!this.showAllPlugin) {
            return ;
        }
        if (stateUi.data.currentDialog?.id || stateWorkbench.data.currentShare) {
            return;
        }
        const currentPage = stateUi.data.currentPage;
        // 组件选择列表
        return <div class='__all-plugin-box'>
            <div class='title'>
                <div></div>
                <i class='el-icon-close' onClick={()=> this.showAllPlugin = false}></i>
            </div>
            <el-divider content-position='left'>组件列表</el-divider>
            {
                this.allPluginList.filter(item=> item.config.type !== 'pendant')
                    .filter(item=> {
                        if(item.config.tplOnly) {
                            const index = currentPage?.plugins.findIndex((plugin: Plugin)=> plugin.name === item.config.pluginName);
                            const isBelongCurrentPage = (item.config.pages || []).includes(currentPage?.name || '');
                            return isBelongCurrentPage && (index === undefined || index === -1);
                        }
                        return true;
                    })
                    .filter(item=> {
                        // 0表示无限（为了兼容旧数据）
                        const count = Number(item.config.allowCount) || 0;
                        if (count > 0) {
                            const existCount = currentPage?.plugins.filter((plugin: Plugin)=> plugin.name === item.config.pluginName).length;
                            return (Number(existCount) || 0) < count;
                        }
                        return true;
                    })
                    .map(item=> {
                        return <div
                                class='item'
                                onClick={()=> {
                                    this.showAllPlugin = false;
                                    stateUi.addPlugin(item.config.json, PluginType.Plugin);
                                }}>
                                {
                                    item.config.tplOnly ? '模板:' : ''
                                }
                                {item.config.zhName}
                                {
                                    // <img
                                    //     draggable
                                    //     src='http://bearfile.codebear.cn/avatar.png'
                                    //     style='opacity: 0;position: absolute;top:0;left:0;width:100%;height:100%;'
                                    //     onDragstart={(e: DragEvent)=> {
                                    //         const div = document.createElement('div');
                                    //         div.style.width = '200px';
                                    //         div.style.height = '100px';
                                    //         div.style.top = '-300px';
                                    //         div.style.position = 'absolute';
                                    //         div.style.backgroundSize = 'contain';
                                    //         div.style.backgroundPosition = 'center';
                                    //         div.style.backgroundRepeat = 'no-repeat';
                                    //         document.body.appendChild(div);
                                    //         div.style.backgroundImage = `url(http://bearfile.codebear.cn/avatar.png)`;
                                    //         e?.dataTransfer?.setDragImage(div, 100, 50);
                                    //         // 兼容FireFox
                                    //         // e?.dataTransfer?.setData('text', '');
                                    //     }} />
                                }
                            </div>;
                    })
            }
            <el-divider content-position='left'>挂件列表</el-divider>
            {
                this.allPluginList.filter(item=> item.config.type !== 'plugin')
                    .filter(item=> {
                        if(item.config.tplOnly) {
                            const index = currentPage?.pendants.findIndex((plugin: Pendant)=> plugin.name === item.config.pluginName);
                            const isBelongCurrentPage = (item.config.pages || []).includes(currentPage?.name || '');
                            return isBelongCurrentPage && (index === undefined || index === -1);
                        }
                        return true;
                    })
                    .map(item=> {
                        return <div
                                    class='item'
                                    onClick={()=> {
                                        this.showAllPlugin = false;
                                        stateUi.addPlugin(item.config.json, PluginType.Pendant);
                                    }}>
                                {
                                    item.config.tplOnly ? '模板:' : ''
                                }
                                {item.config.zhName}
                            </div>;
                    })
            }
        </div>;
    }

    private renderMask() {
        // if (!stateUi.data.currentDialog?.id && !stateUi.data.currentShare) {
        //     return;
        // }
        // return <div class='__all-plugin-box'></div>;
    }

    private onDragPluginChange({moved}: {moved: {newIndex: number, oldIndex: number}}) {
        const newIndex = moved.newIndex;
        const oldIndex = moved.oldIndex;
        stateUi.swapPlugin(newIndex, oldIndex, true);
    }

    private onDragPendantChange({moved}: {moved: {newIndex: number, oldIndex: number}}) {
        const newIndex = moved.newIndex;
        const oldIndex = moved.oldIndex;
        stateUi.swapPendant(newIndex, oldIndex, true);
    }
}

</script>

<style lang="less">
.render-plugins {
    position: relative;
    height: 100%;
    min-height: 600px;
    box-shadow: 0px 10px 10px 5px #eeeeee;
    z-index: 1;
    box-sizing: border-box;
    background-color: white;
    display: flex;
    > .wrap {
        position: relative;
        width: 120px;
        height: 100%;
        &.page {
            background-color: #f6f6f6;
            z-index: 3;
            >.__item {
                display: block;
                padding-right: 5px;
                &.active {
                    background-color: white;
                }
                > .sub-tip {
                    font-size: 12px;
                    color: #589ef8;
                }
            }
        }
        &.plugin {
            position: relative;
            z-index: 1;
            width: 150px;
            transition: margin-left .15s linear;
        }
        &.plugin> .plugin-list {
            position: relative;
            width: 150px;
            height: 100%;
            transition: transform .15s linear;
            overflow-y: scroll;
            .__item {
                &.active {
                    background-color: #d9e9fe;
                }
            }
            > .tip {
                width: 100%;
                padding: 10px;
                box-sizing: border-box;
                font-size: 12px;
            }
        }
        >.plugin-list>#__plugin-list-add-btn {
            margin-bottom: 10px;
        }
        > .title,
        >.plugin-list>.title {
            padding: 5px;
            font-size: 12px;
            text-align: left;
            box-sizing: border-box;
            border-left: 4px solid #589ef8;
        }
        .__item,
        >.plugin-list._plugin-name {
            padding: 10px;
            box-sizing: border-box;
            width: 100%;
            display: flex;
            justify-content: flex-start;
            align-items: center;
            font-size: 13px;
            text-align: left;
            transition: background-color .3s linear;
            > .page-name,
            > .name {
                width: 100%;
                font-size: 12px;
                text-align: left;
                background-color: transparent;
                border: none;
                padding: 5px;
                box-sizing: border-box;
                &:focus {
                    outline: 1px solid #bbbbbb;
                }
            }
            > .page-name {
                font-size: 13px;
                padding: 0;
                width: calc(100% - 20px);
            }
            > .left-icon {
                font-size: 10px;
                margin-right: 8px;
            }
            > .right-icon {
                font-size: 12px;
                margin-left: 8px;
            }
        }
        >.__all-plugin-box {
            z-index: 2;
            position: absolute;
            top: 0;
            left: 0;
            background-color: white;
            box-shadow: 0px 10px 10px 5px #eeeeee;
            width: 200px;
            height: 100%;
            overflow-y: scroll;
            padding-top: 35px;
            box-sizing: border-box;
            > .title {
                position: absolute;
                width: 100%;
                top: 0;
                left: 0;
                height: 35px;
                padding: 10px;
                font-size: 14px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                box-sizing: border-box;
            }
            > .item {
                position: relative;
                padding: 10px;
                box-sizing: border-box;
                width: 100%;
                display: flex;
                justify-content: flex-start;
                align-items: center;
                font-size: 14px;
            }
        }
    }
}
</style>
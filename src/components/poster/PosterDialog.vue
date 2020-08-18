<script lang='tsx'>
import { Component, Vue, Watch, Prop, Ref } from 'vue-property-decorator';
import { CreateElement } from 'vue';
import { Page, Plugin, Pendant, PosterPluginConfig, Poster, BackgrountRepeatType, BackgrountPositionType, BackgroundSizeType } from '@/config.ts';
import { VIFRAME_KEY } from '@/VIFRAME';
import { stateCommon, stateUi, statePoster, stateWorkbench } from '@/state/index';
import { PluginType } from '@/state/module/activity';
import qrcode from '@/utils/qrcode.js';
import * as utils from '@/utils/index';
import PreviewPoster from './PreviewPoster.vue';

const backgroundSizeList = [
    {
        label: '默认',
        value: BackgroundSizeType.auto
    },
    {
        label: '裁剪',
        value: BackgroundSizeType.cover
    },
    {
        label: '填充',
        value: BackgroundSizeType.fill
    },
    {
        label: '留白',
        value: BackgroundSizeType.contain
    }
];
const backgroundRepeatList = [
    {
        label: '不平铺',
        value: BackgrountRepeatType.noRepeat
    },
    {
        label: '平铺',
        value: BackgrountRepeatType.repeat
    },
    {
        label: '横向平铺',
        value: BackgrountRepeatType.repeatX
    },
    {
        label: '垂直平铺',
        value: BackgrountRepeatType.repeatY
    }
];

const backgroundPositionList: BackgrountPositionType[] = [];
for (let k of Object.keys(BackgrountPositionType)) {
    backgroundPositionList.push(BackgrountPositionType[k]);
}

@Component
export default class PosterDialog extends Vue {

    private previewScale: number = 1;

    private showDrawer: boolean = false;

    private activeTab: number = 0;

    private get editPoster() {
        return statePoster.data.editPoster;
    }

    private get activityQrcode() {
        return qrcode.create(stateWorkbench.data.publishUrl);
    }

    private get currentPlugin() {
        return statePoster.data.activePlugin;
    }

    private mounted() {
        this.updateActivePlugin();
    }

    @Watch('currentPlugin')
    private updateActivePlugin() {
        if (!this.currentPlugin) {
            this.activePluginId = 'baseConfig';
            return;
        }
        this.activePluginId = this.currentPlugin.id;
    }

    private activePluginId: string = '';

    public render(h: CreateElement) {
        return (
            <el-dialog
                class='poster-edit-dialog'
                {...{on:{'update:visible': val => statePoster.data.show = val}}}
                showClose={false}
                close-on-click-modal={false}
                close-on-press-escape={false}
                append-to-body
                width='1000px'
                visible={statePoster.data.show}>
                <div slot='title'>
                {
                    `${stateUi.data.currentPlugin?.zhName}分享海报`
                }
                <span style='margin-left: 10px;color: #999999;font-size: 14px;'>注：海报模板一旦替换掉，旧模板已编辑过的信息将不做保留。</span>
                </div>
                <div class='poster-edit-dialog-content' v-loading={statePoster.data.loading}>
                    <div class='tpl-list'>
                        {
                            statePoster.data.tpls.length > 0 && <div class='tpl-title'>通用模板</div>
                        }
                        {
                            statePoster.data.tpls.map(tpl=> {
                                const className = ['tpl-name'];
                                if (this.editPoster?.id === tpl.id) {
                                    className.push('active');
                                }
                                return <div class={className} onClick={()=> {
                                    if (this.editPoster?.id === tpl.id) {
                                        return;
                                    }
                                    statePoster.switchPoster(tpl);
                                }}>
                                    {tpl.zhName}
                                </div>;
                            })
                        }
                        {
                            statePoster.data.list.length > 0 && <div class='tpl-title'>当前活动模板</div>
                        }
                        {
                            statePoster.data.list.map(tpl=> {
                                const className = ['tpl-name'];
                                if (this.editPoster?.id === tpl.id) {
                                    className.push('active');
                                }
                                let name = '';
                                const associate = stateUi.data.config?.posterAssociate?.find(a=> a.posterId === tpl.id);
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
                                    if (this.editPoster?.id === tpl.id) {
                                        return;
                                    }
                                    statePoster.switchPoster(tpl);
                                }}>
                                    {
                                        name && <span class='tip'>({name})</span>
                                    }
                                    {tpl.zhName}
                                </div>;
                            })
                        }
                    </div>
                    <div class='left-wrap' ref='previewLeftWrap'>
                        <PreviewPoster props={{
                            editable: true,
                            contentScale: 0.8,
                            editPoster: statePoster.data.editPoster
                        }} />
                    </div>
                    <div class='right-wrap'>
                        <div class='layer-wrap'>
                        {
                            this.renderCollapse()
                        }
                        {
                            this.renderLayer()
                        }
                        </div>
                        <div class='style-tab'>
                            <span class={{'tab': true, 'active-tab' : this.activeTab === 0}} onClick={()=> this.activeTab=0}>设置</span>
                            <span class={{'tab': true, 'active-tab' : this.activeTab === 1}} onClick={()=> this.activeTab=1}>图层</span>
                        </div>
                    </div>
                    {this.renderDrawer()}
                </div>
                <div slot='footer' class='dialog-footer'>
                    <el-button size='mini' onClick={()=> {statePoster.cancel();}}>取消</el-button>
                    <el-button size='mini' disabled={statePoster.data.loading} type='primary' onClick={()=> {statePoster.save();}}>保存</el-button>
                </div>
            </el-dialog>
        );
    }

    private get layerList() {
        if (!this.editPoster) {
            return [];
        }
        const list: Array<PosterPluginConfig<any>> = [];
        for (let i = this.editPoster.pluginList.length - 1;i >= 0;--i) {
            list.push(this.editPoster.pluginList[i]);
        }
        return list;
    }

    private renderLayer() {
        if (this.activeTab !== 1) {
            return;
        }
        if (!this.editPoster) {
            return;
        }
        return <div class='layer-list'>
            <draggable
                value={this.layerList}
                draggable='.layer-drag-item'
                animation='200'
                onChange={this.onDragPluginChange.bind(this)}>
                {
                    this.layerList.map((item, index)=> {
                        const className = ['__item', 'layer-drag-item'];
                        if (this.activePluginId === item.id) {
                            className.push('active');
                        }
                        const id = `layer-list-${item.id}`;
                        const inputNameId = `${id}-input`;
                        return <div class={className}
                                id={id}
                                onClick={()=> statePoster.data.activePlugin = item}
                                onDblclick={()=> this.focusDom(inputNameId)}>
                                <i class='iconfont icon-drag left-icon'></i>
                                    <input class='name'
                                        id={inputNameId}
                                        disabled={true}
                                        value={item.name}
                                        onBlur={()=> {
                                            const dom = document.getElementById(inputNameId) as any;
                                            if (dom) {
                                                dom.disabled = true;
                                            }
                                            // stateUi.save();
                                        }}
                                        onInput={(value)=> {
                                            item.name = value.target.value;
                                        }} />
                                {
                                    <i class='el-icon-delete right-icon' onClick={()=> statePoster.deletePlugin(item)}></i>
                                }
                            </div>;
                    })
                }
            </draggable>
        </div>;
    }

    private onDragPluginChange({moved}: {moved: {newIndex: number, oldIndex: number}}) {
        const pluginList = this.editPoster?.pluginList;
        if (!pluginList) {
            return;
        }
        const newIndex = pluginList.length - moved.newIndex - 1;
        const oldIndex = pluginList.length - moved.oldIndex - 1;
        if (newIndex < oldIndex) {
            pluginList.splice(newIndex, 0, pluginList[oldIndex]);
            pluginList.splice(oldIndex + 1, 1);
        } else {
            pluginList.splice(newIndex + 1, 0, pluginList[oldIndex]);
            pluginList.splice(oldIndex, 1);
        }
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

    private renderCollapse() {
        if (this.activeTab !== 0) {
            return;
        }
        if (!this.editPoster) {
            return;
        }
        return <el-collapse value={this.activePluginId} accordion>
                {
                    this.renderPosterConfig()
                }
                {
                    this.editPoster.pluginList.map(plugin=> {
                        let views: JSX.Element[] | JSX.Element = [];
                        switch(plugin.type) {
                            case 'image':
                                views = this.renderImageEditor(plugin);
                                break;
                            case 'text':
                                views = this.renderTextEditor(plugin);
                                break;
                            case 'textarea':
                                views = this.renderTextareaEditor(plugin);
                                break;
                            case 'simpleShape':
                                views = this.renderSimpleShapeEditor(plugin);
                                break;
                        }
                        const pluginClassName: string[] = [''];
                        if (this.currentPlugin?.id === plugin.id) {
                            pluginClassName.push('active-plugin');
                        }
                        return  <el-collapse-item
                            title={plugin.name}
                            name={plugin.id}
                            key={plugin.id}
                            id={plugin.id}
                            class={pluginClassName}
                            nativeOnClick={(e)=> this.clickCollapseItem(e, plugin)}>
                            <div class='editor-content'>
                                <el-button size='mini' onClick={()=> this.showDrawer = true}>通用配置</el-button>
                                {views}
                            </div>
                        </el-collapse-item>;
                    })
                }
        </el-collapse>;
    }

    private renderPosterConfig() {
        if (!this.editPoster) {
            return;
        }
        const className: string[] = [];
        if (this.currentPlugin === null) {
            className.push('active-plugin');
        }
        const outConfig = this.editPoster.outConfig;
        const backgroundSizeType = backgroundSizeList.find(item=> item.value === outConfig.background.size) || backgroundSizeList[0];
        const backgroundRepeatType = backgroundRepeatList.find(item=> item.value === outConfig.background.repeat) || backgroundRepeatList[0];
        return <el-collapse-item
                name='baseConfig'
                key='baseConfig'
                id='baseConfig'
                class={className}
                nativeOnClick={(e)=> this.clickCollapseItem(e, 'baseConfig')}>
                <template slot='title'>
                    <div class='editor-plugin-title'>海报配置</div>
                </template>
                <div class='editor-content'>
                    <div class='line'>
                        <commLabelInput
                            config={{
                                label: '海报宽高',
                                labelWidth: '80px'
                            }}
                            v-model={this.editPoster.outConfig.width} />
                        <commLabelInput style='margin-left: 8px;' v-model={this.editPoster.outConfig.height} />
                    </div>
                    <div class='line'>
                        <commLabelColorPicker
                            config={{
                                label: '背景颜色',
                                labelWidth: '80px'
                            }}
                            onPreview={({value})=> {
                                if (!this.editPoster) {
                                    return;
                                }
                                this.editPoster.outConfig.background.color = value;
                            }}
                            v-model={this.editPoster.outConfig.background.color} />
                    </div>
                    <div class='line'>
                        <commLabelUpload
                            config={{
                                label: '背景图片',
                                labelWidth: '80px',
                                closeable: this.editPoster.outConfig.background.image !== ''
                            }}
                            v-model={this.editPoster.outConfig.background.image}
                            onClose={()=> {
                                if (!this.editPoster) {
                                    return;
                                }
                                this.editPoster.outConfig.background.image = '';
                            }} />
                    </div>
                    <div class='line'>
                        <commLabelRadio
                            config={{
                                label: '背景填充',
                                labelWidth: '80px',
                                list: backgroundSizeList
                            }}
                            value={backgroundSizeType}
                            onSave={({value})=> {
                                outConfig.background.size = value.value;
                            }} />
                    </div>
                    <div class='line'>
                        <commLabelRadio
                            config={{
                                label: '背景平铺',
                                labelWidth: '80px',
                                list: backgroundRepeatList
                            }}
                            value={backgroundRepeatType}
                            onSave={({value})=> {
                                outConfig.background.repeat = value.value;
                            }} />
                    </div>
                    <div class='line'>
                        <div class='label'>背景对齐</div>
                        <div class='position-box'>
                            {
                                backgroundPositionList.map(position=> {
                                    const positionClass = ['item'];
                                    if (position === outConfig.background.position) {
                                        positionClass.push('active');
                                    }
                                    return <div class={positionClass} onClick={()=> {
                                        outConfig.background.position = position;
                                    }}></div>;
                                })
                            }
                        </div>
                    </div>
                </div>
            </el-collapse-item>;
    }

    private clickCollapseItem(e, plugin: PosterPluginConfig | string) {
        setTimeout(()=> {
            const classList = e.target?.classList;
            if (classList?.contains('el-collapse-item__header')) {
                if (classList?.contains('is-active')) {
                    if (typeof plugin === 'string') {
                        statePoster.data.activePlugin = null;
                        return;
                    }
                    statePoster.data.activePlugin = plugin;
                } else {
                    if (typeof plugin === 'string') {
                        return;
                    }
                    if (plugin.id === this.currentPlugin?.id) {
                        statePoster.data.activePlugin = null;
                    }
                }
            }
        }, 200);
    }

    private renderSimpleShapeEditor(plugin: PosterPluginConfig) {
        return [
            <div class='line'>
                <commLabelColorPicker
                    style='margin-left: 8px;'
                    v-model={plugin.config.backgroundColor}
                    onPreview={({value})=> {
                        plugin.config.backgroundColor = value;
                    }} />
            </div>
        ];
    }

    private renderTextEditor(plugin: PosterPluginConfig) {
        if (typeof plugin.config.textDecoration === 'string') {
            plugin.config.textDecoration = [];
        }
        return [
            <div class='line'>
                <commLabelInput
                    v-model={plugin.config.text}
                    config={{
                        label: '文案',
                        labelWidth: '80px',
                        width: '320px',
                        info: {
                            list: statePoster.data.textScopeList.map(item=> {
                                return `若需要插入${item.name}，请输入${item.code}`;
                            })
                        }
                    }} />
                <commLabelColorPicker
                    style='margin-left: 8px;'
                    v-model={plugin.config.color}
                    onPreview={({value})=> {
                        plugin.config.color = value;
                    }} />
            </div>,
            <div class='line'>
                <commLabelInput
                    v-model={plugin.config.fontSize}
                    config={{
                        label: '字体大小',
                        labelWidth: '80px',
                    }} />
            </div>,
            <div class='line'>
                <commLabelInput
                    v-model={plugin.config.letterSpacing}
                    config={{
                        label: '字间距',
                        labelWidth: '80px',
                    }} />
            </div>,
            <div class='line'>
                <commLabelInput
                    v-model={plugin.config.lineHeight}
                    config={{
                        label: '行高',
                        labelWidth: '80px',
                        info: {
                            list: ['加上单位b，会被识别为倍数', '比如1.2b，表示字体大小的1.2倍']
                        }
                    }} />
            </div>,
            <div class='line'>
                <div class='label'>文本样式</div>
                <el-tooltip class='item' effect='dark' content='加粗' placement='bottom'>
                    <i class={['icon iconfont icon-bold', plugin.config.fontWeight === 'bold' ? 'active' : '']} onClick={()=> {
                        plugin.config.fontWeight = plugin.config.fontWeight === 'bold' ? 'normal' : 'bold';
                    }}></i>
                </el-tooltip>
                <el-tooltip class='item' effect='dark' content='斜体' placement='bottom'>
                    <i class={['icon iconfont icon-italic', plugin.config.fontStyle === 'italic' ? 'active' : '']} onClick={()=> {
                        plugin.config.fontStyle = plugin.config.fontStyle === 'italic' ? 'normal' : 'italic';
                    }}></i>
                </el-tooltip>
                {
                    // <el-tooltip class='item' effect='dark' content='上划线' placement='bottom'>
                    //     <i class={['icon iconfont icon-overline', plugin.config.textDecoration.includes('overline') ? 'active' : '']} onClick={()=> {
                    //         const index = plugin.config.textDecoration.indexOf('overline');
                    //         if (index> -1) {
                    //             plugin.config.textDecoration.splice(index, 1);
                    //         } else {
                    //             plugin.config.textDecoration.push('overline');
                    //         }
                    //     }}></i>
                    // </el-tooltip>
                }
                {
                    // <el-tooltip class='item' effect='dark' content='下划线' placement='bottom'>
                    //     <i class={['icon iconfont icon-underline', plugin.config.textDecoration.includes('underline') ? 'active' : '']} onClick={()=> {
                    //         const index = plugin.config.textDecoration.indexOf('underline');
                    //         if (index> -1) {
                    //             plugin.config.textDecoration.splice(index, 1);
                    //         } else {
                    //             plugin.config.textDecoration.push('underline');
                    //         }
                    //     }}></i>
                    // </el-tooltip>
                }
                {
                    // <el-tooltip class='item' effect='dark' content='删除线' placement='bottom'>
                    //     <i class={['icon iconfont icon-line-through', plugin.config.textDecoration.includes('line-through') ? 'active' : '']} onClick={()=> {
                    //         const index = plugin.config.textDecoration.indexOf('line-through');
                    //         if (index> -1) {
                    //             plugin.config.textDecoration.splice(index, 1);
                    //         } else {
                    //             plugin.config.textDecoration.push('line-through');
                    //         }
                    //     }}></i>
                    // </el-tooltip>
                }
                <el-tooltip class='item' effect='dark' content='文本左对齐' placement='bottom'>
                    <i class={['icon iconfont icon-align-left-inside', plugin.config.textAlign === 'left' ? 'active' : '']} onClick={()=> {
                        plugin.config.textAlign = 'left';
                    }}></i>
                </el-tooltip>
                <el-tooltip class='item' effect='dark' content='文本居中对齐' placement='bottom'>
                    <i class={['icon iconfont icon-align-center-inside', plugin.config.textAlign === 'center' ? 'active' : '']} onClick={()=> {
                        plugin.config.textAlign = 'center';
                    }}></i>
                </el-tooltip>
                <el-tooltip class='item' effect='dark' content='文本右对齐' placement='bottom'>
                    <i class={['icon iconfont icon-align-right-inside', plugin.config.textAlign === 'right' ? 'active' : '']} onClick={()=> {
                        plugin.config.textAlign = 'right';
                    }}></i>
                </el-tooltip>
            </div>
        ];
    }

    private renderTextareaEditor(plugin: PosterPluginConfig) {
        return <div class='line'>
            <commLabelEditor
                v-model={plugin.config.text}
                config={{
                    label: '文案',
                    labelWidth: '80px',
                    editorWidth: '300px',
                    info: {
                        list: statePoster.data.textScopeList.map(item=> {
                            return `若需要插入${item.name}，请输入${item.code}`;
                        })
                    }
                }} />
        </div>;
    }

    private renderImageEditor(plugin: PosterPluginConfig) {
        const imgType = statePoster.data.imgScopeList.find(item=> item.code === plugin.config.url);
        let type = imgType ? '动态图片' : '上传图片';
        const views = [
            <div class='line'>
                <commLabelRadio
                    value={type}
                    config={{
                        label: '类型',
                        labelWidth: '80px',
                        list: ['动态图片', '上传图片']
                    }}
                    onSave={({value})=> {
                        if (value === '动态图片') {
                            plugin.config.url = statePoster.data.imgScopeList[0].code;
                        } else {
                            plugin.config.url = '';
                        }
                    }} />
            </div>
        ];
        if (type === '动态图片') {
            const list = statePoster.data.imgScopeList.map(item=> {
                return {
                    label: item.name,
                    value: item.code
                };
            });
            let imgScope = list.find(item=> item.value === plugin.config.url) || list[0];
            views.push(
                <div class='line'>
                    <commLabelSelect
                        value={imgScope}
                        config={{
                            label: '动态值',
                            labelWidth: '80px',
                            list
                        }}
                        onSave={({value})=> {
                            plugin.config.url = value.value;
                        }} />
                </div>
            );
        } else {
            views.push(
                <div class='line'>
                    <commLabelUpload
                        v-model={plugin.config.url}
                        config={{
                            label: '图片',
                            labelWidth: '80px'
                        }} />
                </div>
            );
        }
        return views;
    }

    private renderDrawer() {
        if (!this.currentPlugin) {
            return;
        }
        return <el-drawer
            visible={this.showDrawer}
            {...{on:{'update:visible': val => this.showDrawer = val}}}
            size='500px'
            modal={false}
            with-header={false}>
            {
                this.renderDrawerContent()
            }
        </el-drawer>;
    }

    private renderDrawerContent() {
        if (!this.showDrawer) {
            return;
        }
        const plugin = this.currentPlugin;
        const commConfig = plugin?.commConfig;
        if (!plugin || !commConfig) {
            return;
        }
        return <div class='poster-editor-drawer'>
                <div class='fixed-title'>
                    <div class='title'>组件：{plugin.name}</div>
                    <div class='close-btn' onClick={()=> this.showDrawer = false}><i class='el-icon-close'></i></div>
                </div>
                {
                    // 之所以加上这个，因为el-drawer打开会默认给第一个输入框聚焦。。。
                    <input style='width:1px;height:1px;opacity:0;position:absolute;' />
                }
                <div class='line'>
                    <commLabelInput
                        config={{
                            label: '组件名称',
                            labelWidth: '80px'
                        }}
                        v-model={plugin.name} />
                </div>
                <div class='line'>
                    <commLabelSwitch
                        v-model={plugin.hidden}
                        config={{
                            labelWidth: '80px',
                            label: '隐藏元素'
                        }} />
                </div>
                <div class='line'>
                    <commLabelInput
                        config={{
                            label: '位置',
                            labelWidth: '80px'
                        }}
                        v-model={plugin.commConfig.left} />
                    <commLabelInput style='margin-left: 8px;' v-model={plugin.commConfig.top} />
                </div>
                <div class='line'>
                    <commLabelInput
                        config={{
                            label: '宽高',
                            labelWidth: '80px'
                        }}
                        v-model={plugin.commConfig.width} />
                    <commLabelInput style='margin-left: 8px;' v-model={plugin.commConfig.height} />
                </div>
                <div class='line'>
                    <commLabelSlider
                        v-model={commConfig.opacity}
                        config={{
                            labelWidth: '80px',
                            width: '300px',
                            label: '透明度',
                            min: 0,
                            max: 1,
                            step: 0.01
                        }} />
                </div>
                <div class='line'>
                    <commLabelSwitch
                        v-model={commConfig.border.open}
                        config={{
                            labelWidth: '80px',
                            label: '开启边框'
                        }} />
                </div>
                {
                    this.drawBorderConfig()
                }
            </div>;
    }

    private drawBorderConfig() {
        const plugin = this.currentPlugin;
        const commConfig = plugin?.commConfig;
        if (!commConfig) {
            return;
        }
        if (!commConfig.border.open) {
            return;
        }
        return [
            <div class='line sub-line'>
                <commLabelInput
                    v-model={commConfig.border.radius}
                    config={{
                        labelWidth: '80px',
                        label: '圆角大小'
                    }} />
            </div>
        ];
    }
}

</script>

<style lang="less">
.poster-edit-dialog {
    display: flex;
    justify-content: center;
    align-items: center;
    > .el-dialog {
        position: absolute;
        margin: 0 !important;
        // top: 50% !important;
        // left: 50% !important;
        // transform: translate3d(-50%, -50%, 0);
        > .el-dialog__body {
            padding: 0;
            > .poster-edit-dialog-content {
                position: relative;
                width: 100%;
                height: 70vh;
                border-top: 1px solid #eeeeee;
                border-bottom: 1px solid #eeeeee;
                display: flex;
                > .tpl-list {
                    position: relative;
                    width: 150px;
                    height: 100%;
                    background-color: white;
                    overflow-y: scroll;
                    &::-webkit-scrollbar {
                        display: none;
                    }
                    > .tpl-title {
                        width: 100%;
                        font-size: 12px;
                        padding: 8px;
                        box-sizing: border-box;
                        border-left: 4px solid #589ef8;
                    }
                    > .tpl-name {
                        width: 100%;
                        font-size: 14px;
                        padding: 8px;
                        box-sizing: border-box;
                        > .tip {
                            font-size: 12px;
                            color: #589ef8;
                        }
                        &.active {
                            background-color: #eaecf1;
                        }
                    }
                }
                > .left-wrap {
                    position: relative;
                    width: 350px;
                    height: 100%;
                    background-color: #eaecf1;
                    overflow: hidden;
                    > .back-box {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform-origin: center;
                        transform: translate3d(-50%, -50%, 0);
                        > .icon-list {
                            position: absolute;
                            right: 10px;
                            top: -10px;
                            transform: translate3d(0, -100%, 0);
                            display: flex;
                            > .el-dropdown>.icon,
                            > .icon {
                                width: 30px;
                                height: 30px;
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                background-color: white;
                                font-size: 24px;
                                border-radius: 30px;
                                box-shadow: 0px 0px 10px 5px #dddddd;
                                margin-left: 10px;
                            }
                        }
                    }
                }
                > .right-wrap {
                    position: relative;
                    flex: 1;
                    box-sizing: border-box;
                    overflow: hidden;
                    > .style-tab {
                        width: 100%;
                        display: flex;
                        flex-direction: row;
                        text-align: center;
                        box-shadow: 0px 1px 5px 1px rgba(0, 0, 0, .1);
                        z-index: 10;
                        height: 40px;
                        font-size: 14px;
                        position: absolute;
                        top: 0;
                        left: 0;
                        > .tab {
                            flex: 1;
                            padding: 10px;
                            background-color: white;
                            color: #3e4651;
                            cursor: pointer;
                            &.active-tab {
                                background-color: #3e4651;
                                color: white;
                            }
                        }
                    }
                    > .layer-wrap {
                        height: 100%;
                        overflow-y: scroll;
                        &::-webkit-scrollbar {
                            display: none;
                        }
                        > .layer-list {
                            margin-top: 40px;
                            width: 100%;
                            height: 100%;
                            height: 100%;
                            overflow-y: scroll;
                            .__item {
                                padding: 10px;
                                box-sizing: border-box;
                                width: 100%;
                                display: flex;
                                justify-content: flex-start;
                                align-items: center;
                                font-size: 13px;
                                text-align: left;
                                transition: background-color .3s linear;
                                > .name {
                                    width: 100%;
                                    font-size: 12px;
                                    text-align: left;
                                    background-color: transparent;
                                    border: none;
                                    padding: 5px;
                                    box-sizing: border-box;
                                    margin: 0 15px;
                                    &:focus {
                                        outline: 1px solid #bbbbbb;
                                    }
                                }
                                &.active {
                                    background-color: #d9e9fe;
                                }
                            }
                        }
                        .editor-content {
                            padding: 8px 15px;
                            > .line {
                                padding: 8px 0;
                                display: flex;
                                align-items: center;
                                > .mr {
                                    margin-right: 8px;
                                }
                                > .label {
                                    width: 92px;
                                }
                                > .position-box {
                                    display: flex;
                                    flex-wrap: wrap;
                                    justify-content: space-between;
                                    width: 70px;
                                    height: 70px;
                                    > .item {
                                        width: 20px;
                                        height: 20px;
                                        border: 1px solid #cccccc;
                                        &.active {
                                            border-color: #589ef8;
                                        }
                                        &:hover {
                                            border-color: #589ef8;
                                        }
                                    }
                                }
                                > .icon {
                                    width: 30px;
                                    height: 30px;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    &.active,
                                    &:hover {
                                        color: white;
                                        background-color: #589ef8;
                                    }
                                }
                            }
                        }
                        > .el-collapse {
                            margin-top: 40px;
                            > .el-collapse-item {
                                &.active-plugin {
                                    > .el-collapse-item__wrap {
                                        margin: 0 2px;
                                        outline: 2px solid #589ef8;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

.poster-editor-drawer {
    position: relative;
    width: 100%;
    height: calc(100vh - 60px);
    padding-top: 44px;
    overflow: scroll;
    &::-webkit-scrollbar {
        display: none;
    }
    > .fixed-title {
        top: 0;
        position: fixed;
        background-color: white;
        width: 100%;
        height: 44px;
        z-index: 10;
        > .title {
            width: calc(100% - 44px);
            display: flex;
            align-items: center;
            padding: 10px 5px;
            font-weight: bold;
            border-bottom: 1px solid #eeeeee;
        }
        > .close-btn {
            position: fixed;
            top: 0;
            right: 0px;
            width: 44px;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
    }
    > .line {
        padding: 8px;
        display: flex;
        > .comm-label-wrap {
            > .comm-label {
                font-weight: bold;
            }
        }
    }
    > .sub-line {
        > .comm-label-wrap {
            font-size: 12px;
            > .comm-label {
                font-weight: normal;
            }
        }
    }
}
</style>
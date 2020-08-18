<script lang='tsx'>
import { Component, Vue, Watch, Prop } from 'vue-property-decorator';
import { CreateElement } from 'vue';
import { Page, Plugin, Pendant } from '@/config';
import { VIFRAME_KEY } from '@/VIFRAME';
import { stateCommon, stateUi, stateWorkbench, stateRaffle } from '@/state/index';
import { PluginType } from '@/state/module/activity';
import api from '../../api';

interface PluginItem<T extends Plugin> {
    name: string;
    plugin: T;
    type: PluginType;
}

const pendantFixedTypeList = [{
    label: '固定在屏幕',
    value: 'fixed'
}, {
    label: '固定在页面',
    value: 'absolute'
}];

const pendantModeList = [{
    label: '是',
    value: 'dragable'
}, {
    label: '否',
    value: 'fixed'
}];

const alignTypeList = [{
    label: '左对齐',
    value: 'left'
}, {
    label: '居中对齐',
    value: 'center'
}, {
    label: '右对齐',
    value: 'right'
}];

const pendantAlignVList = [{
    label: '上',
    value: 'top'
},{
    label: '下',
    value: 'bottom'
}];

const pendantAlignHList = [{
    label: '左',
    value: 'left'
},{
    label: '右',
    value: 'right'
}];

@Component
export default class EditorPlugin extends Vue {

    private innerActiveIds: string[] = [];
    private innerActiveId: string = '';
    private showDrawerCommPluginEditor: boolean = false;
    private showDrawerCommPendantEditor: boolean = false;

    private lockRadius: boolean | null = null;

    private watchList: boolean = false;

    private get currentPage() {
        return stateUi.data.currentPage;
    }

    private get currentPlugin() {
        return stateUi.data.currentPlugin;
    }

    private get currentPluginType() {
        return stateUi.data.currentPluginType;
    }

    private get list() {
        // 组件列表
        const pluginList: Array<PluginItem<Plugin>> = this.currentPage?.plugins.map(plugin=> {
            return {
                name: PluginType.Plugin + '@' + plugin.id,
                plugin,
                type: PluginType.Plugin
            };
        }) || [];
        // 挂件列表
        const pendantList: Array<PluginItem<Pendant>> = this.currentPage?.pendants.map(plugin=> {
            return {
                name: PluginType.Pendant + '@' + plugin.id,
                plugin,
                type: PluginType.Pendant
            };
        }) || [];
        return {plugin: pluginList, pendant: pendantList};
    }

    public created() {
        // 默认全部展开
        this.innerActiveIds = this.getIds();
        this.innerActiveId = this.innerActiveIds[0];
        this.watchList = true;
        stateWorkbench.data.currentTabStatus = true;
    }

    @Watch('currentPage')
    private updateCurrentPage() {
        // 默认全部展开
        this.watchList = false;
        // this.innerActiveIds = [];
        setTimeout(() => {
            this.innerActiveIds = this.getIds();
            this.watchList = true;
        }, 300);
    }

    @Watch('currentPlugin')
    private updateCurrentPlugin() {
        if (!this.currentPlugin) {
            return;
        }
        const type = stateUi.data.currentPluginType;
        const id = type + '@' + this.currentPlugin.id;
        this.innerActiveId = id;
        if (!this.innerActiveIds.includes(id)) {
            this.innerActiveIds.push(id);
        }
        this.$nextTick(()=> {
            setTimeout(() => {
                document.getElementById(id)?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }, 100);
        });
        if (this.showDrawerCommPluginEditor) {
            if (type === PluginType.Pendant) {
                this.showDrawerCommPluginEditor = false;
                setTimeout(() => {
                    this.showDrawerCommPendantEditor = true;
                }, 400);
            }
        } else if (this.showDrawerCommPendantEditor) {
            if (type === PluginType.Plugin) {
                this.showDrawerCommPendantEditor = false;
                setTimeout(() => {
                    this.showDrawerCommPluginEditor = true;
                }, 400);
            }
        }
    }

    private getIds(list?: {plugin: Array<PluginItem<Plugin>>, pendant: Array<PluginItem<Pendant>>}) {
        list = list || this.list;
        return [
            ...list.plugin.map(item=> item.name),
            ...list.pendant.map(item=> item.name)
        ];
    }

    @Watch('list')
    private updateList(newData, oldData) {
        if (!this.watchList) {
            return;
        }
        // 列表数量改变时，要做相应的变化
        // const newIds = this.getIds(newData);
        // const newLen = newData.plugin.length + newData.pendant.length;
        // const oldLen = oldData.plugin.length + oldData.pendant.length;
        // if (newLen < oldLen) {
        //     this.innerActiveIds = this.innerActiveIds.filter(id=> newIds.includes(id));
        // } else if (newLen > oldLen) {
        //     const oldIds = this.getIds(oldData);
        //     this.innerActiveIds.push(...newIds.filter(id=> !oldIds.includes(id)));
        // }
    }

    private get pageConfig() {
        return Vue.observable({
            title: this.currentPage?.config.title,
            backgroundColor: this.currentPage?.config.backgroundColor,
            backgroundImage: this.currentPage?.config.backgroundImage,
        });
    }

    public render(h: CreateElement) {
        return (
            <div class='editor-plugin'>
                <p class='page-title'>{this.currentPage?.zhName}</p>
                <p class='config-title'>页面配置</p>
                {
                    this.renderPageConfig()
                }
                <el-collapse v-model={this.innerActiveId} accordion>
                    <p class='config-title'>组件配置</p>
                    {
                        this.list.plugin.map(item=> this.renderPluginEditor(item))
                    }
                    <p class='config-title'>挂件配置</p>
                    {
                        this.list.pendant.map(item=> this.renderPluginEditor(item))
                    }
                </el-collapse>
                {
                    this.renderDrawerPluginEditor()
                }
                {
                    this.renderDrawerPendantEditor()
                }
            </div>
        );
    }

    private renderPluginEditor<T extends Plugin>(item: PluginItem<T>) {
        const currentPluginType = stateUi.data.currentPluginType;
        const currentValue = currentPluginType + '@' + this.currentPlugin?.id;
        // 得到组件编辑区的组件名，如WEditorVButton
        const editorName = 'WEditor' + item.plugin.name;
        const className: string[] = [];
        if (currentValue === item.name) {
            className.push('active-plugin');
        }
        const outConfig = item.plugin.outConfig;
        return <el-collapse-item
            name={item.name}
            key={item.name}
            id={item.name}
            class={className}
            nativeOnClick={(e)=> this.clickCollapseItem(e, item)}>
            <template slot='title'>
                <div class='editor-plugin-title'>
                    {item.plugin.zhName}
                    {
                        outConfig.hidden ? <span class='hidden-tip'>(已隐藏)</span> : ''
                    }
                </div>
            </template>
            <div class='editor-content' onClick={()=> stateUi.activePlugin(item.plugin, item.type)}>
                <div class='line'>
                    <el-button size='mini' onClick={()=> {
                        this.lockRadius = null;
                        switch(item.type) {
                            case PluginType.Plugin:
                                this.showDrawerCommPluginEditor = true;
                                break;
                            case PluginType.Pendant:
                                this.showDrawerCommPendantEditor = true;
                                break;
                        }
                    }}>打开通用配置</el-button>
                </div>
                <editorName props={{plugin: JSON.parse(JSON.stringify(item.plugin)), type: item.type}}/>
            </div>
        </el-collapse-item>;
    }

    private renderPageConfig() {
        return (
            <div class='page-config' onClick={()=> stateUi.resetActivePlugin()}>
                <div class='line'>
                    <commLabelInput
                        v-model={this.pageConfig.title}
                        config={{
                            label: '页面标题',
                            labelWidth: '100px',
                            info: {
                                list: ['不填写会自动读取系统默认标题']
                            }
                        }}
                        onPreview={(data)=> {
                            stateUi.previewPageConfig('config.title', data.value, true);
                        }}
                        onClickOutside={()=> stateUi.save()} />
                </div>
                <div class='line'>
                    <commLabelUpload
                        v-model={this.pageConfig.backgroundImage}
                        config={{
                            label: '背景图片',
                            labelWidth: '100px',
                            closeable: this.pageConfig.backgroundImage !== ''
                        }}
                        onClose={()=> {
                            stateUi.previewPageConfig('config.backgroundImage', '', true);
                            stateUi.save();
                        }}
                        onSave={({value})=> {
                            stateUi.previewPageConfig('config.backgroundImage', value, true);
                            stateUi.save();
                        }} />
                </div>
                <div class='line'>
                    <commLabelColorPicker
                        v-model={this.pageConfig.backgroundColor}
                        config={{
                            label: '背景颜色',
                            labelWidth: '100px',
                        }}
                        onSave={({value})=> {
                            stateUi.previewPageConfig('config.backgroundColor', value, true);
                            stateUi.save();
                        }}
                        onPreview={({value})=> {
                            stateUi.previewPageConfig('config.backgroundColor', value);
                        }}
                        onClickOutside={({value})=> {
                            stateUi.previewPageConfig('config.backgroundColor', value, true);
                        }} />
                    <el-button size='mini' style='margin-left: 10px' onClick={()=> {
                        const img = document.createElement('img');
                        img.onload = ()=> {
                            const color = this.getImageData(img);
                            if (!color) {
                                this.$message.error('自动提取失败');
                                return;
                            }
                            stateUi.previewPageConfig('config.backgroundColor', color, true);
                            stateUi.save();
                        };
                        img.onerror = (e)=> {
                            console.log('error', e);
                            this.$message.error('自动提取失败');
                        };
                        img.setAttribute('crossorigin', 'anonymous');
                        img.src = `${api.host}/api/backweb/util/proxy?url=${encodeURIComponent(`${this.pageConfig.backgroundImage}`)}`;
                    }}>从背景图提取</el-button>
                </div>
            </div>
        );
    }

    private getImageData(img: HTMLImageElement) {
        const canvas = document.createElement('canvas');
        const context: CanvasRenderingContext2D | null = canvas.getContext('2d');
        if (!context) {
            return;
        }
        canvas.width = Math.round(img.width);
        canvas.height = Math.round(img.height);
        context.drawImage(img, 0, 0);
        const width = canvas.width;
        const height = Math.round(10);
        const data: Uint8ClampedArray = context.getImageData(0, canvas.height - height, canvas.width, height).data;
        let r = 0;
        let g = 0;
        let b = 0;
        // 取所有像素的平均值
        for (let row = 0; row < height; ++row) {
            for (let col = 0; col < width; ++col) {
                if (row === 0) {
                    r += data[((width * row) + col)];
                    g += data[((width * row) + col) + 1];
                    b += data[((width * row) + col) + 2];
                } else {
                    r += data[((width * row) + col) * 4];
                    g += data[((width * row) + col) * 4 + 1];
                    b += data[((width * row) + col) * 4 + 2];
                }
            }
        }
        // 求取平均值
        r /= (width * height);
        g /= (width * height);
        b /= (width * height);

        // 将最终的值取整
        r = Math.round(r);
        g = Math.round(g);
        b = Math.round(b);
        return `rgb(${r},${g},${b})`;
    }

    private clickCollapseItem<T extends Plugin>(e, item: {plugin: T, type: PluginType}) {
        setTimeout(()=> {
            const classList = e.target?.classList;
            if (classList?.contains('el-collapse-item__header')) {
                if (classList?.contains('is-active')) {
                    stateUi.activePlugin(item.plugin, item.type);
                } else {
                    const currentPluginType = stateUi.data.currentPluginType;
                    const currentValue = currentPluginType + '@' + this.currentPlugin?.id;
                    const value = item.type + '@' + item.plugin.id;
                    if (value === currentValue) {
                        stateUi.resetActivePlugin();
                    }
                }
            }
        }, 300);
    }

    /**
     * 组件通用配置
     */
    private renderDrawerPluginEditor() {
        return <el-drawer
                visible={this.showDrawerCommPluginEditor}
                {...{on:{'update:visible': val => this.showDrawerCommPluginEditor = val}}}
                size='560px'
                modal={false}
                with-header={false}>
                {
                    this.innerRenderDrawerPlugin()
                }
            </el-drawer>;
    }

    private innerRenderDrawerPlugin() {
        if (!this.showDrawerCommPluginEditor ||
            !this.currentPluginType ||
            !this.currentPlugin ||
            this.currentPluginType !== PluginType.Plugin) {
            return;
        }
        const plugin = this.currentPlugin;
        const currentIndex = this.currentPage?.plugins.findIndex(item=> item.id === plugin.id);
        const outConfig = plugin.outConfig;
        let alignTypeValue = alignTypeList.find(type=> type.value === outConfig.align) || alignTypeList[0];
        return  <div class='plugin-editor-drawer'>
            <div class='fixed-title'>
                <div class='title'>组件：{plugin.zhName}</div>
                <div class='close-btn' onClick={()=> this.showDrawerCommPluginEditor = false}><i class='el-icon-close'></i></div>
            </div>
            {
                // 之所以加上这个，因为el-drawer打开会默认给第一个输入框聚焦。。。
                <input style='width:1px;height:1px;opacity:0;position:absolute;' />
            }
            <div class='line'>
                <commLabelInput
                    v-model={plugin.zhName}
                    config={{
                        label: '组件名称',
                        labelWidth: '80px',
                    }}
                    onClickOutside={()=> stateUi.save()} />
            </div>
            <div class='line'>
                <commLabelSwitch
                    v-model={outConfig.hidden}
                    config={{
                        labelWidth: '80px',
                        label: '隐藏元素'
                    }}
                    onSave={({value})=> {
                        stateUi.previewPluginConfig(plugin.id, PluginType.Plugin, 'outConfig.hidden', value);
                        stateUi.save();
                    }} />
            </div>
            <div class='line'>
                <commLabelInput
                    v-model={outConfig.width}
                    config={{
                        label: '宽度',
                        labelWidth: '80px',
                    }}
                    onPreview={(data)=> {
                        stateUi.previewPluginConfig(plugin.id, PluginType.Plugin, 'outConfig.width', data.value);
                    }}
                    onClickOutside={()=> stateUi.save()} />
            </div>
            <div class='line'>
                <commLabelInput
                    v-model={outConfig.height}
                    config={{
                        label: '高度',
                        labelWidth: '80px',
                    }}
                    onPreview={(data)=> {
                        stateUi.previewPluginConfig(plugin.id, PluginType.Plugin, 'outConfig.height', data.value);
                    }}
                    onClickOutside={()=> stateUi.save()} />
            </div>
            <div class='line'>
                <div class='box'>
                    <div class='label'>组件边距</div>
                    <div class='content'>
                        <div class='margin-setting-top'>
                            <commLabelInput
                                v-model={outConfig.margin.top}
                                config={{
                                    width: '60px'
                                }}
                                onPreview={(data)=> {
                                    stateUi.previewPluginConfig(plugin.id, PluginType.Plugin, 'outConfig.margin.top', data.value);
                                }}
                                onClickOutside={()=> stateUi.save()} />
                            {
                                currentIndex === 0 && <el-button style='margin-left: 12px' size='mini' onClick={()=> {
                                    const img = document.createElement('img');
                                    img.onload = ()=> {
                                        outConfig.margin.top = `${750 / img.naturalWidth * img.naturalHeight}`;
                                        stateUi.previewPluginConfig(plugin.id, PluginType.Plugin, 'outConfig.margin.top', outConfig.margin.top);
                                        stateUi.save();
                                    };
                                    img.onerror = (e)=> {
                                        console.log('error', e);
                                        this.$message.error('自动读取失败');
                                    };
                                    img.setAttribute('crossorigin', 'anonymous');
                                    img.src = this.pageConfig.backgroundImage + '';
                                }}>读取头图高度</el-button>
                                }
                        </div>
                        {
                            <div class='margin-setting-middle'>
                                <commLabelInput
                                    v-model={outConfig.margin.left}
                                    config={{
                                        width: '60px'
                                    }}
                                    onPreview={(data)=> {
                                        stateUi.previewPluginConfig(plugin.id, PluginType.Plugin, 'outConfig.margin.left', data.value);
                                    }}
                                    onClickOutside={()=> stateUi.save()} />
                                <commLabelInput
                                    v-model={outConfig.margin.right}
                                    config={{
                                        width: '60px'
                                    }}
                                    onPreview={(data)=> {
                                        stateUi.previewPluginConfig(plugin.id, PluginType.Plugin, 'outConfig.margin.right', data.value);
                                    }}
                                    onClickOutside={()=> stateUi.save()} />
                            </div>
                        }
                        <div class='margin-setting-bottom'>
                            <commLabelInput
                                v-model={outConfig.margin.bottom}
                                config={{
                                    width: '60px'
                                }}
                                onPreview={(data)=> {
                                    stateUi.previewPluginConfig(plugin.id, PluginType.Plugin, 'outConfig.margin.bottom', data.value);
                                }}
                                onClickOutside={()=> stateUi.save()} />
                        </div>
                    </div>
                </div>
            </div>
            {
                <div class='line'>
                    <commLabelRadio
                        value={alignTypeValue}
                        config={{
                            labelWidth: '80px',
                            label: '对齐方式',
                            list: alignTypeList
                        }}
                        onSave={({value})=> {
                            outConfig.align = value.value;
                            stateUi.previewPluginConfig(plugin.id, PluginType.Plugin, 'outConfig.align', value.value);
                            stateUi.save();
                        }} />
                </div>
            }
            <div class='line'>
                <commLabelUpload
                    v-model={outConfig.backgroundImage}
                    config={{
                        label: '背景图片',
                        labelWidth: '100px',
                        closeable: outConfig.backgroundImage !== ''
                    }}
                    onClose={()=> {
                        stateUi.previewPluginConfig(plugin.id, PluginType.Plugin, 'outConfig.backgroundImage', '');
                        stateUi.savePluginConfig(plugin.id, PluginType.Plugin, 'outConfig.backgroundImage', '');
                    }}
                    onSave={({value})=> {
                        stateUi.previewPluginConfig(plugin.id, PluginType.Plugin,'outConfig.backgroundImage', value);
                        stateUi.savePluginConfig(plugin.id, PluginType.Plugin, 'outConfig.backgroundImage', value);
                    }} />
            </div>
            <div class='line'>
                <commLabelColorPicker
                    v-model={outConfig.backgroundColor}
                    config={{
                        label: '背景颜色',
                        labelWidth: '100px',
                    }}
                    onSave={({value})=> {
                        stateUi.previewPluginConfig(plugin.id, PluginType.Plugin,'outConfig.backgroundColor', value);
                        stateUi.save();
                    }}
                    onPreview={({value})=> {
                        stateUi.previewPluginConfig(plugin.id, PluginType.Plugin,'outConfig.backgroundColor', value);
                    }}
                    onClickOutside={({value})=> {
                        stateUi.previewPluginConfig(plugin.id, PluginType.Plugin,'outConfig.backgroundColor', value);
                }} />
            </div>
            <div class='line'>
                <commLabelSwitch
                    v-model={outConfig.shadow.open}
                    config={{
                        labelWidth: '80px',
                        label: '开启阴影'
                    }}
                    onSave={({value})=> {
                        stateUi.previewPluginConfig(plugin.id, PluginType.Plugin, 'outConfig.shadow.open', value);
                        stateUi.save();
                    }} />
            </div>
            {
                this.drawShadowConfig()
            }
            <div class='line'>
                <commLabelSwitch
                    v-model={outConfig.border.open}
                    config={{
                        labelWidth: '80px',
                        label: '开启边框'
                    }}
                    onSave={({value})=> {
                        stateUi.previewPluginConfig(plugin.id, PluginType.Plugin, 'outConfig.border.open', value);
                        stateUi.save();
                    }} />
            </div>
            {
                this.drawBorderConfig()
            }
        </div>;
    }

    /**
     * 挂件通用配置
     */
    private renderDrawerPendantEditor() {
        return <el-drawer
                visible={this.showDrawerCommPendantEditor}
                {...{on:{'update:visible': val => this.showDrawerCommPendantEditor = val}}}
                size='560px'
                modal={false}
                with-header={false}>
                {
                    this.innerRenderDrawerPendant()
                }
            </el-drawer>;
    }

    private innerRenderDrawerPendant() {
        if (!this.showDrawerCommPendantEditor ||
            !this.currentPluginType ||
            !this.currentPlugin ||
            this.currentPluginType !== PluginType.Pendant) {
            return;
        }
        const pendant = this.currentPlugin as Pendant || {} as any;
        const outConfig = pendant.outConfig;
        let fixedTypeValue = pendantFixedTypeList.find(type=> type.value === pendant.fixedType) || pendantFixedTypeList[0];
        let modeValue = pendantModeList.find(type=> type.value === pendant.mode) || pendantModeList[0];
        let alignV = pendantAlignVList.find(type=> type.value === pendant.alignV) || pendantAlignVList[0];
        let alignH = pendantAlignHList.find(type=> type.value === pendant.alignH) || pendantAlignHList[0];
        return <div class='plugin-editor-drawer'>
            <div class='fixed-title'>
                <div class='title'>挂件：{pendant.zhName}</div>
                <div class='close-btn' onClick={()=> this.showDrawerCommPendantEditor = false}><i class='el-icon-close'></i></div>
            </div>
            {
                // 之所以加上这个，因为el-drawer打开会默认给第一个输入框聚焦。。。
                <input style='width:1px;height:1px;opacity:0;position:absolute;' />
            }
            <div class='line'>
                <commLabelInput
                    v-model={pendant.zhName}
                    config={{
                        label: '组件名称',
                        labelWidth: '80px',
                    }}
                    onClickOutside={()=> stateUi.save()} />
            </div>
            <div class='line'>
                <commLabelSwitch
                    v-model={outConfig.hidden}
                    config={{
                        labelWidth: '80px',
                        label: '隐藏元素'
                    }}
                    onSave={({value})=> {
                        stateUi.previewPluginConfig(pendant.id, PluginType.Pendant, 'outConfig.hidden', value);
                        stateUi.save();
                    }} />
            </div>
            <div class='line'>
                <commLabelInput
                    v-model={outConfig.width}
                    config={{
                        label: '宽度',
                        labelWidth: '80px',
                    }}
                    onPreview={(data)=> {
                        stateUi.previewPluginConfig(pendant.id, PluginType.Pendant, 'outConfig.width', data.value);
                    }}
                    onClickOutside={()=> stateUi.save()} />
            </div>
            <div class='line'>
                <commLabelInput
                    v-model={outConfig.height}
                    config={{
                        label: '高度',
                        labelWidth: '80px',
                    }}
                    onPreview={(data)=> {
                        stateUi.previewPluginConfig(pendant.id, PluginType.Pendant, 'outConfig.height', data.value);
                    }}
                    onClickOutside={()=> stateUi.save()} />
            </div>
            <div class='line'>
                <commLabelRadio
                    v-model={alignV}
                    config={{
                        labelWidth: '80px',
                        label: '垂直对齐',
                        list: pendantAlignVList
                    }}
                    onSave={({value})=> {
                        pendant.alignV = value.value;
                        const changeList = [{
                            key: 'alignV',
                            value: value.value
                        }];
                        stateUi.previewPluginConfigs(pendant.id, PluginType.Pendant, changeList);
                        stateUi.save();
                    }} />
            </div>
            <div class='line'>
                <commLabelRadio
                    v-model={alignH}
                    config={{
                        labelWidth: '80px',
                        label: '水平对齐',
                        list: pendantAlignHList
                    }}
                    onSave={({value})=> {
                        pendant.alignH = value.value;
                        const changeList = [{
                            key: 'alignH',
                            value: value.value
                        }];
                        stateUi.previewPluginConfigs(pendant.id, PluginType.Pendant, changeList);
                        stateUi.save();
                    }} />
            </div>
            <div class='line'>
                <div class='box'>
                    <div class='label'>挂件边距</div>
                    <div class='content'>
                        <div class='margin-setting-top ml'>
                            <commLabelInput
                                v-model={pendant.position.top}
                                config={{
                                    width: '60px',
                                    disabled: pendant.alignV  === 'bottom'
                                }}
                                onPreview={(data)=> {
                                    stateUi.previewPluginConfig(pendant.id, PluginType.Pendant, 'position.top', data.value);
                                }}
                                onClickOutside={()=> stateUi.save()} />
                        </div>
                        <div class='margin-setting-middle'>
                            <commLabelInput
                                v-model={pendant.position.left}
                                config={{
                                    width: '60px',
                                    disabled: pendant.alignH  === 'right'
                                }}
                                onPreview={(data)=> {
                                    stateUi.previewPluginConfig(pendant.id, PluginType.Pendant, 'position.left', data.value);
                                }}
                                onClickOutside={()=> stateUi.save()} />
                            <commLabelInput
                                v-model={pendant.position.right}
                                config={{
                                    width: '60px',
                                    disabled: pendant.alignH  === 'left'
                                }}
                                onPreview={(data)=> {
                                    stateUi.previewPluginConfig(pendant.id, PluginType.Pendant, 'position.right', data.value);
                                }}
                                onClickOutside={()=> stateUi.save()} />
                        </div>
                        <div class='margin-setting-bottom ml' >
                            <commLabelInput
                                v-model={pendant.position.bottom}
                                config={{
                                    width: '60px',
                                    disabled: pendant.alignV  === 'top'
                                }}
                                onPreview={(data)=> {
                                    stateUi.previewPluginConfig(pendant.id, PluginType.Pendant, 'position.bottom', data.value);
                                }}
                                onClickOutside={()=> stateUi.save()} />
                        </div>
                    </div>
                </div>
            </div>
            <div class='line'>
                <commLabelRadio
                    value={fixedTypeValue}
                    config={{
                        labelWidth: '80px',
                        label: '固定方式',
                        list: pendantFixedTypeList,
                        disabled: pendant.disabledChangeFixedType
                    }}
                    onSave={({value})=> {
                        pendant.fixedType = value.value;
                        pendant.position.top = '0';
                        const changeList = [{
                            key: 'fixedType',
                            value: value.value
                        }];
                        if (value.value === 'fixed') {
                            // changeList.push({
                            //     key: 'position.top',
                            //     value: '0'
                            // });
                        }
                        stateUi.previewPluginConfigs(pendant.id, PluginType.Pendant, changeList);
                        stateUi.save();
                    }} />
            </div>
            <div class='line'>
                <commLabelRadio
                    value={modeValue}
                    config={{
                        labelWidth: '80px',
                        label: '移动端可拖动',
                        list: pendantModeList
                    }}
                    onSave={({value})=> {
                        pendant.mode = value.value;
                        const changeList = [{
                            key: 'mode',
                            value: value.value
                        }];
                        stateUi.previewPluginConfigs(pendant.id, PluginType.Pendant, changeList);
                        stateUi.save();
                    }} />
            </div>
            <div class='line'>
                <commLabelUpload
                    v-model={outConfig.backgroundImage}
                    config={{
                        label: '背景图片',
                        labelWidth: '100px',
                        closeable: outConfig.backgroundImage !== ''
                    }}
                    onClose={()=> {
                        stateUi.previewPluginConfig(pendant.id, PluginType.Pendant, 'outConfig.backgroundImage', '');
                        stateUi.savePluginConfig(pendant.id, PluginType.Pendant, 'outConfig.backgroundImage', '');
                    }}
                    onSave={({value})=> {
                        stateUi.previewPluginConfig(pendant.id, PluginType.Pendant,'outConfig.backgroundImage', value);
                        stateUi.savePluginConfig(pendant.id, PluginType.Pendant, 'outConfig.backgroundImage', value);
                    }} />
            </div>
            <div class='line'>
                <commLabelColorPicker
                    v-model={outConfig.backgroundColor}
                    config={{
                        label: '背景颜色',
                        labelWidth: '100px',
                    }}
                    onSave={({value})=> {
                        stateUi.previewPluginConfig(pendant.id, PluginType.Pendant,'outConfig.backgroundColor', value);
                        stateUi.save();
                    }}
                    onPreview={({value})=> {
                        stateUi.previewPluginConfig(pendant.id, PluginType.Pendant,'outConfig.backgroundColor', value);
                    }}
                    onClickOutside={({value})=> {
                        stateUi.previewPluginConfig(pendant.id, PluginType.Pendant,'outConfig.backgroundColor', value);
                }} />
            </div>
            <div class='line'>
                <commLabelSwitch
                    v-model={outConfig.shadow.open}
                    config={{
                        labelWidth: '80px',
                        label: '开启阴影'
                    }}
                    onSave={({value})=> {
                        stateUi.previewPluginConfig(pendant.id, PluginType.Pendant, 'outConfig.shadow.open', value);
                        stateUi.save();
                    }} />
            </div>
            {
                this.drawShadowConfig()
            }
            <div class='line'>
                <commLabelSwitch
                    v-model={outConfig.border.open}
                    config={{
                        labelWidth: '80px',
                        label: '开启边框'
                    }}
                    onSave={({value})=> {
                        stateUi.previewPluginConfig(pendant.id, PluginType.Pendant, 'outConfig.border.open', value);
                        stateUi.save();
                    }} />
            </div>
            {
                this.drawBorderConfig()
            }
        </div>;
    }

    private drawShadowConfig() {
        const pendant = this.currentPlugin as Pendant;
        const outConfig = pendant.outConfig;
        const type = this.currentPluginType;
        if (!type) {
            return;
        }
        if (!outConfig.shadow.open) {
            return;
        }
        return [
            <div class='line sub-line'>
                <commLabelInput
                    v-model={outConfig.shadow.h}
                    config={{
                        labelWidth: '80px',
                        label: '水平阴影位置'
                    }}
                    onPreview={(data)=> {
                        stateUi.previewPluginConfig(pendant.id, type, 'outConfig.shadow.h', data.value);
                    }}
                    onClickOutside={()=> stateUi.save()} />
            </div>,
            <div class='line sub-line'>
                <commLabelInput
                    v-model={outConfig.shadow.v}
                    config={{
                        labelWidth: '80px',
                        label: '垂直阴影位置'
                    }}
                    onPreview={(data)=> {
                        stateUi.previewPluginConfig(pendant.id, type, 'outConfig.shadow.v', data.value);
                    }}
                    onClickOutside={()=> stateUi.save()} />
            </div>,
            <div class='line sub-line'>
                <commLabelInput
                    v-model={outConfig.shadow.blur}
                    config={{
                        labelWidth: '80px',
                        label: '阴影模糊距离'
                    }}
                    onPreview={(data)=> {
                        stateUi.previewPluginConfig(pendant.id, type, 'outConfig.shadow.blur', data.value);
                    }}
                    onClickOutside={()=> stateUi.save()} />
            </div>,
            <div class='line sub-line'>
                <commLabelInput
                    v-model={outConfig.shadow.spread}
                    config={{
                        labelWidth: '80px',
                        label: '阴影大小'
                    }}
                    onPreview={(data)=> {
                        stateUi.previewPluginConfig(pendant.id, type, 'outConfig.shadow.spread', data.value);
                    }}
                    onClickOutside={()=> stateUi.save()} />
            </div>,
            <div class='line sub-line'>
                <commLabelColorPicker
                    v-model={outConfig.shadow.color}
                    config={{
                        labelWidth: '80px',
                        label: '阴影颜色'
                    }}
                    onSave={({value})=> {
                        stateUi.previewPluginConfig(pendant.id, type, 'outConfig.shadow.color', value);
                        stateUi.save();
                    }}
                    onPreview={({value})=> {
                        stateUi.previewPluginConfig(pendant.id, type, 'outConfig.shadow.color', value);
                    }}
                    onClickOutside={({value})=> {
                        stateUi.previewPluginConfig(pendant.id, type, 'outConfig.shadow.color', value);
                    }}  />
            </div>,
            <div class='line sub-line'>
                <commLabelSwitch
                    v-model={outConfig.shadow.inset}
                    config={{
                        labelWidth: '80px',
                        label: '是否内阴影'
                    }}
                    onSave={({value})=> {
                        stateUi.previewPluginConfig(pendant.id, type, 'outConfig.shadow.inset', value);
                        stateUi.save();
                    }} />
            </div>
        ];
    }

    private changeRadiusValue(radius: {topLeft: string; topRight: string; bottomLeft: string; bottomRight: string;}, value, id: string, type: PluginType, key?: string) {
        const changeList: any = [];
        if (this.lockRadius) {
            radius.topLeft = radius.topRight = radius.bottomLeft = radius.bottomRight = value;
            for (let k in radius) {
                changeList.push({
                    key: `outConfig.border.radius.${k}`,
                    value
                });
            }
        }
        if (key) {
            changeList.push({
                key: `outConfig.border.radius.${key}`,
                value
            });
        }
        if (changeList.length >  0) {
            stateUi.previewPluginConfigs(id, type, changeList);
            return true;
        }
        return false;
    }

    private drawBorderConfig() {
        const pendant = this.currentPlugin as Pendant;
        const outConfig = pendant.outConfig;
        const type = this.currentPluginType;
        if (!type) {
            return;
        }
        if (!outConfig.border.open) {
            return;
        }
        const radius = outConfig.border.radius;
        if (this.lockRadius === null) {
            this.lockRadius = radius.topLeft === radius.topRight && radius.topLeft === radius.bottomLeft && radius.bottomLeft === radius.bottomRight;
        }
        return <div class='line sub-line'>
        {
            // <commLabelInput
            //     v-model={outConfig.border.radius}
            //     config={{
            //         labelWidth: '80px',
            //         label: '圆角大小'
            //     }}
            //     onPreview={(data)=> {
            //         stateUi.previewPluginConfig(pendant.id, type, 'outConfig.border.radius', data.value);
            //     }}
            //     onClickOutside={()=> stateUi.save()} />
        }
            <div class='box'>
                <div class='label'>圆角大小</div>
                <div class='radius-content'>
                    <div class='input-box'>
                        <commLabelInput
                            class='item'
                            v-model={outConfig.border.radius.topLeft}
                            config={{
                                width: '60px'
                            }}
                            onPreview={(data)=> {
                                this.changeRadiusValue(radius, data.value, pendant.id, type, 'topLeft');
                            }}
                            onClickOutside={()=> stateUi.save()} />
                        <commLabelInput
                            class='item'
                            v-model={radius.topRight}
                            config={{
                                width: '60px'
                            }}
                            onPreview={(data)=> {
                                this.changeRadiusValue(radius, data.value, pendant.id, type, 'topRight');
                            }}
                            onClickOutside={()=> stateUi.save()} />
                    </div>
                    <i class={['iconfont icon-associated icon', this.lockRadius ? 'lock' : '']} onClick={()=> {
                        this.lockRadius = !this.lockRadius;
                        const hasChange = this.changeRadiusValue(radius, outConfig.border.radius.topLeft, pendant.id, type);
                        if (hasChange) {
                            stateUi.save();
                        }
                    }}></i>
                    <div class='input-box'>
                        <commLabelInput
                            class='item'
                            v-model={radius.bottomLeft}
                            config={{
                                width: '60px'
                            }}
                            onPreview={(data)=> {
                                this.changeRadiusValue(radius, data.value, pendant.id, type, 'bottomLeft');
                            }}
                            onClickOutside={()=> stateUi.save()} />
                        <commLabelInput
                            class='item'
                            v-model={radius.bottomRight}
                            config={{
                                width: '60px'
                            }}
                            onPreview={(data)=> {
                                this.changeRadiusValue(radius, data.value, pendant.id, type, 'bottomRight');
                            }}
                            onClickOutside={()=> stateUi.save()} />
                    </div>
                </div>
            </div>
        </div>;
    }
}

</script>

<style lang="less">
.editor-plugin-title {
    > .hidden-tip {
        color: red;
        font-size: 12px;
    }
}

.editor-plugin {
    position: relative;
    overflow: scroll;
    background-color: white;
    box-sizing: border-box;
    > .page-title {
        text-align: left;
        padding: 8px 15px;
        font-weight: bold;
        font-size: 14px;
        border-bottom: 1px dashed #eeeeee;
    }
    .config-title {
        text-align: left;
        padding: 8px 15px;
        font-weight: bold;
        font-size: 12px;
        border-bottom: 1px dashed #eeeeee;
        border-left: 4px solid #589ef8;
        background-color: #eef5fe;
    }
    > .page-config {
        padding: 8px 15px;
        > .line {
            padding: 8px 0;
            display: flex;
        }
    }
    .editor-content {
        padding: 8px 15px;
        > .line {
            padding: 8px 0;
            display: flex;
            > .mr {
                margin-right: 8px;
            }
        }
    }
    > .el-collapse {
        > .el-collapse-item {
            &.active-plugin {
                > .el-collapse-item__wrap {
                    margin: 0 2px;
                    outline: 2px solid #589ef8;
                    > .el-collapse-item__content {
                        > .editor-content {
                            animation: active-fade-editor-content 0.8s 0.5s linear;
                        }
                    }
                }
            }
        }
    }
}
.plugin-editor-drawer {
    position: relative;
    margin-top: 60px;
    padding-top: 44px;
    width: 100%;
    height: calc(100vh - 60px);
    overflow: scroll;
    &::-webkit-scrollbar {
        display: none;
    }
    > .fixed-title {
        top: 60px;
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
            top: 60px;
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
        > .box {
            display: flex;
            align-items: center;
            text-align: left;
            > .label {
                width: 90px;
                font-size: 14px;
                font-weight: bold;
            }
            > .content {
                > .margin-setting-top {
                    margin-bottom: 5px;
                    display: flex;
                }
                > .margin-setting-top,
                > .margin-setting-bottom {
                    margin-left: 60px;
                }
                > .ml {
                    margin-left: 60px;
                }
                > .margin-setting-middle {
                    width: 180px;
                    display: flex;
                    justify-content: space-between;
                }
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
        > .box {
            display: flex;
            align-items: center;
            text-align: left;
            > .label {
                width: 90px;
                font-size: 12px;
                font-weight: normal;
            }
            > .radius-content {
                display: flex;
                flex-direction: column;
                align-items: center;
                > .input-box {
                    display: flex;
                    > .item {
                        margin-right: 16px;
                        &:last-child {
                            margin-right: 0;
                        }
                    }
                }
                > .icon {
                    font-size: 16px;
                    line-height: 16px;
                    color: #cccccc;
                    &.lock {
                        color: #222222;
                    }
                }
            }
        }
    }
}

.el-drawer__wrapper {
    pointer-events: none;
    > .el-drawer__container {
        pointer-events: none;
        > .el-drawer {
            pointer-events: auto;
        }
    }
}

@keyframes active-fade-editor-content {
    0% {
        background-color: white;
    }
    50% {
        background-color: #589ef8;
    }
    100% {
        background-color: white;
    }
}
</style>
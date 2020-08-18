<script lang='tsx'>
import { Component, Vue, Watch, Prop } from 'vue-property-decorator';
import { CreateElement } from 'vue';
import { Page, Plugin, Pendant } from '@/config';
import { VIFRAME_KEY } from '@/VIFRAME';
import { stateCommon, stateUi, stateWorkbench, stateActivity } from '@/state/index';
import { PluginType } from '@/state/module/activity';

const { data: activityData } = stateActivity;

interface PluginItem<T extends Plugin> {
    name: string;
    plugin: T;
    type: PluginType;
}

const newUserTypeList = [
    {
        label: '无',
        value: 'none'
    },{
        label: '首次参与活动',
        value: 'first_join_activity'
    },{
        label: '首次参与活动、首次注册',
        value: 'first_register'
    },{
        label: '首次参与活动、无购买历史',
        value: 'first_without_buy_histroy'
    }
];

const loginTypeList = [
    {
        label: '进入活动时',
        value: 'enter_activity'
    },
    {
        label: '需要时',
        value: 'when_need'
    }
];

@Component
export default class BaseSetting extends Vue {

    private get currentPage() {
        return stateUi.data.currentPage;
    }

    private get pageConfig() {
        const currentPage = stateUi.data.currentPage;
        return Vue.observable({
            title: currentPage?.config.title,
            backgroundColor: currentPage?.config.backgroundColor,
            backgroundImage: currentPage?.config.backgroundImage,
        });
    }

    private get workbenchPannel() {
        const config = stateWorkbench.data.workbench?.workbenchConfig.editor;
        const thisConfig = config?.find(item=> item.name === 'base');
        return thisConfig;
    }

    private getPannel(name) {
        return this.workbenchPannel?.pannel.find(item=> item.name === name);
    }

    private get globalConfig() {
        const globalConfig = stateUi.data.config;
        return Vue.observable({
            title: globalConfig?.config.title,
            backgroundColor: globalConfig?.config.backgroundColor,
            backgroundImage: globalConfig?.config.backgroundImage,
            themeColor: globalConfig?.config.themeColor
        });
    }

    public render(h: CreateElement) {
        return (
            <div class='base-setting-wrap'>
                {
                    this.renderActivityConfig()
                }
                {
                    this.renderRuleConfig()
                }
                <p class='config-title'>风格设置</p>
                {
                    this.renderStyleConfig()
                }
                {
                    this.renderShareConfig()
                }
                {
                    this.renderLoginConfig()
                }
                {
                    this.renderAppDownloadConfig()
                }
            </div>
        );
    }

    private renderRuleConfig() {
        if (!stateUi.data.config) {
            return;
        }
        if (!this.getPannel('rule')) {
            return;
        }
        return [
            <p class='config-title'>活动规则设置</p>,
            <div class='config-wrap'
                onClick={()=> {
                    if (stateUi.data.currentDialog?.dialogName !== 'commonRule') {
                        stateUi.switchDialog('commonRule');
                    }
                }}
                v-s-clickoutside={()=> {
                    // 名称相同，会关闭
                    if (stateUi.data.currentDialog?.dialogName === 'commonRule') {
                        stateUi.switchDialog('commonRule');
                    }
                }}>
                <commLabelEditor
                    value={decodeURI(stateUi.data.config.rule)}
                    config={{
                        editorWidth: '100%',
                        editorHeight: '300px',
                    }}
                    onPreview={({value})=> {
                        stateUi.previewActivityConfigs([{
                            key: 'rule',
                            value: encodeURI(value),
                            changeWorkbench: true
                        }]);
                    }}
                    onClickOutside={({value})=> {
                        stateUi.save();
                    }} />
            </div>
        ];
    }

    private renderAppDownloadConfig() {
        if (!this.getPannel('appDownload')) {
            return;
        }
        return [
            <p class='config-title'>APP下载地址设置</p>,
            <div class='config-wrap'>
                <p class='tip'>设置后可在⻚面设置时关联</p>
                <div class='line'>
                    <commLabelInput
                        value={activityData.baseConfig?.androidDownloadUrl}
                        config={{
                            width: '100%',
                            labelWidth: '60px',
                            label: '安卓'
                        }}
                        onPreview={({value})=> {
                            stateActivity.changeBaseConfig('androidDownloadUrl', value);
                        }}
                        onClickOutside={({value})=> {
                            stateActivity.saveBaseConfig({androidDownloadUrl: value});
                        }} />
                </div>
                <div class='line'>
                    <commLabelInput
                        value={activityData.baseConfig?.iosDownloadUrl}
                        config={{
                            width: '100%',
                            labelWidth: '60px',
                            label: 'IOS'
                        }}
                        onPreview={({value})=> {
                            stateActivity.changeBaseConfig('iosDownloadUrl', value);
                        }}
                        onClickOutside={({value})=> {
                            stateActivity.saveBaseConfig({iosDownloadUrl: value});
                        }} />
                </div>
            </div>
        ];
    }

    private renderLoginConfig() {
        if (!this.getPannel('login')) {
            return;
        }
        let loginOpportunity = loginTypeList.find(item=> item.value === stateActivity.data.baseConfig.loginOpportunity);
        return [
            <p class='config-title'>登录设置</p>,
            <div class='config-wrap'>
                <commLabelRadio
                    value={loginOpportunity || loginTypeList[0]}
                    config={{
                        labelWidth: '100px',
                        label: '登录时机',
                        list: loginTypeList
                    }}
                    onSave={({value})=> {
                        stateActivity.changeBaseConfig('loginOpportunity', value.value);
                        stateActivity.saveBaseConfig({loginOpportunity: value.value});
                    }} />
            </div>
        ];
    }

    private renderShareConfig() {
        if (!this.getPannel('share')) {
            return;
        }
        const shareValue = {
            value: 0,
            label: '可分享'
        };
        if (!activityData.baseConfig?.shareConfig.canShare) {
            shareValue.value = 1;
            shareValue.label = '不可分享';
        }
        return [
            <p class='config-title'>分享设置</p>,
            <div class='config-wrap'
                onClick={()=> {
                    if (shareValue.value === 0) {
                        stateWorkbench.data.currentShare = 'weixin';
                    }
                }}
                v-s-clickoutside={()=> {
                    stateWorkbench.data.currentShare = null;
                }}>
                <div class='line border-bottom'>
                    <commLabelRadio
                        value={shareValue}
                        config={{
                            labelWidth: '100px',
                            label: '是否支持分享',
                            list: [{
                                label: '可分享',
                                value: 0
                            },{
                                label: '不可分享',
                                value: 1
                            }]
                        }}
                        onSave={({value})=> {
                            if (value.value === 1) {
                                stateWorkbench.data.currentShare = null;
                            }
                            stateActivity.changeBaseConfig('shareConfig.canShare', value.value === 0);
                            stateActivity.saveBaseConfig({shareConfig: JSON.stringify(activityData.baseConfig?.shareConfig)});
                        }}/>
                </div>
                {
                    this.showShareConfig()
                }
            </div>
        ];
    }

    private showShareConfig() {
        if (!activityData.baseConfig?.shareConfig.canShare) {
            return '';
        }
        return [
            <div class='line'>
                <commLabelUpload
                    value={activityData.baseConfig?.shareConfig.img}
                    config={{
                        labelWidth: '100px',
                        label: '分享配图',
                        maxSize: 1024 * 1024,
                        info: {
                            title: '图⽚规格',
                            list: [
                                '大于等于 300*300',
                                '⼤⼩不超过1M'
                            ]
                        },
                        closeable: activityData.baseConfig?.shareConfig.img !== ''
                    }}
                    onClose={()=> {
                        stateActivity.changeBaseConfig('shareConfig.img', '');
                        stateActivity.saveBaseConfig({shareConfig: JSON.stringify(activityData.baseConfig?.shareConfig)});
                    }}
                    onSave={({value})=> {
                        stateActivity.changeBaseConfig('shareConfig.img', value);
                        stateActivity.saveBaseConfig({shareConfig: JSON.stringify(activityData.baseConfig?.shareConfig)});
                    }} />
            </div>,
            <div class='line'>
                <commLabelInput
                    value={activityData.baseConfig?.shareConfig.title}
                    config={{
                        width: '100%',
                        labelWidth: '100px',
                        label: '分享标题',
                        maxlength: 26
                    }}
                    onPreview={({value})=> {
                        stateActivity.changeBaseConfig('shareConfig.title', value);
                    }}
                    onClickOutside={({value})=> {
                        stateActivity.saveBaseConfig({shareConfig: JSON.stringify(activityData.baseConfig?.shareConfig)});
                    }} />
            </div>,
            <div class='line'>
                <commLabelInput
                    value={activityData.baseConfig?.shareConfig.desc}
                    config={{
                        width: '100%',
                        labelWidth: '100px',
                        label: '分享描述',
                        maxlength: 33
                    }}
                    onPreview={({value})=> {
                        stateActivity.changeBaseConfig('shareConfig.desc', value);
                    }}
                    onClickOutside={({value})=> {
                        stateActivity.saveBaseConfig({shareConfig: JSON.stringify(activityData.baseConfig?.shareConfig)});
                    }} />
            </div>
        ];
    }

    private renderStyleConfig() {
        return (
            <div class='config-wrap'>
                <div class='line'>
                    <commLabelColorPicker
                        v-model={this.globalConfig.themeColor}
                        config={{
                            labelWidth: '100px',
                            label: '主题色',
                            info: {
                                list: [
                                    '主题⾊可统⼀设置所有操作按钮的颜⾊'
                                ]
                            }
                        }}
                        onSave={({value})=> {
                            stateUi.previewActivityConfig('config.themeColor', value, true);
                            stateUi.save();
                        }}
                        onPreview={({value})=> {
                            stateUi.previewActivityConfig('config.themeColor', value);
                        }}
                        onClickOutside={({value})=> {
                            stateUi.previewActivityConfig('config.themeColor', value, true);
                        }} />
                    {
                        // <el-button size='mini' style='margin-left: 10px' onClick={()=> {
                        //     const img = document.createElement('img');
                        //     img.onload = ()=> {
                        //         const color = this.getImageData(img);
                        //         if (!color) {
                        //             this.$message.error('自动提取失败');
                        //             return;
                        //         }
                        //         stateUi.previewActivityConfig('config.themeColor', color, true);
                        //         stateUi.save();
                        //     };
                        //     img.onerror = (e)=> {
                        //         console.log('error', e);
                        //     };
                        //     img.setAttribute('crossorigin', 'anonymous');
                        //     img.src = this.globalConfig.backgroundImage + '';
                        // }}>从背景图提取</el-button>
                    }
                </div>
                <div class='line'>
                    <commLabelColorPicker
                        v-model={this.globalConfig.backgroundColor}
                        config={{
                            labelWidth: '100px',
                            label: '背景颜色'
                        }}
                        onSave={({value})=> {
                            stateUi.previewActivityConfig('config.backgroundColor', value, true);
                            stateUi.save();
                        }}
                        onPreview={({value})=> {
                            stateUi.previewActivityConfig('config.backgroundColor', value);
                        }}
                        onClickOutside={({value})=> {
                            stateUi.previewActivityConfig('config.backgroundColor', value, true);
                        }} />
                    {
                        // <el-button size='mini' style='margin-left: 10px' onClick={()=> {
                        //     const img = document.createElement('img');
                        //     img.onload = ()=> {
                        //         const color = this.getImageData(img);
                        //         if (!color) {
                        //             this.$message.error('自动提取失败');
                        //             return;
                        //         }
                        //         stateUi.previewActivityConfig('config.backgroundColor', color, true);
                        //         stateUi.save();
                        //     };
                        //     img.onerror = (e)=> {
                        //         console.log('error', e);
                        //     };
                        //     img.setAttribute('crossorigin', 'anonymous');
                        //     img.src = this.globalConfig.backgroundImage + '';
                        // }}>从背景图提取</el-button>
                    }
                </div>
            </div>
        );
    }

    private renderActivityConfig() {
        const currentPage = stateUi.data.currentPage;
        const { baseConfig } = stateActivity.data;
        const newUserTypeValue = newUserTypeList.find(item=> {
            return activityData.baseConfig?.newUserType === item.value;
        }) || newUserTypeList[0];
        return (
            <div class='config-wrap'>
                <div class='line'>
                    <commLabelInput
                        v-model={baseConfig.name}
                        config={{
                            labelWidth: '100px',
                            width: '100%',
                            label: '活动名称',
                            maxlength: 20,
                            disabled: stateWorkbench.data.publishVersion > 0
                        }}
                        onPreview={({value})=> {
                            console.log('preview');
                            stateActivity.changeBaseConfig('name', value);
                        }}
                        onClickOutside={({value})=> stateActivity.saveBaseConfig({name: value})} />
                </div>
                <div class='line'>
                    <commLabelInput
                        v-model={baseConfig.customParams.jtpActivityId}
                        config={{
                            customInputClass:[stateActivity.checkId() ? 'red-input-border': ''],
                            labelWidth: '100px',
                            width: '100%',
                            label: 'CRM活动id',
                            placeholder: '请输入id，多个id需使用英文分号区隔',
                        }}
                        onPreview={({value})=> {
                            stateActivity.changeBaseConfig('customParams.jtpActivityId', value);
                        }}
                        onClickOutside={({value})=> {
                            stateActivity.saveBaseConfig({customParams: JSON.stringify(activityData.baseConfig.customParams)});
                            stateActivity.checkData();
                        }} />
                </div>
                <div class='line'>
                    <commLabelCheckBox
                        v-model={baseConfig.customParams.activityType}
                        config={{
                            labelWidth: '100px',
                            width: '100%',
                            label: '活动类型',
                            showRedTip: baseConfig.customParams.activityType.length === 0,
                            list: [{
                                label: '抽奖',
                                value: 'raffle'
                            },{
                                label: '聚合页',
                                value: 'aggregation'
                            },{
                                label: '组队',
                                value: 'team'
                            },{
                                label: '测试答题',
                                value: 'qaTest'
                            },{
                                label: '红包活动',
                                value: 'redPacket'
                            },{
                                label: '秒杀',
                                value: 'secondKill'
                            },{
                                label: '好友邀请',
                                value: 'invite'
                            },{
                                label: '信息收集',
                                value: 'info'
                            },{
                                label: '抽签抽卡',
                                value: 'drawCard'
                            }],
                            info: {
                                list: [
                                    '类型至少必须选一个'
                                ]
                            }
                        }}
                        onSave={({value})=> {
                            stateActivity.changeBaseConfig('customParams.activityType', value);
                            stateActivity.saveBaseConfig({customParams: JSON.stringify(activityData.baseConfig.customParams)});
                            stateActivity.checkData();
                        }} />
                </div>
                <div class='line'>
                    <commLabelDateTimePicker
                        value={baseConfig.startTime}
                        config={{
                            labelWidth: '100px',
                            width: '56%',
                            label: '活动时间',
                            labelPos: 'row',
                            type: 'datetime',
                            clearable: false,
                            defaultTime: ['00:00:00'],
                            disabledDate: (time: Date)=> {
                                return time.getTime() < Date.now();
                            }
                        }}
                        onSave={({value})=> {
                            stateActivity.changeBaseConfigs([{ key: 'startTime', value }]);
                            stateActivity.saveBaseConfig({ startTime: value });
                        }} />
                    至
                    <commLabelDateTimePicker
                        value={baseConfig.endTime}
                        config={{
                            labelWidth: '0px',
                            width: '40%',
                            labelPos: 'row',
                            type: 'datetime',
                            clearable: false,
                            defaultTime: ['23:59:59'],
                            disabledDate: (time: Date)=> {
                                return time.getTime() < new Date(baseConfig.startTime).getTime();
                            }
                        }}
                        onSave={({value})=> {
                            stateActivity.changeBaseConfigs([{ key: 'endTime', value }]);
                            stateActivity.saveBaseConfig({ endTime: value });
                        }} />
                </div>
                <div class='line'>
                    <commLabelSwitch
                        config={{
                            labelWidth: '100px',
                            label: '参与地区限制',
                            labelPos: 'row',
                            disabled: true,
                            info: {
                                list: ['暂不开放设置']
                            }
                        }} />
                </div>
                <div class='line'>
                    <commLabelSwitch
                        config={{
                            labelWidth: '100px',
                            label: '参与对象限制',
                            labelPos: 'row',
                            disabled: true,
                            info: {
                                list: ['暂不开放设置']
                            }
                        }} />
                </div>
                <div class='line'>
                    <commLabelRadio
                        value={newUserTypeValue}
                        config={{
                            labelWidth: '100px',
                            label: '新用户定义',
                            list: newUserTypeList,
                            disabled: true
                        }}
                        onSave={({value})=> {
                            stateActivity.changeBaseConfig('newUserType', value.value);
                            stateActivity.saveBaseConfig({newUserType: value.value});
                        }} />
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

    private clickCollapseItem<T extends Plugin>(e: any, item: {plugin: T, type: PluginType}) {
        const classList = e.target?.classList;
        if (classList?.contains('el-collapse-item__header')) {
            if (classList?.contains('is-active')) {
                stateUi.activePlugin(item.plugin, item.type);
            } else {
                const currentPlugin = stateUi.data.currentPlugin;
                const currentPluginType = stateUi.data.currentPluginType;
                const currentValue = currentPluginType + '@' + currentPlugin?.id;
                const value = item.type + '@' + item.plugin.id;
                if (value === currentValue) {
                    stateUi.resetActivePlugin();
                }
            }
        }
    }
}

</script>

<style lang="less">
.red-input-border {
    > .el-input {
        > .el-input__inner {
            border-color: red;
        }
    }
}
.base-setting-wrap {
    position: relative;
    overflow: scroll;
    background-color: white;
    box-sizing: border-box;
    .config-title {
        text-align: left;
        padding: 8px 15px;
        font-weight: bold;
        font-size: 12px;
        border-bottom: 1px dashed #eeeeee;
        border-left: 4px solid #589ef8;
        > .sub-title {
            margin-left: 10px;
            opacity: 0.5;
        }
    }
    > .config-wrap {
        padding: 8px 15px;
        > .tip {
            text-align: left;
            font-size: 12px;
            color: #999999;
            padding: 8px 0;
        }
        > .line {
            padding: 8px 0;
            display: flex;
            align-items: center;
            &.border-bottom {
                border-bottom: 1px solid #eeeeee;
            }
        }
    }
    .el-collapse-item__header__arrow {
        color: #666666;
    }
    .el-collapse-item {
        &__header {
            border-color: #EEEEEE;
            color: #333333;
            font-weight: bold;
            padding: 0px 20px;
            height: 36px;
            line-height: 36px;
            .el-collapse-item__header__arrow {
                margin-right: 20px;
            }
        }
        &__wrap {
            border-color: #EEEEEE;
            background-color: white;
        }
        &__content {
            padding: 0px;
            font-size: 14px;
        }
    }
    .el-collapse-item.is-active {
        .el-collapse-item__header {
            background-color: #F8F8F8;
        }
        &.active-plugin {
            .el-collapse-item__header {
                background-color: #F8F8F8;
                background-color: #eef5fe;
            }
        }
    }
    .el-collapse {
        border-left: 0;
        border-right: 0;
    }
}
</style>
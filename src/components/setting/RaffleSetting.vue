<script lang='tsx'>
import { Component, Vue, Watch, Prop, Ref } from 'vue-property-decorator';
import { CreateElement } from 'vue';
import { Page, Plugin, Pendant } from '@/config';
import { VIFRAME_KEY, REFRESH_KEY } from '@/VIFRAME';
import { stateCommon, stateUi, stateRaffle, stateWorkbench } from '@/state/index';
import { PluginType } from '@/state/module/activity';
import { TaskConfig } from '../../state/module/raffle';

interface PluginItem<T extends Plugin> {
    name: string;
    plugin: T;
    type: PluginType;
}
const taskTypeList = [
    {
        label: '好友助力',
        value: 'help_friend'
    },{
        label: '转发分享',
        value: 'forward_share',
        disabled: true
    },{
        label: '邀请好友注册',
        value: 'invite_friends',
        disabled: true
    },{
        label: '每日签到',
        value: 'daily_sign',
        disabled: true
    },{
        label: '浏览页面',
        value: 'browse_page',
        disabled: true
    }
];
const hitLimitTypeList = [
    {
        label: '活动期间',
        value: 'activity'
    },
    {
        label: '每日',
        value: 'day'
    }
];
const raffleTimesTypeList = [
    {
        label: '活动期间',
        value: 'activity'
    },
    {
        label: '每日',
        value: 'day'
    }
];
const useRaffleTimesLimitList = [
    {
        label: '不限制',
        value: -1
    },
    {
        label: '限制',
        value: 0
    }
];
const rewardLimitList = [
    {
        label: '不限制',
        value: -1
    },
    {
        label: '限制',
        value: 0
    }
];
const assistanceLimitList = [
    {
        label: '无',
        value: -1,
    },
    {
        label: '仅限新用户',
        value: 0,
        disabled: true
    }
];
@Component
export default class RaffleSetting extends Vue {

    private showTableData: boolean = false;
    private noMornIndex: any = [];

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

    private get globalConfig() {
        const globalConfig = stateUi.data.config;
        return Vue.observable({
            title: globalConfig?.config.title,
            backgroundColor: globalConfig?.config.backgroundColor,
            backgroundImage: globalConfig?.config.backgroundImage,
        });
    }
    private get taskConfig() {
        return stateRaffle.data.taskConfig;
    }
    private get raffleConfig() {
        return stateRaffle.data.raffleConfig;
    }
    private get showGiftList() {
        return stateRaffle.data.showGiftList;
    }

    private get selectListLen() {
        return this.showGiftList.filter(item=> item.isSelect).length;
    }

    public async created() {
        await stateRaffle.loadRaffleConfig();
        this.$nextTick(()=> {
            this.showTableData = true;
        });
    }

    public render(h: CreateElement) {
        return (
            <div class='raffle-setting-wrap'>
                <p class='config-title'>获取抽奖次数<span class='sub-title'>需⾄少开启免费获取/做任务获取中的⼀项</span></p>
                {
                    this.renderRaffleTimesConfig()
                }
                 <p class='config-title'>次数限制</p>
                {
                    this.renderRuleConfig()
                }
                <p class='config-title'>
                    中奖率设置
                    <span class='sub-title'>概率总和均需为 100%，勾选个数需⼤于 4 个、⼩于等于 8 个</span>
                </p>

                <div class='config-wrap'>
                    <div class='line'>
                    {
                        this.renderRaffleTable()
                    }
                    </div>
                </div>
            </div>
        );
    }

    private renderRuleConfig() {
        const mustHit = Number(this.raffleConfig.mustHit) === 1;
        const hitLimitType = hitLimitTypeList.find(item=> {
            return this.raffleConfig.hitLimitType === item.value;
        }) || hitLimitTypeList[0];
        const useRaffleTimesLimit = Number(this.raffleConfig.useRaffleTimesLimit) || 0;
        const useRaffleTimesLimitValue = useRaffleTimesLimit === -1 ? useRaffleTimesLimitList[0] : useRaffleTimesLimitList[1];
        return (
            <div class='config-wrap'>
                <div class='line'>
                    <commLabelSwitch
                        value={mustHit}
                        config={{
                            labelWidth: '120px',
                            label: '是否为100%中奖'
                        }}
                        onSave={({value})=> {
                            this.raffleConfig.mustHit = value ? 1 : 0;
                            if (value || this.selectListLen < 8) {
                                stateRaffle.check();
                                stateRaffle.changeMustHit();
                            } else {
                                this.$alert('展示的奖品数量不能大于7个', '提示', {
                                    confirmButtonText: '确定',
                                    showClose: false
                                }).then(()=> {
                                    this.raffleConfig.mustHit = 1;
                                });
                            }
                        }} />
                </div>
                <div class='line'>
                    <commLabelSelect
                        value={useRaffleTimesLimitValue}
                        config={{
                            labelWidth: '120px',
                            label: '可抽奖次数上限',
                            list: useRaffleTimesLimitList
                        }}
                        onSave={({value})=> {
                            this.raffleConfig.useRaffleTimesLimit = value.value;
                            stateRaffle.change({
                                useRaffleTimesLimit: value.value
                            });
                            stateRaffle.reviewChange();
                            // this.VIFRAME.send(VIFRAME_KEY.REFRESH, {name: REFRESH_KEY.RAFFLE_DATA_VALUE, data: [{
                            //     key: 'useRaffleTimesLimit',
                            //     value: Number(value.value)
                            // }]});
                            stateRaffle.check();
                        }} />
                    {
                        useRaffleTimesLimitValue.value === 0 &&
                        <commLabelInput
                            style='margin-left: 5px;'
                            value={this.raffleConfig.useRaffleTimesLimit}
                            config={{
                                customInputClass: [!Number(this.raffleConfig.useRaffleTimesLimit) ? 'red-input-border' : ''],
                                type: 'number',
                                label: '',
                                append: '次/天',
                                min: 0,
                                placeholder: '请输入数字',
                            }}
                            onClickOutside={({value})=> {
                                this.raffleConfig.useRaffleTimesLimit = value;
                                stateRaffle.change({
                                    useRaffleTimesLimit: value
                                });
                                this.VIFRAME.send(VIFRAME_KEY.REFRESH, {name: REFRESH_KEY.RAFFLE_DATA_VALUE, data: [{
                                    key: 'useRaffleTimesLimit',
                                    value: Number(value)
                                }]});
                                stateRaffle.reviewChange();
                                stateRaffle.check();
                            }} />
                    }
                </div>
                <div class='line'>

                    <commLabelSelect
                        value={hitLimitType}
                        config={{
                            labelWidth: '120px',
                            label: '总中奖次数上限',
                            list: hitLimitTypeList
                        }}
                        onSave={({value})=> {
                            stateRaffle.change({
                                hitLimitType: value.value
                            });
                        }} />
                    <commLabelInput
                        style='margin-left: 5px;'
                        value={this.raffleConfig.hitLimitNum}
                        config={{
                            customInputClass: [!Number(this.raffleConfig.hitLimitNum) ? 'red-input-border' : ''],
                            type: 'number',
                            label: '',
                            append: '次',
                            min: 0,
                            placeholder: '请输入数字',
                        }}
                        onClickOutside={({value})=> {
                            this.raffleConfig.hitLimitNum = value;
                            stateRaffle.change({
                                hitLimitNum: value
                            });
                            stateRaffle.check();
                        }} />
                </div>
                {
                    !mustHit && this.renderRuleConfigItem()
                }
            </div>
        );
    }

    private renderRuleConfigItem() {
        return <div class='line'>
            <commLabelUpload
                value={this.raffleConfig.showConfig.notHitImg}
                config={{
                    labelWidth: '120px',
                    label: '”谢谢参与“图片',
                    closeable: this.raffleConfig.showConfig.notHitImg !== ''
                }}
                onClose={()=> {
                    this.raffleConfig.showConfig.notHitImg = '';
                    stateRaffle.change({
                        showConfig: JSON.stringify(this.raffleConfig.showConfig)
                    });
                }}
                onSave={({value})=> {
                    this.raffleConfig.showConfig.notHitImg = value;
                    stateRaffle.change({
                        showConfig: JSON.stringify(this.raffleConfig.showConfig)
                    });
                }} />
        </div>;
    }

    private renderRaffleTimesConfig() {
        const className = ['config-wrap'];
        if (!this.raffleConfig.enableFree && !this.taskConfig.enableTask) {
            className.push('tip-border');
        }
        return (
            <div class={className}>
                <div class='line border-bottom'>
                    <commLabelSwitch
                        value={this.raffleConfig.enableFree}
                        config={{
                            labelWidth: '120px',
                            label: '免费获取',
                            info: {
                                list: ['由系统派发免费的抽奖机会']
                            }
                        }}
                        onSave={({value})=> {
                            this.raffleConfig.enableFree = value;
                            if (!value) {
                                Vue.prototype.$confirm('关闭后，已设置的参数不再保留', '是否确定关闭？', {
                                    confirmButtonText: '确定',
                                    cancelButtonText: '取消',
                                    type: 'warning'
                                }).then(() => {
                                        this.raffleConfig.raffleTimes = 0;
                                        stateRaffle.change({
                                            raffleTimes: 0
                                        });
                                        stateRaffle.reviewChange();
                                }).catch(() => {
                                    this.raffleConfig.enableFree = !value;
                                });
                            }
                            stateRaffle.check();
                        }}
                    />
                </div>
                {
                    this.renderRaffleFreeConfigItem()
                }
                <div class='line border-bottom'>
                    <commLabelSwitch
                        value={this.taskConfig.enableTask}
                        config={{
                            labelWidth: '120px',
                            label: '做任务获取',
                            info: {
                                list: ['通过做任务，获得抽奖机会']
                            }
                        }}
                        onSave={({value})=> {
                            this.taskConfig.enableTask = value;
                            stateRaffle.taskTrigger(value);
                        }}
                    />
                </div>
                {
                    this.renderRaffleTaskConfigs()
                }
                {
                    <div class='line-add' style={{
                        display: (this.taskConfig.enableTask && this.taskConfig.list.length < 1) ? '' : 'none'
                    }} onClick={()=> stateRaffle.addTaskClick()}>新增任务</div>
                }
            </div>
        );
    }

    private renderRaffleTaskConfigs() {
        return this.taskConfig.list.map(task=> {
            const taskTypeValue = taskTypeList.find(item=> {
                return task.type === item.value;
            }) || taskTypeList[0];
            return [
                <div class='task-config-wrap'>
                    <div>
                        <div class='line-title'>
                            <div class='task-index'>任务1</div>
                            <div onClick={()=> {
                                stateRaffle.taskDelete({
                                    type:'help_friend'
                                });
                            }} class='delete-task'>删除</div>
                        </div>
                        <div class='line'>
                            <commLabelSelect
                                value={taskTypeValue}
                                config={{
                                    labelWidth: '120px',
                                    label: '任务类型',
                                    list: taskTypeList
                                }}
                                onSave={({value})=> {
                                    task.type = value.value;
                                    stateRaffle.change({
                                        type: value.value
                                    });
                            }} />
                        </div>
                        {
                            this.renderRaffleTaskConfigSelectItem(task)
                        }
                    </div>
                </div>
            ];
        });
    }

    private renderRaffleTaskConfigSelectItem(task: TaskConfig) {
        const rewardLimit = Number(task.maxRaffleTimesLimit) >= 0 ? 0 : -1;
        const rewardLimitValue = rewardLimit === -1 ? rewardLimitList[0] : rewardLimitList[1];
        const assistanceLimit = Number(task.assistanceLimit) || -1;
        const assistanceLimitValue = assistanceLimit === -1 ? assistanceLimitList[0] : assistanceLimitList[1];
        return [
             <div class='line'>
                <commLabelInput
                    value={task.everyTaskTimes}
                    config={{
                        customInputClass: [!Number(task.everyTaskTimes) ? 'red-input-border' : ''],
                        type: 'number',
                        label: '奖励规则',
                        labelWidth: '120px',
                        placeholder: '请输入数字',
                        min: 0,
                        append: '次任务,',
                        preAppend: '每人每完成',
                    }}
                    onClickOutside={({value})=> {
                        task.everyTaskTimes = value;
                        stateRaffle.taskChange(task);
                        stateRaffle.check();
                    }} />
                    <commLabelInput
                        style='margin-left: 8px;'
                        value={task.raffleTimes}
                        config={{
                            customInputClass: [!Number(task.raffleTimes) ? 'red-input-border' : ''],
                            type: 'number',
                            label: '',
                            placeholder: '请输入数字',
                            min: 0,
                            append: '次抽奖机会',
                            preAppend: '可获得',
                        }}
                        onClickOutside={({value})=> {
                            task.raffleTimes = value;
                            stateRaffle.taskChange(task);
                            stateRaffle.check();
                        }} />
            </div>,
            <div class='line'>
                <commLabelSelect
                    value={rewardLimitValue}
                    config={{
                        labelWidth: '120px',
                        label: '奖励上限',
                        width: '220px',
                        list: rewardLimitList
                    }}
                    onSave={({value})=> {
                        task.maxRaffleTimesLimit = value.value;
                        stateRaffle.taskChange(task);
                        stateRaffle.check();
                    }} />
                    {
                        rewardLimit === 0 && this.renderRaffleRewardLimitConfigSelectItem(task)
                    }
            </div>,
            task.type === 'help_friend' &&
            <div class='line'>
                <commLabelRadio
                    value={assistanceLimitValue}
                    config={{
                        labelWidth: '120px',
                        label: '助力对象限制',
                        list:assistanceLimitList,
                        info: {
                            list: ['可前往"基础设置页"设置新用户定义']
                        }
                    }}
                    onSave={({value})=> {
                    }} />
             </div>
        ];
    }
    private renderRaffleRewardLimitConfigSelectItem(task: TaskConfig) {
        let raffleLimitTypeList = [{
            label: '活动期间',
            value: 'activity'
        }];
        return [
             <commLabelSelect
                style='margin-left: 8px;width:100px'
                value={raffleLimitTypeList[0]}
                config={{
                    list: raffleLimitTypeList
                }}
                onSave={({value})=> {
            }} />,
            <commLabelInput
                style='margin-left: 5px;'
                value={task.maxRaffleTimesLimit}
                config={{
                    customInputClass: [!Number(task.maxRaffleTimesLimit) ? 'red-input-border' : ''],
                    type: 'number',
                    label: '',
                    append: '次抽奖机会',
                    min: 0,
                    placeholder: '请输入数字',
                }}
                onClickOutside={({value})=> {
                    task.maxRaffleTimesLimit = value;
                    stateRaffle.taskChange(task);
                    stateRaffle.check();
                }} />
        ];
    }
    private renderRaffleFreeConfigItem() {
        const raffleTimesType = raffleTimesTypeList.find(item=> {
            return this.raffleConfig.raffleTimesType === item.value;
        }) || raffleTimesTypeList[0];
        return [
            <div class='line' style={{
                display: Number(this.raffleConfig.enableFree) !== 1 ? 'none' : ''
            }}>
                <commLabelSelect
                    value={raffleTimesType}
                    config={{
                        labelWidth: '120px',
                        label: '抽奖次数',
                        list: raffleTimesTypeList
                    }}
                    onSave={({value})=> {
                        this.raffleConfig.raffleTimesType = value.value;
                        stateRaffle.change({
                            raffleTimesType: value.value
                        });
                    }} />
                <commLabelInput
                    style='margin-left: 5px;'
                    value={this.raffleConfig.raffleTimes}
                    config={{
                        customInputClass: [!Number(this.raffleConfig.raffleTimes) ? 'red-input-border' : ''],
                        type: 'number',
                        label: '',
                        placeholder: '请输入数字',
                        min: 0,
                        append: '次/人'
                    }}
                    onClickOutside={({value})=> {
                        this.raffleConfig.raffleTimes = value;
                        stateRaffle.change({
                            raffleTimes: value
                        });
                        stateRaffle.reviewChange();
                        stateRaffle.check();
                    }} />
            </div>,
        ];
    }

    private renderGiftTableCell(options, renderHeader?, renderDefault?) {
        let scope: any = {
            scopedSlots: {}
        };
        if (renderDefault) {
            scope.scopedSlots = {
                default: renderDefault
            };
        }
        return <el-table-column props={{...options}} {...scope}>
            {renderHeader}
        </el-table-column>;
    }

    private editTableInput(props) {
        if (props.row.id === '-1') {
            const probabiliity = 100 -
                this.showGiftList
                    .filter(item=> item.id !== '-1' && item.isSelect)
                    .reduce((pre, cur)=> {
                        return pre + Number(cur.probability);
                    }, 0);
            return <el-popover
                placement='left'
                trigger='hover'>
                <div class='input-tip-ul'>
                自动计算
                </div>
                <div slot='reference'>
                    {probabiliity.toFixed(2)}<i class='input-tip el-icon-info' style='margin-left: 8px;' />
                </div>
            </el-popover>;
        }
        const mustHit = Number(this.raffleConfig.mustHit) === 1;
        let probability = Number(props.row.probability) || '';
        const customInputClass = ['raffle-table-input'];
        if(mustHit && props.row.isSelect && !this.noMornIndex[props.$index]) {
            customInputClass.push('red-input-border');
        }
        return <commLabelInput
            value={probability}
            config={{
                customInputClass,
                label: '',
                type: 'number',
                min: 0,
                max: 100,
                precision: 2,
                showPreviewTip: true,
                placeholder: '0',
                disabled: !props.row.isSelect
            }}
            onClickOutside={async ({value})=> {
                this.noMornIndex.fill(true);
                const index = await stateRaffle.changeProbability(props.row, props.$index, Number(value) || 0);
                if(index !== '') {
                    this.noMornIndex.splice(index, 1, false);
                }
                stateRaffle.check();
            }} />;
    }

    private renderRaffleTable() {
        this.noMornIndex = Array.from({length: this.showGiftList.length}, () => true);
        const cellList = [
            {
                options: {
                    label: '是否选择',
                    width: '50',
                    align: 'center'
                },
                renderDefault: (props)=> {
                    const disabled = props.row.disabled || (!props.row.isSelect && this.selectListLen >= 8);
                    return <el-checkbox
                        value={props.row.isSelect}
                        disabled={disabled}
                        onChange={(value)=> {
                            stateRaffle.changeSelectGift(props.row, props.$index, value);
                        }}>
                    </el-checkbox>;
                }
            },
            {
                options: {
                    'prop': 'name',
                    'min-width': '200'
                },
                renderHeader: <div slot='header'>奖品名称<span style='opacity: 0.6;'>(来源于奖品配置表)</span></div>,
            },
            {
                options: {
                    prop: 'probability',
                    label: '通用概率(%)',
                    width: '90'
                },
                renderDefault: (props)=> {
                    if (!props.row.isCopy) {
                        return this.editTableInput(props);
                    } else {
                        return <div style='font-size: 12px;'>相同奖品将均分概率</div>;
                    }

                }
            },
            // {
            //     options: {
            //         fixed: 'right',
            //         width: '100'
            //     },
            //     renderHeader: <div slot='header'>操作<span style='opacity: 0.6;'>(可复制相同奖品)</span></div>,
            //     renderDefault: (props)=> {
            //         if (!props.row.isCopy) {
            //             return <el-button size='mini' style='margin-bottom: 5px;' onClick={()=> {
            //                 stateRaffle.copy(props.row);
            //             }}>复制</el-button>;
            //         } else {
            //             return <el-button size='mini' style='margin-bottom: 5px;' onClick={()=> {
            //                 stateRaffle.deleteGift(props.row, props.$index);
            //             }}>删除</el-button>;
            //         }

            //     }
            // }
        ];
        return (
            <el-table
                border
                ref='raffleListTable'
                data={this.showGiftList}
                size='mini'
                style='width: 100%'
                // class={[this.showTableData ? '' : 'fixed-el-table']}
                row-key='uuid'>
                {
                    cellList.map(item=> this.renderGiftTableCell(item.options, item.renderHeader, item.renderDefault))
                }
            </el-table>
        );
    }
}

</script>

<style lang="less">

.red-input-border {
    input.el-input__inner {
        border-color: red;
    }
}

.raffle-table-input-preview {
    border: 1px solid red;
}
.raffle-table-input {
    > .el-input__inner {
        border-color: transparent;
        padding: 5px;
        &:focus {
            border-color: #409EFF;
        }
    }
}
.raffle-setting-wrap {
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
    > .tip-border {
        border: 1px solid red;
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
            &.border-bottom {
                border-bottom: 1px solid #eeeeee;
            }
            &.col {
                flex-direction: column;
            }
            > .tip {
                text-align: left;
                font-size: 12px;
                padding: 0 8px;
                margin-bottom: 8px;
            }
        }
        > .task-config-wrap  {
            .line {
                padding: 8px 0;    
                display: flex;
            }
             .line-title {
                display: flex;
                justify-content: space-between;
                font-size: 14px;
                padding: 8px 0;
                .delete-task {
                    cursor: pointer;
                    color: #409EFF;
                }
            }
        }
        > .line-add {
            cursor: pointer;
            color: #409EFF;
            font-size: 14px;
            text-decoration:underline;
            padding: 8px 0;
        }
    }
}
</style>
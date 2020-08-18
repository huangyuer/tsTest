<script lang='tsx'>
import { Component, Vue, Watch, Prop, Ref } from 'vue-property-decorator';
import { CreateElement } from 'vue';
import { Page, Plugin, Pendant } from '@/config';
import { VIFRAME_KEY } from '@/VIFRAME';
import { stateCommon, stateActivity, stateGift, stateWorkbench, stateUi } from '@/state/index';
import { PluginType } from '@/state/module/activity';
import { GiftBean } from '../../state/module/gift';
import utils from '../../utils';

interface PluginItem<T extends Plugin> {
    name: string;
    plugin: T;
    type: PluginType;
}

@Component
export default class GiftSetting extends Vue {

    private get currentPage() {
        return stateUi.data.currentPage;
    }

    private fileName: string = '';

    private showTableData: boolean = false;

    @Ref('giftTable')
    private giftTable!: Vue;

    private hadLoadXLSX: boolean = false;

    public async created() {
        if (window.XLSX) {
            this.hadLoadXLSX = true;
        } else {
            window.__loadScriptFromCdn('/static/xlsx.full.min.js', ()=> {
                this.hadLoadXLSX = true;
            });
        }
        stateGift.data.giftList = [];
        stateGift.showLoading();
        setTimeout(async ()=> {
            stateGift.loadGiftStock();
            await stateGift.loadGiftConfig();
            stateGift.check();
            stateGift.hideLoading();
            this.showTableData = true;
        }, 50);
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

    /**
     * 计算属性，合并接口返回的gift列表以及（新增、复制、上传）的临时数据列表
     */
    private get giftList() {
        return [...stateGift.data.giftList, ...stateGift.data.cacheGiftList];
    }

    /**
     * 校验表格某一列，校验通过会自动添加或更新数据
     */
    private async checkSaveItem(index: number, key: string) {
        const gift = this.giftList[index];
        const status = stateGift.checkGiftValue(gift);
        if (!status) {
            stateWorkbench.data.currentTabStatus = false;
            return;
        }
        stateGift.showLoading();
        if (gift.uuid) {
            // change
            const res = await stateGift.changeGift([gift], [key]);
        } else {
            // add
            const res = await stateGift.addGiftsConfig([gift]);
            if (+res.code === 0) {
                stateGift.data.cacheGiftList.splice(index - stateGift.data.giftList.length, 1);
                await stateGift.loadGiftConfig();
            }
        }
        stateGift.hideLoading();
        stateGift.check();
    }

    /**
     * 解析excel得到列表
     * 对于数据完整的会自动上传
     * 对于数据不完整的自动保存到缓存（刷新页面会丢失）
     */
    private async parseGiftExcel(list: GiftBean[]) {
        list.shift();
        stateGift.showLoading();
        list.forEach(item=> {
            item.usefulTimeStart = utils.formatTime(item.usefulTimeStart);
            item.usefulTimeEnd = utils.formatTime(item.usefulTimeEnd);
            item.showRequiredTip = [];
        });
        const fullList: GiftBean[] = [];
        const cacheList: GiftBean[] = [];
        for (const gift of list) {
            if (stateGift.checkGiftValue(gift)) {
                fullList.push(gift);
            } else {
                cacheList.push(gift);
            }
        }
        if (fullList.length > 0) {
            await stateGift.addGiftsConfig(fullList);
        }
        await stateGift.loadGiftConfig();
        stateGift.data.cacheGiftList.push(...cacheList);
        stateGift.hideLoading();
        stateGift.check();
    }

    public render(h: CreateElement) {
        return (
            <div class='gift-setting-wrap'>
                <p class='config-title'>奖品配置表<span class='sub-title'>奖品数量不可少于4个</span></p>
                {
                    this.renderGiftConfig()
                }
                <p class='config-title'>奖品实时库存<span class='sub-title'>活动发布后于此查看、调整上线库存</span></p>
                {
                    this.renderGiftStock()
                }
            </div>
        );
    }

    private renderGiftStock() {
        const giftStockCellList = [
            {
                options: {
                    prop: 'name',
                    label: '奖品名称',
                    width: '120'
                },
                renderHeader: null,
                renderDefault: null
            },
            {
                options: {
                    prop: 'stockAll',
                    label: '总库存(件)'
                }
            },
            {
                options: {
                    prop: 'stockNow',
                    label: '已上线库存(件)'
                }
            },
            {
                options: {
                    prop: 'send',
                    label: '已领取(件)'
                }
            },
            {
                options: {
                    label: '剩余可领(件)'
                },
                renderDefault: (props)=> {
                    return props.row.stockNow - props.row.send;
                }
            }
        ];
        const dataList = stateWorkbench.data.status === 'publish' ? stateGift.data.giftStockList : this.giftList;
        return (
            <div class='config-wrap' v-loading={stateGift.data.loadingGiftStock}>
                <div class='line'>
                    <el-button size='mini' onClick={async ()=> {
                        await stateGift.loadGiftStock();
                    }}>刷新数据</el-button>
                </div>
                <div class='line'>
                    <el-table
                        border
                        ref='giftStockTable'
                        data={dataList}
                        size='mini'
                        style='width: 100%'>
                        {
                            giftStockCellList.map(item=> this.renderGiftTableCell(item.options, item.renderHeader, item.renderDefault))
                        }
                    </el-table>
                </div>
            </div>
        );
    }

    private renderGiftConfig() {
        return (
            <div class='config-wrap'>
                <div class='line'>
                    <commLabelInput
                        // v-loading={!this.hadLoadXLSX}
                        config={{
                            labelWidth: '0px',
                            label: '',
                            showInput: false,
                            disabled: !this.hadLoadXLSX,
                            select: {
                                show: true,
                                text: '上传文件',
                                accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                            }
                        }}
                        onDealFile={({value})=> {
                            this.fileName = value.name;
                            const reader = new FileReader();
                            reader.onload = (e)=> {
                                const data = e.target?.result;
                                const workbook = window.XLSX.read(data, {type: 'binary'});
                                const json = window.XLSX.utils.sheet_to_json(workbook.Sheets.Sheet1) as any[];
                                this.parseGiftExcel(json);
                            };
                            reader.readAsBinaryString(value);
                        }} />
                    <el-link
                        underline={false}
                        size='mini'
                        style='margin-left: 20px;'
                        type='primary'
                        onClick={()=> {
                            window.open(process.env.VUE_APP_CDN_URL + '/static/giftConfigTpl.xlsx');
                        }}>
                        下载模板
                    </el-link>
                </div>
                <div class='line col' style='padding-top: 0;'>
                    {
                        !this.fileName && <p class='tip'>支持的文件扩展名:.xlsx</p>
                    }
                    {
                        this.fileName && <p class='tip'><i class='el-icon-link'></i>{this.fileName}</p>
                    }
                </div>
                <div class='line'>
                    {
                        this.renderGiftTable()
                    }
                </div>
                <div class='line'>
                    <el-link underline={false} type='primary' onClick={()=> stateGift.addGift()}><i class='el-icon-plus'></i>新增奖品</el-link>
                </div>
            </div>
        );
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
        return <commLabelInput
            v-model={props.row[props.column.property]}
            config={{
                customInputClass: ['table-input'],
                customPreviewClass: [props.row.showRequiredTip.includes(props.column.property) ? 'table-input-preview' : ''],
                rows: 4,
                label: '',
                type: 'textarea',
                resize: 'none',
                showPreviewTip: true
            }}
            onClickOutside={({value})=> {
                this.checkSaveItem(props.$index, props.column.property);
            }} />;
    }

    private editTableDate(props) {
        let timeArr = [props.row.usefulTimeStart, props.row.usefulTimeEnd];
        return <commLabelDateTimePicker value={timeArr} onSave={({ value })=> {
            props.row.usefulTimeStart = value[0];
            props.row.usefulTimeEnd = value[1];
            this.checkSaveItem(props.$index, 'date');
        }} />;
    }

    private async deleteGiftItem(gift: GiftBean, index: number) {
        if (stateGift.data.giftList.length <= 4) {
            this.$alert('奖品数量不能少于4个', '提示', {
                confirmButtonText: '确定',
                showClose: false
            });
            return;
        }
        const hadDelete = await stateGift.deleteGift(gift, index);
        if (hadDelete) {
            stateGift.check();
        }
    }

    private renderGiftTable() {

        const giftTableCellList = [
            {
                options: {
                    fixed: true,
                    type: 'index',
                    label: '序号',
                    width: '60',
                    align: 'center'
                }
            },
            {
                options: {
                    fixed: true,
                    prop: 'name',
                    label: '奖品名称',
                    width: '100'
                },
                renderDefault: this.editTableInput
            },
            {
                options: {
                    prop: 'sku',
                    label: '奖品sku码'
                },
                renderDefault: this.editTableInput
            },
            {
                options: {
                    prop: 'description',
                    width: '100'
                },
                renderHeader: <div slot='header'>奖品描述<i class='el-icon-info'></i></div>,
                renderDefault: this.editTableInput
            },
            {
                options: {
                    width: '100'
                },
                renderHeader: <div slot='header'>奖品图<i class='el-icon-info'></i></div>,
                renderDefault: (props)=> {
                    return <commLabelUpload
                            v-model={props.row.img}
                            style='margin-top: 10px;'
                            config={{
                                label: '',
                                labelPos: 'column',
                                width: '80px',
                                closeable: props.row.img !== ''
                            }}
                            onClose={()=> {
                                props.row.img = '';
                                this.checkSaveItem(props.$index, 'img');
                            }}
                            onSave={({value})=> {
                                this.checkSaveItem(props.$index, 'img');
                            }}
                            />;
                }
            },
            {
                options: {
                    prop: 'value',
                    label: '奖品价值'
                },
                renderDefault: this.editTableInput
            },
            {
                options: {
                    prop: 'unit',
                    label: '价值单位'
                },
                renderDefault: this.editTableInput
            },
            {
                options: {
                    prop: 'stockAll',
                    label: '库存数量'
                },
                renderDefault: this.editTableInput
            },
            {
                options: {
                    prop: 'stockOnlineEveryday'
                },
                renderHeader: <div slot='header'>每日上线库存<i class='el-icon-info'></i></div>,
                renderDefault: this.editTableInput
            },
            {
                options: {
                    prop: 'hitLimitNum',
                    label: '中奖上限'
                },
                renderDefault: this.editTableInput
            },
            {
                options: {
                    label: '有效期',
                    width: 240
                },
                renderDefault: this.editTableDate
            },
            {
                options: {
                    prop: 'usefulDays',
                    label: '领取后有效天数'
                },
                renderDefault: this.editTableInput
            },
            {
                options: {
                    fixed: 'right',
                    prop: 'id',
                    width: '80',
                    label: '操作'
                },
                renderDefault: (props)=> {
                    return [
                        <el-button size='mini' style='margin-bottom: 5px;' onClick={()=> {
                            stateGift.copyGift(props.row);
                        }}>复制</el-button>,
                        <br />,
                        <el-button size='mini' onClick={()=> this.deleteGiftItem(props.row, props.$index)}>删除</el-button>
                    ];
                }
            }
        ];
        return (
            <el-table
                border
                ref='giftTable'
                data={this.giftList}
                size='mini'
                style='width: 100%'
                class={[this.showTableData ? '' : 'fixed-el-table']}
                v-loading={stateGift.data.loadingTable}>
                {
                    giftTableCellList.map(item=> this.renderGiftTableCell(item.options, item.renderHeader, item.renderDefault))
                }
            </el-table>
        );
    }
}

</script>

<style lang="less">

.table-input-preview {
    border: 1px solid red;
}
.table-input {
    > .el-textarea__inner {
        border-color: transparent;
        padding: 5px;
        &:focus {
            border-color: #409EFF;
        }
    }
}

.gift-setting-wrap {
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
            &.share-line {
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
    }
}
</style>
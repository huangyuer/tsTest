import Vue from 'vue';
import BaseModule from './base';
import api from '@/api/index';
import { ActivityConfig, Page } from '@/config';
import { stateCommon, stateActivity, stateRaffle, stateWorkbench } from '../index';
import utils from '@/utils/index';
import { VIFRAME_KEY, REFRESH_KEY } from '@/VIFRAME';
import { EditorTabName } from './workbench';

export interface GiftBean {
    uuid: string;
    id: string;
    description: string;
    img: string;
    name: string;
    probability: number;
    sku: string;
    stockAll: number;
    stockOnlineEveryday: number;
    unit: string;
    usefulDays: string;
    usefulTimeStart: string;
    usefulTimeEnd: string;
    value: string;
    hitLimitNum: number;
    isSwitch: number;
    showRequiredTip: Array<keyof GiftBean>;
}

/**
 *  奖品配置
 */
class Gift extends BaseModule<{
    giftList: GiftBean[],
    cacheGiftList: GiftBean[],
    loadingTable: boolean,
    loadingGiftStock: boolean,
    giftStockList: any[]
}> {
    public constructor() {
        super({
            giftList: [],
            cacheGiftList: [],
            loadingTable: false,
            loadingGiftStock: false,
            giftStockList: []
        });
    }

    public async loadGiftConfig() {
        const res = await api.vAuthGet('/api/backweb/raffle/gift/boot', {
            refresh: true
        });
        if (Number(res.code) === 0) {
            this.data.giftList = (res.data.list || []).map(item=> {
                item.showRequiredTip = [];
                return item;
            });
        }
        return res;
    }

    public async loadGiftStock() {
        // 还没发布，这个接口没有数据
        if (stateWorkbench.data.status !== 'publish') {
            return;
        }
        this.data.loadingGiftStock = true;
        const res = await api.vAuthGet('/api/backweb/raffle/gift/stock', {
            refresh: true
        });
        this.data.loadingGiftStock = false;
        if (Number(res.code) === 0) {
            this.data.giftStockList = res.data.list || [];
        }
    }

    public async addGiftsConfig(list: GiftBean[]) {
        const res = await stateWorkbench.autoSaveStart(
            api.vAuthPost('/api/backweb/raffle/gift/add', {
                data: {
                    list: list.map(item=> {
                        const g = JSON.parse(JSON.stringify(item)) as GiftBean;
                        delete g.showRequiredTip;
                        return g;
                    })
                },
                refresh: true
            })
        );
        if (Number(res.code) === 0) {
            // 提交成功，做自动勾选校验
            await stateRaffle.loadRaffleConfig(true);
        }
        return res;
    }

    public async deleteGift(gift: GiftBean, index: number) {
        if (Number(gift.isSwitch) === 1) {
            return new Promise<boolean>(resolve=> {
                Vue.prototype.$alert('该奖品已被使用，不可删除', '提示', {
                    confirmButtonText: '确定',
                    showClose: false,
                    callback: ()=> {
                        resolve(false);
                    }
                });
            });
        }
        return new Promise<boolean>(resolve=> {
            Vue.prototype.$confirm('删除后不可撤回', '确认要删除这⾏奖品信息吗?', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(async () => {
                if (gift.uuid) {
                    this.showLoading();
                    const res = await stateWorkbench.autoSaveStart(
                        api.vAuthGet('/api/backweb/raffle/gift/delete', {
                            params: {
                                uuid: gift.uuid
                            },
                            refresh: true
                        })
                    );
                    if (res && Number(res.code) === 0) {
                        this.data.giftList.splice(index, 1);
                    }
                    this.hideLoading();
                    console.log(res);
                } else {
                    this.data.cacheGiftList.splice(index - this.data.giftList.length, 1);
                }
                resolve(true);
            }).catch(() => {
                resolve(false);
            });
        });
    }

    public async changeGift(list: GiftBean[], keyList: string[], showTip: boolean = true) {
        const gl: GiftBean[] = [];
        list.forEach(gift=> {
            const g = JSON.parse(JSON.stringify(gift)) as GiftBean;
            delete g.showRequiredTip;
            gl.push(g);
        });
        const res = await stateWorkbench.autoSaveStart(
            api.vAuthPost('/api/backweb/raffle/gift/change', {
                data: {
                    list: gl
                },
                refresh: true
            }),
            showTip
        );
        if (keyList.includes('name') || keyList.includes('img')) {
            Vue.prototype.VIFRAME.send(VIFRAME_KEY.REFRESH, {name: REFRESH_KEY.RAFFLE_GIFT});
        }
        return res;
    }

    public setTabStatus(status) {
        const tab = stateWorkbench.data.stageStatus.editor.find(item=> item.name === EditorTabName.Gift);
        if (tab) {
            tab.checkSuccess = status;
        }
    }

    public copyGift(gift: GiftBean) {
        const newGift = JSON.parse(JSON.stringify(gift)) as GiftBean;
        newGift.uuid = '';
        newGift.id = '';
        newGift.sku = '';
        newGift.stockAll = 0;
        newGift.stockOnlineEveryday = 0;
        newGift.hitLimitNum = 0;
        newGift.isSwitch = 0;
        let keys: Array<keyof GiftBean> = ['sku', 'stockAll', 'stockOnlineEveryday', 'hitLimitNum'];
        for (let key of keys) {
            if (!newGift.showRequiredTip.includes(key)) {
                newGift.showRequiredTip.push(key);
            }
        }
        this.data.cacheGiftList.push(newGift);
        this.setTabStatus(false);
    }

    public addGift() {
        const gift: GiftBean = {
            uuid: '',
            id: '',
            sku: '',
            stockAll: 0,
            stockOnlineEveryday: 0,
            hitLimitNum: 0,
            isSwitch: 0,
            description: '',
            name: '',
            img: 'https://cdn.via.cool/jtp-host/resource/activity/1056/2020-07-27/28527194dab64b339a09e7277efc5552.png',
            unit: '',
            value: '',
            usefulDays: '',
            usefulTimeStart: utils.formatTime(),
            usefulTimeEnd: utils.formatTime(),
            showRequiredTip: ['name', 'value', 'sku', 'stockAll', 'stockOnlineEveryday', 'usefulDays', 'hitLimitNum'],
            probability: 0
        };
        this.data.cacheGiftList.push(gift);
        this.setTabStatus(false);
    }

    public async showLoading() {
        this.data.loadingTable = true;
    }

    public async hideLoading() {
        this.data.loadingTable = false;
    }

    /**
     * 校验表格所有数据
     */
    public async check(showDialog: boolean = false) {
        const list = [...this.data.giftList, ...this.data.cacheGiftList];
        let status = true;
        if (list.length < 4) {
            status = false;
        } else {
            for (const gift of list) {
                if (!this.checkGiftValue(gift)) {
                    status = false;
                }
            }
        }
        this.setTabStatus(status);
        if (!showDialog || status) {
            return status;
        } else {
            return new Promise<boolean>(resolve=> {
                if (this.data.giftList.length <= 4) {
                    Vue.prototype.$confirm('奖品数量不能少于4个，是否退出当前页', '提示', {
                        confirmButtonText: '确定',
                        cancelButtonText: '取消',
                        type: 'warning'
                    }).then(() => {
                        resolve(true);
                    }).catch(() => {
                        resolve(false);
                    });
                } else {
                    Vue.prototype.$confirm('奖品信息填写不完整，离开页面将丢失部分奖品信息数据。', '提示', {
                        confirmButtonText: '确定',
                        cancelButtonText: '取消',
                        type: 'warning'
                    }).then(() => {
                        resolve(true);
                    }).catch(() => {
                        resolve(false);
                    });
                }
            });
        }
    }

    /**
     * 校验某一列的数据，并做单元格提示
     */
    public checkGiftValue(gift: GiftBean) {
        let status = true;
        gift.showRequiredTip = [];
        const list: Array<keyof GiftBean> = ['name', 'sku', 'value', 'unit', 'stockAll', 'stockOnlineEveryday', 'usefulDays', 'hitLimitNum'];
        for (let key of list) {
            if (gift[key] === '') {
                gift.showRequiredTip.push(key);
                status = false;
            }
        }
        const noZeroAndNegativeList: Array<keyof GiftBean> = ['value', 'stockAll', 'stockOnlineEveryday', 'usefulDays', 'hitLimitNum'];
        for (let key of noZeroAndNegativeList) {
            if (isNaN(Number(gift[key])) ||  Number(gift[key]) <= 0) {
                gift.showRequiredTip.push(key);
                status = false;
            }
        }
        // 因为存在只校验一行的情况，只要有一行校验不通过，就要设置为false
        if (!status) {
            this.setTabStatus(status);
        }
        return status;
    }
}

export default Gift;

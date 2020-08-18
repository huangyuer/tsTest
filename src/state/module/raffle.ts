import Vue from 'vue';
import BaseModule from './base';
import api from '@/api/index';
import { ActivityConfig, Page } from '@/config';
import { stateCommon, stateActivity, stateGift, stateWorkbench } from '../index';

export interface GiftIds {
    uuid: string;
    id: string;
    isCopy: boolean;
    isSelect: boolean;
    disabled: boolean;
    probability: number;
}
import { GiftBean } from './gift';
import { VIFRAME_KEY, REFRESH_KEY } from '@/VIFRAME';
import { EditorTabName } from './workbench';

export type ShowGiftItem = GiftBean & GiftIds;

export interface GiftItem {
    uuid: string;
    id: string;
    name: string;
    description: string;
    img: string;
    unit: string;
    usefulDays: string;
    usefulTimeStart: string;
    usefulTimeEnd: string;
    value: string;
}

export interface ShowConfig {                   // 传入奖品排序 格式最好是JSONStringify，后端不会使用该字段 可以传入谢谢参与数量 图片 奖品排序位置等，由前端自行决定
    notHitImg: string;                          // 谢谢参与 图片
    giftList: GiftIds[];                        // 奖品列表
    showList: GiftIds[];                        // 前端展示用的奖品列表（有排序）(已弃用)
}

export interface RaffleConfig {
    enableFree: boolean;                            // 是否免费获取
    raffleTimesType: 'activity' | 'day';            // 抽奖周期 活动期间/天
    raffleTimes: number;                            // 抽奖次数
    hitLimitType: 'activity' | 'day';               // 中奖次数上限 周期 天/活动期间
    hitLimitNum: number;                            // 中奖次数上限
    useRaffleTimesLimit: number;                    // 抽奖次数上限 目前固定为每天 暂时不可选周期。 传-1表示不限制
    showConfig: ShowConfig;
    mustHit: number;                                // 是否100%中奖
}
export interface TaskConfig {
    enableTask: boolean;                                                                // 是否做任务获取
    type: 'help_friend' | 'forward_share' | 'invite_friends' | 'daily_sign';            // 任务类型
    maxRaffleTimesLimit: number;                                                        // 奖励上限限制时抽奖次数,传-1表示不限制
    assistanceLimit: number;                                                            // 助力对象限制,。 传-1表示不限制
    everyTaskTimes: number;                                                             // 奖励规则任务数
    raffleTimes: number;                                                                // 奖励规则抽奖机会
    taskNum: number;                                                                    // 任务数量
}


const getDefaultShowConfig = ()=> {
    const showConfig: ShowConfig = {
        notHitImg: 'https://cdn.via.cool/jtp-host/2020-06-06/abaa45795fec466798e91d3ba615df4b',
        giftList: [],
        showList: []
    };
    return JSON.parse(JSON.stringify(showConfig)) as ShowConfig;
};

/**
 * 抽奖配置
 */
class Raffle extends BaseModule<{
    taskConfig: {
        enableTask: boolean;
        list: TaskConfig[];
    };
    raffleConfig: RaffleConfig;
    showGiftList: ShowGiftItem[];
}> {

    public constructor() {
        super({
            taskConfig: {
                enableTask: false,
                list: []
            },
            raffleConfig: {
                enableFree: false,                         // 默认开启免费获取
                raffleTimesType: 'activity',
                raffleTimes: 0,
                hitLimitType: 'activity',
                hitLimitNum: 0,
                useRaffleTimesLimit: 0,
                mustHit: 0,
                showConfig: {
                    notHitImg: 'https://cdn.via.cool/jtp-host/2020-06-06/abaa45795fec466798e91d3ba615df4b',
                    giftList: [],
                    showList: []
                }
            },
            showGiftList: [],
        });
    }

    public async loadRaffleConfig(autoAdd: boolean = false) {
        // 必须先加载奖品列表，否则下面可能会触发更新操作导致抽奖配置列表变了
        await stateGift.loadGiftConfig();
        const [res, taskRes] = await Promise.all([
            await api.vAuthGet('/api/backweb/raffle/raffle/boot', {
                refresh: true
            }),
            this.taskList()
        ]);
        if (+res.code === 0) {
            const netShowConfig = res.data.raffleConfig.showConfig;
            const showConfig = Object.assign(getDefaultShowConfig(), JSON.parse(netShowConfig || '{}'));
            res.data.raffleConfig.showConfig = showConfig;
            this.data.raffleConfig = Object.assign(this.data.raffleConfig, res.data.raffleConfig);
            this.data.raffleConfig.enableFree = Number(this.data.raffleConfig.raffleTimes) > 0;
            await this.mergeToShowGiftList(autoAdd || this.data.raffleConfig.showConfig.giftList.length === 0);
            this.reviewChange();
        }
        this.check();
        return res;
    }
    public reviewChange() {
        // 读取免费次数，判断有开免费次数，就显示免费次数。没开免费次数就显示0
        // 当选择有限制次数的，免费次数大于抽奖上限，显示抽奖上限，否则显示免费次数
        // 当选择不限制的，若有免费次数的，取免费，否则0
        let viewNum = 0;
        if(this.data.raffleConfig.enableFree) {
            viewNum = this.data.raffleConfig.useRaffleTimesLimit === -1 ?
                Number(this.data.raffleConfig.raffleTimes) :
                Math.min(Number(this.data.raffleConfig.raffleTimes), Number(this.data.raffleConfig.useRaffleTimesLimit));
        }
        Vue.prototype.VIFRAME.send(VIFRAME_KEY.REFRESH, {name: REFRESH_KEY.RAFFLE_DATA_VALUE, data: [{
            key: 'leftRaffleTimes',
            value: viewNum
        }]});
    }

    /**
     * 对奖品表和展示表进行筛选合并
     */
    private filterGiftList() {
        const showConfig = this.data.raffleConfig.showConfig;
        const giftList = stateGift.data.giftList;
        let hadChange = false;
        // 先把giftList有的添加到list2中
        for (let gift of giftList) {
            const itemList = showConfig.giftList.filter(g=> g.uuid === gift.uuid);
            if (itemList.length === 0) {
                hadChange = true;
                const newGift: GiftIds = {
                    uuid: gift.uuid,
                    id: gift.id,
                    isCopy: false,
                    isSelect: false,
                    disabled: false,
                    probability: 0
                };
                showConfig.giftList.push(newGift);
            }
            // 设置最新概率
            itemList.forEach(item=> {
                item.probability = Number(gift.probability) || 0;
            });
        }
        // 再把giftList没有的从showConfig.giftList中删除
        for (let i = showConfig.giftList.length - 1;i >= 0;--i) {
            if(showConfig.giftList[i].uuid === '-1') {
                continue;
            }
            const item = giftList.find(g=> g.uuid === showConfig.giftList[i].uuid);
            if (!item) {
                hadChange = true;
                showConfig.giftList.splice(i, 1);
            }
        }
        return hadChange;
    }

    /**
     * 对展示表和排序表进行筛选合并
     */
    private filterShowList() {
        const showConfig = this.data.raffleConfig.showConfig;
        const selectList = JSON.parse(JSON.stringify(showConfig.giftList.filter(item=> item.isSelect))) as Array<GiftIds | any>;
        let hadChange = false;
        // 再把selectList没有的从showConfig.showList中删除,同时把showConfig.showList有的从selectList中删除
        for (let i = showConfig.showList.length - 1;i >= 0;--i) {
            const index = selectList.findIndex(g=> g.uuid === showConfig.showList[i].uuid);
            if (index === -1) {
                hadChange = true;
                showConfig.showList.splice(i, 1);
            } else {
                selectList.splice(index, 1);
            }
        }
        // 最后selectList剩下的都添加到showConfig.showList中
        for (let gift of selectList) {
            hadChange = true;
            const newGift: GiftIds = {
                uuid: gift.uuid,
                id: gift.id,
                isCopy: gift.isCopy || false,
                isSelect: gift.isSelect || false,
                disabled: gift.disabled || false,
                probability: gift.probability || 0
            };
            showConfig.showList.push(newGift);
        }
        return hadChange;
    }

    /**
     * 合并奖品列表的数据（增删已经填充奖品名称数据）
     */
    private async mergeToShowGiftList(autoAdd: boolean = false) {
        const showConfig = this.data.raffleConfig.showConfig;
        let hadChange = false;
        // 100%中奖，去掉谢谢参与
        if (Number(this.data.raffleConfig.mustHit) === 1) {
            const sourceLen = showConfig.giftList.length;
            showConfig.giftList = showConfig.giftList.filter(item=> item.uuid !== '-1');
            if (showConfig.giftList.length !== sourceLen) {
                hadChange = true;
            }
        } else {
            // 否则如果没有谢谢参与，则需要添加进来
            if (!showConfig.giftList.find(item=> item.uuid === '-1')) {
                hadChange = true;
                showConfig.giftList.push({
                    uuid: '-1',
                    id: '-1',
                    isCopy: false,
                    isSelect: true,
                    disabled: true,  // 该谢谢参与不能取消选择，确保一定会存在
                    probability: 0
                });
            }
        }
        let hadChange1 = this.filterGiftList();
        let hadChange2 = this.filterShowList();
        // 对表格里的奖品进行排序，已选并且可以填写概率的优先排在前面
        this.data.showGiftList = showConfig.giftList.map(item=> {
            const gift = Object.assign({}, (stateGift.data.giftList.find(g=> g.uuid === item.uuid) || {}), item) as ShowGiftItem;
            if (gift.uuid === '-1') {
                gift.name = '谢谢参与';
            }
            gift.probability = gift.probability || 0;
            return gift;
        });
        if (hadChange || hadChange1 || hadChange2) {
            await this.changeShowConfig();
        }
        await this.autoFixedGiftData(autoAdd);
    }

    // 对奖品进行排序，已选的排在前面，复制的奖品排后面
    public sortList() {
        this.data.showGiftList.sort((a, b)=> {
            if (a.isSelect && b.isSelect) {
                if (a.isCopy) {
                    return 1;
                }
                if (b.isCopy) {
                    return -1;
                }
                return 0;
            }
            if (a.isSelect) {
                return -1;
            }
            if (b.isSelect) {
                return 1;
            }
            return 0;
        });
    }

    /**
     * 自动修复奖品概率等
     * 比如概率总和超过100，会自动调整后加入的奖品概率
     */
    public async autoFixedGiftData(autoAdd: boolean = false) {
        this.sortList();
        const giftList = this.data.showGiftList;
        let count = 0;
        const changeList: any = [];
        if (autoAdd) {
            for (let i = 0;i < giftList.length;++i) {
                if (giftList[i].isSelect) {
                    count++;
                } else {
                    if (count < 8) {
                        count++;
                        giftList[i].isSelect = true;
                        if (!giftList[i].isCopy) {
                            giftList[i].isSwitch = 1;
                            // 需要自动更新选择
                            changeList.push({
                                uuid: giftList[i].uuid,
                                isSwitch: 1
                            });
                        }
                    }
                }
                if (count >= 8) {
                    break;
                }
            }
        }
        const switchList = giftList.filter(item=> !item.isCopy && item.isSelect);
        let pro = 0;
        for (let i = 0;i < switchList.length;++i) {
            if (Number(switchList[i].probability) + pro > 100) {
                const item = changeList.find(c=> c.uuid === switchList[i].uuid);
                const probability = pro === 100 ? 0 : 100 - pro;
                switchList[i].probability = probability;
                pro += probability;
                if (item) {
                    item.probability = probability;
                } else {
                    if (switchList[i].uuid === '-1') {
                        continue;
                    }
                    changeList.push({
                        uuid: switchList[i].uuid,
                        probability
                    });
                }
            } else {
                pro += Number(switchList[i].probability);
            }
        }
        if (changeList.length > 0) {
            await stateGift.changeGift(changeList, [], false);
            await this.changeShowConfig();
        }
    }

    public async changeShowConfig(list: {[key: string]: any} = {}) {
        const showConfig = this.data.raffleConfig.showConfig;
        showConfig.giftList = this.data.showGiftList.map(item=> {
            return {
                uuid: item.uuid,
                id: item.id,
                isCopy: item.isCopy,
                isSelect: item.isSelect,
                disabled: item.disabled,
                probability: item.probability
            };
        });
        this.filterShowList();
        const res =  await this.change({
            showConfig: JSON.stringify(showConfig),
            ...list
        });
        Vue.prototype.VIFRAME.send(VIFRAME_KEY.REFRESH, {name: REFRESH_KEY.RAFFLE_GIFT});
        return res;
    }
    public async change(list: {[key: string]: any}) {
        const res = await stateWorkbench.autoSaveStart(
            api.vAuthPost('/api/backweb/raffle/raffle/change', {
                data: { list },
                refresh: true
            })
        );
        return res;
    }

    /*
     *   任务相关接口
     */
    // 增加任务
    public async taskAdd(list: {[key: string]: any}) {
        const res = await stateWorkbench.autoSaveStart(
            api.vAuthPost('/api/backweb/workbench/raffleTask/add', {
                data:  list,
                refresh: true
            })
        );
        this.taskList();
        return res;
    }
    // 删除任务
    public async taskDelete(list: {[key: string]: any}) {
        if (this.data.taskConfig.list.length === 1) {
            return Vue.prototype.$confirm('删除任务后，已设置的参数不再保留', '是否确定删除？', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(async () => {
                const res = await stateWorkbench.autoSaveStart(
                    api.vAuthPost('/api/backweb/workbench/raffleTask/deleteOne', {
                        data: list,
                        refresh: true
                    })
                );
                this.taskList();
                return res;
            }).catch(() => {});
        }
    }
    // 任务列表
    public async taskList() {
        // 目前只有一个好友助力
        const res = await api.vAuthGet('/api/backweb/workbench/raffleTask/', {
            refresh: true
        });
        if (+res.code === 0) {
            this.data.taskConfig.list = res.data.raffleTaskList || [];
            this.data.taskConfig.enableTask = this.data.taskConfig.list.length > 0;
        }
        this.check();
        return res;
    }
    // 任务编辑
    public async taskChange(task: TaskConfig) {
        const res = await stateWorkbench.autoSaveStart(
            api.vAuthPost('/api/backweb/workbench/raffleTask/change', {
                data: task,
                refresh: true
            })
        );
        return res;
    }
     // 任务开关(删除所有任务)
     public taskTrigger(enableTask: boolean) {
        if (enableTask) {
            if (this.data.taskConfig.list.length === 0) {
                this.taskAdd({
                    everyTaskTimes: 0,
                    raffleTimes: 0,
                    maxRaffleTimesLimit:  0,
                    type:'help_friend'
                });
                Vue.prototype.VIFRAME.send(VIFRAME_KEY.REFRESH, {name: REFRESH_KEY.RAFFLE_DATA_VALUE, data: [{
                    key: 'taskTrigger',
                    value: Number(1)
                }]});
            }
        } else if (!enableTask && this.data.taskConfig.list.length > 0) {
            Vue.prototype.$confirm('关闭任务后，已设置的参数不再保留', '是否确定关闭？', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                this.taskTriggers();
                Vue.prototype.VIFRAME.send(VIFRAME_KEY.REFRESH, {name: REFRESH_KEY.RAFFLE_DATA_VALUE, data: [{
                    key: 'taskTrigger',
                    value: Number(0)
                }]});
            }).catch(() => {
                this.data.taskConfig.enableTask = true;
            });
        }
    }
    public async taskTriggers() {
        const res = await stateWorkbench.autoSaveStart(
            api.vAuthPost('/api/backweb/workbench/raffleTask/deleteAll', {
                refresh: true
            })
        );
        this.taskList();
        return res;
    }
    public async copy(gift: ShowGiftItem) {
        const item = JSON.parse(JSON.stringify(gift)) as ShowGiftItem;
        item.isCopy = true;
        item.isSelect = false;
        item.disabled = false;
        this.data.showGiftList.push(item);
        this.changeShowConfig();
    }

    public async deleteGift(gift: ShowGiftItem, index: number) {
        const giftList = this.data.showGiftList;
        const selectList = giftList.filter(item=> item.isSelect);
        if (selectList.length <= 4 && gift.isSelect) {
            Vue.prototype.$alert('奖品数量不能少于4个', '提示', {
                confirmButtonText: '确定'
            });
            return;
        }
        giftList.splice(index, 1);
        this.changeShowConfig();
    }

    public async changeSelectGift(gift: ShowGiftItem, index: number, value: boolean) {
        const giftList = this.data.showGiftList;
        gift.isSelect = value;
        let changeList: ShowGiftItem[] = [];
        if (!gift.isCopy && !value) {
            changeList = giftList.filter(item=> item.uuid === gift.uuid && item.isSelect);
            changeList.forEach(item=> {
                item.isSelect = value;
            });
        }
        const selectList = giftList.filter(item=> item.isSelect);
        if (!value && selectList.length < 4) {
            Vue.prototype.$alert('奖品数量不能少于4个', '提示', {
                confirmButtonText: '确定',
                showClose: false,
                callback: ()=> {
                    gift.isSelect = !value;
                    changeList.forEach(item=> {
                        item.isSelect = !value;
                    });
                }
            });
            return;
        }
        if (value && selectList.length > 8) {
            Vue.prototype.$alert('奖品数量不能大于8个', '提示', {
                confirmButtonText: '确定',
                showClose: false,
                callback: ()=> {
                    gift.isSelect = !value;
                    changeList.forEach(item=> {
                        item.isSelect = !value;
                    });
                }
            });
            return;
        }
        this.sortList();
        // 不是复制的，会影响概率，需要自动修复概率
        if (!gift.isCopy) {
            const oldProbability = Number(gift.probability);
            gift.isSwitch = value ? 1 : 0;
            const changeGiftList: ShowGiftItem[] = [];
            // 取消选中的话没有关系，如果是选中就需要调整概率
            if (value) {
                let pro = 0;
                const selectRealGiftList = giftList.filter(item=> !item.isCopy && item.isSelect && item.uuid !== gift.uuid);
                // 把gift放到最后，确保自动修复的是最后修改的这一项
                selectRealGiftList.push(gift);
                selectRealGiftList.forEach(item=> {
                    if (Number(item.probability) + pro > 100) {
                        const probability = pro === 100 ? 0 : 100 - pro;
                        pro += probability;
                        if (probability !== Number(item.probability)) {
                            Vue.prototype.$nextTick(()=> {
                                item.probability = probability;
                            });
                            changeGiftList.push({
                                uuid: item.uuid,
                                probability
                            } as any);
                        }
                    } else {
                        pro += Number(item.probability);
                    }
                });
            }
            if (changeGiftList.length === 0) {
                changeGiftList.push(gift);
            }
            if (changeGiftList.length > 0) {
                await stateGift.changeGift(changeGiftList, [], false);
            }
        }
        this.changeShowConfig();
    }

    public async changeProbability(gift: ShowGiftItem, index: number, value: number) {
        let noMornIndex;
        const giftList = this.data.showGiftList;
        const changeGiftList: ShowGiftItem[] = [];
        const oldProbability = Number(gift.probability);
        gift.probability = value;
        // 如果修改的是没有选中的，不影响概率
        if (gift.isSelect) {
            let pro = 0;
            const selectList = giftList.filter(item=> !item.isCopy && item.isSelect && item.uuid !== gift.uuid);
            // 把gift放到最后，确保自动修复的是最后修改的这一项
            selectList.push(gift);
            selectList.forEach(item=> {
                if (Number(item.probability) + pro > 100) {
                    const probability = pro === 100 ? 0 : 100 - pro;
                    pro += probability;
                    if (probability !== Number(item.probability)) {
                        Vue.prototype.$nextTick(()=> {
                            item.probability = probability;
                            noMornIndex = '';
                        });
                        if (item.uuid === '-1') {
                            return;
                        }
                        changeGiftList.push({
                            uuid: item.uuid,
                            probability
                        } as any);
                    }
                } else {
                    pro += Number(item.probability);
                    if(pro === 100) {
                        noMornIndex = '';
                    } else {
                        noMornIndex = index;
                    }
                }
            });
        }
        if (changeGiftList.length === 0 && oldProbability !== Number(gift.probability)) {
            changeGiftList.push({
                uuid: gift.uuid,
                probability: gift.probability
            } as any);
        }
        if (changeGiftList.length > 0) {
            await stateGift.changeGift(changeGiftList, []);
        }
        return noMornIndex;
    }

    /**
     * 选择了是否100%中奖，需要同时处理奖品列表里的“谢谢参与选项”
     */
    public async changeMustHit() {
        const showGiftList = this.data.showGiftList;
        // 100%中奖，去掉谢谢参与
        if (Number(this.data.raffleConfig.mustHit) === 1) {
            this.data.showGiftList = showGiftList.filter(item=> item.uuid !== '-1');
        } else {
            // 否则如果没有谢谢参与，则需要添加进来
            if (!showGiftList.find(item=> item.uuid === '-1')) {
                showGiftList.push({
                    uuid: '-1',
                    id: '-1',
                    isCopy: false,
                    isSelect: true,
                    disabled: true,  // 该谢谢参与不能取消选择，确保一定会存在
                    probability: 0,
                    name: '谢谢参与'
                } as ShowGiftItem);
                this.sortList();
            }
        }
        await this.changeShowConfig({
            mustHit: this.data.raffleConfig.mustHit
        });
    }

    public addTaskClick() {
        this.taskAdd({
            everyTaskTimes: 0,
            raffleTimes: 0,
            maxRaffleTimesLimit:  0,
            type:'help_friend'
        });
    }

    public async check(showDialog: boolean = false) {
        const raffleConfig = this.data.raffleConfig;
        const taskConfig = this.data.taskConfig;
        let success = true;
        // 免费获取
        // 抽奖次数
        const enableFree = raffleConfig.enableFree;
        const enableTask = taskConfig.enableTask;
        if (enableFree && !Number(raffleConfig.raffleTimes)) {
            success = false;
        }
        // 做任务获取
        if(enableTask) {
            taskConfig.list.forEach(item=> {
                if(item.type === 'help_friend') {
                    // 奖励规则任务数
                    if (Number(item.everyTaskTimes) <= 0) {
                        success = false;
                    }
                    // 奖励规则抽奖数
                    if (Number(item.raffleTimes) <= 0) {
                        success = false;
                    }
                    // 奖励上限限制
                    if(Number(item.maxRaffleTimesLimit) === 0) {
                        // 奖励上限限制时抽奖机会
                        success = false;
                    }
                }
            });
            console.log(success);
        }
        // 是否100%中奖
        const mustHit = Number(raffleConfig.mustHit) === 1;
        if (mustHit) {
            const list = this.data.showGiftList.filter(item=> item.isSelect);
            if (list.length < 4) {
                success = false;
            }
            let sum = 0;
            list.forEach(item=> {
                sum += Number(item.probability);
                success = sum < 100 ? false: true;
            });
        }
         // 总中奖次数上限
        if (!Number(raffleConfig.hitLimitNum)) {
            success = false;
        }
        const tab = stateWorkbench.data.stageStatus.editor.find(item=> item.name === EditorTabName.Raffle);
        if (tab) {
            tab.checkSuccess = success;
        }
        if (!showDialog || success) {
            return success;
        } else {
            return new Promise<boolean>(resolve=> {
                Vue.prototype.$confirm('当前页面有必填参数校验不通过，离开页面数据将会丢失', '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                }).then(() => {
                    resolve(true);
                }).catch(() => {
                    resolve(false);
                });
            });
        }
    }
}

export default Raffle;

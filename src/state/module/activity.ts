import Vue from 'vue';
import BaseModule from './base';
import api from '@/api/index';
import { ActivityConfig, Page, Plugin, Pendant, Dialog } from '@/config';
import { VIFRAME_KEY } from '@/VIFRAME';
import { stateCommon, stateGift, stateRaffle, stateWorkbench } from '../index';
import * as utils from '@/utils/index';
import { EditorTabName } from './workbench';

export enum PluginType {
    Plugin = 'plugin',      // 组件
    Pendant = 'pendant'     // 挂件
}

export enum LOGIN_OPPORTUNITY {
    ENTER_ACTIVITY =  'enter_activity',
    WHEN_NEED = 'when_need'
}

/**
 * 基础配置
 */
class Activity extends BaseModule<{
    baseConfig: {
        name: string;
        startTime: string;
        endTime: string;
        newUserType: string;
        iosDownloadUrl: string;
        androidDownloadUrl: string;
        customParams: {
            jtpActivityId: string;
            activityType: Array<{
                label: string;
                value: string;
            }>
        };
        loginOpportunity: LOGIN_OPPORTUNITY;
        shareConfig: {
            canShare: boolean;
            title: string;
            desc: string;
            img: string;
        }
    };                                        // 基础配置
}> {

    public constructor() {
        super({
            baseConfig: {
                name: '',
                startTime: '',
                endTime: '',
                newUserType: '',
                iosDownloadUrl: '',
                androidDownloadUrl: '',
                customParams: {
                    jtpActivityId: '',
                    activityType: []
                },
                loginOpportunity: LOGIN_OPPORTUNITY.WHEN_NEED,
                shareConfig: {
                    canShare: false,
                    title: '',
                    desc: '',
                    img: ''
                }
            }
        });
    }

    public setConfig(baseRes) {
        const [bootRes] = baseRes;

        try {
            bootRes.data.shareConfig = JSON.parse(bootRes.data.shareConfig);
        } catch(e) {
            bootRes.data.shareConfig = {};
        }
        let customParams: any = {};
        try {
            customParams = JSON.parse(bootRes.data.customParams);
        } catch(e) {
            customParams = {};
        }
        customParams = Object.assign(this.data.baseConfig.customParams, customParams);
        const startTime = bootRes.data.startTime || window.dayjs().format('YYYY-MM-DD');
        const endTime = bootRes.data.endTime || window.dayjs(startTime).add(7, 'd').format('YYYY-MM-DD');
        this.data.baseConfig = {
            name: bootRes.data.name,
            startTime,
            endTime,
            newUserType: bootRes.data.newUserType,
            iosDownloadUrl: bootRes.data.iosDownloadUrl,
            androidDownloadUrl: bootRes.data.androidDownloadUrl,
            customParams,
            loginOpportunity: bootRes.data.loginOpportunity || '',
            shareConfig: {
                canShare: true,
                title: '',
                desc: '',
                img: '',
                ...bootRes.data.shareConfig
            }
        };
        this.checkData();
    }

    /**
     * 更新基础配置
     * @param key
     * @param value
     */
    public changeBaseConfig(key: string, value: any) {
        if (!this.data.baseConfig) {
            return;
        }
        const keys = key.split('.');
        if (keys.length === 0) {
            return;
        }
        const item = keys
            .splice(0, keys.length - 1)
            .reduce((pre: any, cur: string)=> {
                return pre[cur] || {};
            }, this.data.baseConfig);
        item[keys[0]] = value;
    }

    /**
     * 批量更新基础配置
     * @param kvs
     */
    public changeBaseConfigs(kvs: Array<{key: string, value: any}>) {
        if (!this.data.baseConfig) {
            return;
        }
        kvs.forEach(({key, value})=> {
            const keys = key.split('.');
            if (keys.length === 0) {
                return;
            }
            const item = keys
                .splice(0, keys.length - 1)
                .reduce((pre: any, cur: string)=> {
                    return pre[cur] || {};
                }, this.data.baseConfig);
            item[keys[0]] = value;
        });
    }

    /**
     * 保存基础配置
     * @param kvs
     */
    public async saveBaseConfig(kvs?: {[key: string]: any}) {
        // 自动保存全部
        if (!kvs || Object.keys(kvs).length === 0) {
            kvs = {
                name: this.data.baseConfig.name,
                stageConfig: JSON.stringify(stateWorkbench.data.stageConfig),
                shareConfig: JSON.stringify(this.data.baseConfig.shareConfig),
                customParams: JSON.stringify(this.data.baseConfig.customParams),
                startTime: this.data.baseConfig.startTime,
                endTime: this.data.baseConfig.endTime,
                newUserType: this.data.baseConfig?.newUserType
            };
        }
        await stateWorkbench.autoSaveStart(api.vAuthPost('/api/backweb/workbench/base/change', {
            data: {
                list: kvs
            },
            refresh: true
        }));
    }

    public setTabStatus(status) {
        const tab = stateWorkbench.data.stageStatus.editor.find(item=> item.name === EditorTabName.Base);
        if (tab) {
            tab.checkSuccess = status;
        }
    }

    public checkId(): boolean {
        let isNeed: boolean = false;
        const config = this.data.baseConfig.customParams;
        let actValue = ['抽奖', '组队', '红包活动', '好友邀请'].find(item => (config.activityType as any[]).includes(item));
        isNeed = Boolean(actValue && !config.jtpActivityId ? true : config.jtpActivityId.includes('；'));
        return isNeed;
    }

    public checkData() {
        let status = true;
        if (this.data.baseConfig.customParams.activityType.length === 0) {
            status = false;
        }
        if(this.checkId()) {
            status = false;
        }
        this.setTabStatus(status);
        console.log('能否进行下一步', status);
        return status;
    }

    public async check(showDialog: boolean = false) {
        let status = this.checkData();
        if (!showDialog || status) {
            return status;
        } else {
            return new Promise<boolean>(resolve=> {
                Vue.prototype.$confirm('奖品信息填写不完整，离开将不能保存发布。', '提示', {
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

export default Activity;

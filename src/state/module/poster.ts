import Vue from 'vue';
import BaseModule from './base';
import { ActivityConfig, Page, Poster, PosterPluginConfig, BackgrountPositionType, BackgroundSizeType, BackgrountRepeatType } from '@/config';
import { stateUi, stateCommon, stateWorkbench } from '..';
import api from '@/api';
import utils from '@/utils';
import posterPluginList from '@/components/poster/pluginJson';
import qrcode from '@/utils/qrcode.js';

interface PosterScope {
    code: string;
    name: string;
    default?: any;
}

const commonTextScope: PosterScope[] = [
    {
        code: '{用户昵称}',
        name: '用户昵称',
        default: '昵称'
    }
];

const commonImageScope: PosterScope[] = [
    {
        code: '{用户头像}',
        name: '用户头像',
        default: 'https://cdn.via.cool/jtp-host/resource/activity/714/2020-07-09/0d22a24ccef141c889fa6a70e3b52959.png'
    },
    {
        code: '{活动二维码}',
        name: '活动二维码',
        default: ''
    }
];

class PosterModule extends BaseModule<{
    loading: boolean;
    show: boolean;
    list: Poster[];
    tpls: Poster[];
    currentPoster: Poster | null;
    editPoster: Poster | null;
    textScopeList: PosterScope[];                       // 可动态设置的文案
    imgScopeList: PosterScope[];                        // 可动态设置的图片
    activePlugin: PosterPluginConfig<any> | null;       // 当前激活的组件
}> {

    private successCallback?: (id: string)=> Promise<{
        status: boolean;
        associateData?: {
            type: 'plugin' | 'pendant' | 'dialog',  // 被关联的类型
            id: string,                             // 组件id或挂件id或弹窗id
            pageId: string;                         // 页面id
            tag: string;                            // 关联标记
            customData: {[key: string]: any};       // 组件的自定义参数（比如同一组件有不同地方会用到海报，就可以在这里标记）
        }
    }>;

    public constructor() {
        super({
            loading: false,
            show: false,
            list: [],
            tpls: [],
            currentPoster: null,
            editPoster: null,
            textScopeList: [],
            imgScopeList: [],
            activePlugin: null
        });
    }

    public changeText(text: string) {
        this.data.textScopeList.forEach(item=> {
            text = text.replace(new RegExp(item.code, 'g'), item.default);
        });
        return text;
    }

    public changeImage(image: string) {
        this.data.imgScopeList.forEach(item=> {
            image = image.replace(new RegExp(item.code, 'g'), item.default);
        });
        return image;
    }

    private checkQrcode() {
        const qrcodeItem = commonImageScope.find(item=> item.code === '{活动二维码}');
        if (qrcodeItem && !qrcodeItem.default) {
            qrcodeItem.default = qrcode.create(stateWorkbench.data.publishUrl);
        }
    }

    public async show(id?: string, options?: {
        textScopeList?: PosterScope[],
        imgScopeList?: PosterScope[],
        success?: (id: string)=> Promise<{
            status: boolean;
            associateData?: {
                type: 'plugin' | 'pendant' | 'dialog',  // 被关联的类型
                id: string,                             // 组件id或挂件id或弹窗id
                pageId: string;                         // 页面id
                tag: string;                            // 关联标记
                customData: {[key: string]: any};       // 组件的自定义参数（比如同一组件有不同地方会用到海报，就可以在这里标记）
            }
        }>
    }) {
        this.checkQrcode();
        // 没有配置
        if (!stateUi.data.config) {
            return;
        }
        // 获取海报模板
        if (this.data.tpls.length === 0) {
            stateCommon.showLoading();
            const res = await api.vAuthGet('/api/backweb/workbench/workbench/poster', {
                refresh: true
            }).catch(e=> {
                // console.log(e);
            });
            stateCommon.hideLoading();
            if (res && Number(res.code) === 0) {
                this.data.tpls = res.data.list?.map(item=> JSON.parse(item.config));
            } else {
                Vue.prototype.$message.error('海报模板加载失败');
            }
        }
        this.data.list = [...stateUi.data.config.posters];
        // 找到当前id的海报
        let poster = this.data.list.find(item=> item.id === id);
        let isNew = false;
        if (!poster) {
            // 属于新增海报，自动读取第一个模板
            if (this.data.tpls.length === 0) {
                poster = {
                    id: '',
                    zhName: '',
                    name: '',
                    outConfig: {
                        width: '750',
                        height: '1206',
                        border: {
                            color: '',
                            radius: '',
                            open: false,
                            width: ''
                        },
                        background: {
                            color: '#ffffff',
                            image: '',
                            repeat: BackgrountRepeatType.noRepeat,
                            position: BackgrountPositionType.center,
                            size: BackgroundSizeType.auto
                        }
                    },
                    pluginList: []
                };
            } else {
                poster = this.data.tpls[0];
            }
            isNew = true;
        }
        poster.pluginList.forEach(plugin=> {
            const json = posterPluginList.find(item=> item.type === plugin.type);
            if (json) {
                Object.assign(plugin, utils.deepObjectMerge(json, plugin));
            }
        });
        poster = JSON.parse(JSON.stringify(poster)) as Poster;
        poster.zhName = '海报';
        if (isNew) {
            poster.id = utils.uuid();
            this.data.list.push(poster);
        }
        this.data.currentPoster = poster;
        this.data.editPoster = JSON.parse(JSON.stringify(poster)) as Poster;
        this.data.textScopeList = [];
        this.data.imgScopeList = [];
        if (options) {
            this.data.textScopeList = options.textScopeList || [];
            this.data.imgScopeList = options.imgScopeList || [];
        }
        this.data.textScopeList = [...commonTextScope, ...this.data.textScopeList];
        this.data.imgScopeList = [...commonImageScope, ...this.data.imgScopeList];
        this.data.show = true;
        this.successCallback = options?.success;
    }

    /**
     * 替换海报
     * @param poster
     */
    public switchPoster(poster: Poster) {
        Vue.prototype.$confirm('切换后编辑的数据会丢失，确认切换？', {
            cancelButtonText: '取消',
            confirmButtonText: '确定'
        }).then(()=> {
            if (!this.data.currentPoster) {
                return;
            }
            poster = JSON.parse(JSON.stringify(poster)) as Poster;
            poster.name = this.data.currentPoster.name;
            poster.zhName = this.data.currentPoster.zhName;
            this.data.editPoster = JSON.parse(JSON.stringify(poster)) as Poster;
        }).catch(e=> {});
    }

    public addPlugin(plugin: PosterPluginConfig) {
        if (!this.data.editPoster) {
            return;
        }
        plugin = JSON.parse(JSON.stringify(plugin)) as PosterPluginConfig;
        plugin.id = utils.uuid();
        plugin.hidden = false;
        plugin.commConfig.top = '100';
        plugin.commConfig.left = '100';
        this.data.editPoster.pluginList.push(plugin);
        this.data.activePlugin = plugin;
    }

    public deletePlugin(plugin) {
        if (!this.data.editPoster) {
            return;
        }
        const index = this.data.editPoster.pluginList.findIndex(p=> p.id === plugin.id);
        if (index > -1) {
            this.data.editPoster.pluginList.splice(index, 1);
            this.data.activePlugin = null;
        }
    }

    public async save() {
        if (!this.data.currentPoster || !this.successCallback) {
            return;
        }
        if (!stateUi.data.config) {
            return;
        }
        const res = await this.successCallback(this.data.currentPoster.id);
        if (!res.status) {
            return;
        }
        const poster = JSON.parse(JSON.stringify(this.data.editPoster)) as Poster;
        poster.id = this.data.currentPoster.id;
        const cachePoster = stateUi.data.config.posters.find(item=> item.id === poster.id);
        if (!cachePoster) {
            stateUi.data.config.posters.push(poster);
        } else {
            Object.assign(cachePoster, poster);
        }
        // 需要做关联
        if (res.associateData) {
            if (!stateUi.data.config.posterAssociate) {
                stateUi.data.config.posterAssociate = [];
            }
            let associateItem = stateUi.data.config.posterAssociate.find(item=> item.posterId === poster.id);
            if (!associateItem) {
                associateItem = {
                    posterId: poster.id,
                    dataList: []
                };
                stateUi.data.config.posterAssociate.push(associateItem);
            }
            let dataItem = associateItem.dataList.find(item=> {
                return item.id === res.associateData?.id &&
                    item.pageId === res.associateData?.pageId &&
                    item.type === res.associateData?.type &&
                    item.tag === res.associateData.tag;
            });
            if (!dataItem) {
                associateItem.dataList.push({
                    ...res.associateData
                });
            } else {
                // 一次做关联就行了
            }
        }
        if (await stateUi.save()) {
            this.data.show = false;
        }
        this.successCallback = undefined;
    }

    public cancel() {
        Vue.prototype.$confirm('取消后编辑的数据会丢失，确认取消？', {
            cancelButtonText: '取消',
            confirmButtonText: '确定'
        }).then(()=> {
            this.data.show = false;
            this.successCallback = undefined;
        }).catch(e=> {});
    }
}

export default PosterModule;

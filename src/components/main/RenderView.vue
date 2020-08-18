<script lang='tsx'>
import { Component, Vue, Watch, Prop } from 'vue-property-decorator';
import { CreateElement } from 'vue';
import { Page } from '@/config';
import { VIFRAME_KEY } from '@/VIFRAME';
import { stateCommon, stateUi, stateWorkbench, stateActivity, stateRaffle} from '@/state/index';
import api from '@/api/index';
import { EditorTabName } from '../../state/module/workbench';
import qrcode from '@/utils/qrcode.js';
import Clipboard from 'clipboard';
import utils from '../../utils';
import PreviewPoster from '../poster/PreviewPoster.vue';
import EventBusKey from '../../utils/EventBusKey';
import eventBus from '@/utils/eventBus';

interface Style {
    top: number;
    left: number;
    width: number;
    height: number;
}

interface Phone {
    bg: string;
    name: string;
    borderWidth: number;
    borderHeight: number;
    contentWidth: number;
    contentHeight: number;
    contentTop: number;
    contentLeft: number;
    topBarWidth: number;
    topBarHeight: number;
    topBarTop: number;
    topBarLeft: number;
}

const PhoneList: {
    iphone6: Phone,
    iphoneX: Phone,
    android: Phone,
} = {
    iphone6: {
        bg: require(`@/assets/iphone6.png`),
        name: 'iphone6',
        borderWidth: 855,
        borderHeight: 1772,
        contentWidth: 750,
        contentHeight: 1206,
        contentTop: 347,
        contentLeft: 53,
        topBarWidth: 750,
        topBarHeight: 128,
        topBarTop: 219,
        topBarLeft: 53
    },
    iphoneX: {
        bg: require(`@/assets/iphonex.png`),
        name: 'iphoneX',
        borderWidth: 1427,
        borderHeight: 2854,
        contentWidth: 1241,
        contentHeight: 2429,
        contentTop: 342,
        contentLeft: 93,
        topBarWidth: 1241,
        topBarHeight: 260,
        topBarTop: 84,
        topBarLeft: 93
    },
    android: {
        bg: require(`@/assets/android.png`),
        name: 'android',
        borderWidth: 1174,
        borderHeight: 2392,
        contentWidth: 1080,
        contentHeight: 1736,
        contentTop: 415,
        contentLeft: 46,
        topBarWidth: 1080,
        topBarHeight: 184,
        topBarTop: 231,
        topBarLeft: 46
    }
};

const getTime = ()=> {
    const date = new Date();
    return `${date.getHours()}`.padStart(2, '0') + ':' + `${date.getMinutes()}`.padStart(2, '0');
};

let timeId: number = -1;

@Component
export default class RenderView extends Vue {

    private borderStyle: Style = {
        top: 0,
        left: 0,
        width: 0,
        height: 0,
    };

    private appStyle: Style = {
        top: 0,
        left: 0,
        width: 0,
        height: 0,
    };

    private appTitleStyle: Style = {
        top: 0,
        left: 0,
        width: 0,
        height: 0,
    };

    private phoneNames = ['iphone6', 'iphoneX', 'android'];
    private phone: Phone = PhoneList.iphone6;

    private currentTime: string = getTime();

    private iframeUrl: string = '';

    private iframeHadInit: boolean = false;

    private shareWrapFontSize: number = 100;

    private get baseConfig() {
        return stateActivity.data.baseConfig;
    }

    public created() {
        api.get('/workbench/iframe')
            .then(res=> {
                this.iframeUrl = res;
                this.resetIframeUrl(stateWorkbench.data.debug);
            }).catch(err=> {
                if (process.env.VUE_APP_PREVIEW_IFRAME) {
                    this.iframeUrl = process.env.VUE_APP_PREVIEW_IFRAME;
                    this.resetIframeUrl(stateWorkbench.data.debug);
                }
            });
        eventBus.on(EventBusKey.SETTING_DEBUG, (enable)=> {
            this.resetIframeUrl(enable);
        });
        // 监听iframe加载完成事件
        this.VIFRAME.on(VIFRAME_KEY.LIFE_CYCLE, ()=> {
            const renderIframe = this.$refs.renderIframe as HTMLIFrameElement;
            this.VIFRAME.init(renderIframe.contentWindow);
            // 初次设置iframe，需要主动触发页面改变，达到通知iframe的功能
            // 向iframe发送页面变化消息
            this.VIFRAME.send(VIFRAME_KEY.CHANGE_CONFIG, stateUi.data.config);
            this.VIFRAME.send(VIFRAME_KEY.CHANGE_PAGE, stateUi.data.currentPage);
            if (stateUi.data.currentPlugin) {
                this.$nextTick(()=> {
                    Vue.prototype.VIFRAME.send(VIFRAME_KEY.ACTIVE_PLUGIN, {id: stateUi.data.currentPlugin?.id, type: stateUi.data.currentPluginType});
                });
            }
            if (stateUi.data.currentDialog) {
                const currentDialog = stateUi.data.currentDialog;
                this.$nextTick(()=> {
                    Vue.prototype.VIFRAME.send(VIFRAME_KEY.SHOW_DIALOG, {name: currentDialog.dialogName, data: currentDialog.config});
                });
            }
            const editorArr = stateWorkbench.data.workbench!.workbenchConfig.editor;
            const isRaffle = editorArr.map(v => v.name);
            if(isRaffle.includes(EditorTabName.Raffle)) {
                this.$nextTick(()=> {
                    stateRaffle.loadRaffleConfig();
                });
            }
            this.iframeHadInit = true;
        }).on(VIFRAME_KEY.CHANGE_PAGE, (data: string)=> {
            // iframe里面也可能会触发页面跳转，所以这里收到iframe的跳转消息后做页面跳转
            stateUi.switchPage(data);
        });
        timeId = setInterval(()=> {
            this.currentTime = getTime();
        }, 1000);
        // 有些操作会改变预览区的大小，可以发送事件来通知调整手机大小和位置
        this.$bus.on(EventBusKey.RESET_RENDERVIEW, ()=> {
            setTimeout(this.changeRenderBorder, 0);
        });
    }

    private resetIframeUrl(debug: boolean = false) {
        if (this.iframeUrl && stateWorkbench.data.workbench?.urlKey) {
            this.iframeHadInit = false;
            stateWorkbench.data.startRenderPreview = false;
            this.$nextTick(()=> stateWorkbench.data.startRenderPreview = true);
        }
    }

    public destroyed() {
        clearInterval(timeId);
    }

    private get previewCurrentShare() {
        return stateWorkbench.data.currentShare;
    }

    public mounted() {
        // 根据窗口大小，调整中间预览区域的大小
        this.changeRenderBorder();
        window.addEventListener('resize', utils.throttle(this.changeRenderBorder, 200));
    }

    private getWidth() {
        const workbenchWidthData = stateWorkbench.data.width;
        return window.innerWidth - workbenchWidthData.pageList - workbenchWidthData.pluginList - workbenchWidthData.editor;
    }

    public render(h: CreateElement) {
        let params = `?mode=test&id=${stateCommon.urlQuery.id}&urlKey=${stateWorkbench.data.workbench?.urlKey}`;
        if (stateWorkbench.data.debug) {
            params += '&debug=true';
        }
        const previewUrl = `${this.iframeUrl}${params}`;
        return (
            <div class='render-view' ref='renderView'>
                <div class='render-border' style={{
                    marginTop: this.borderStyle.top + 'px',
                    marginLeft: this.borderStyle.left + 'px',
                    width: this.borderStyle.width + 'px',
                    height: this.borderStyle.height + 'px',
                }}>
                    <div class='app-content' style={{
                        top: this.appStyle.top + 'px',
                        left: this.appStyle.left + 'px',
                        width: this.appStyle.width + 'px',
                        height: this.appStyle.height + 'px',
                    }}
                    v-loading={!this.iframeHadInit}>
                        {
                            stateWorkbench.data.startRenderPreview && <iframe
                                name='renderIframe'
                                ref='renderIframe'
                                class='render-iframe'
                                src={previewUrl}>
                            </iframe>
                        }
                        <transition name='fade'>
                            {
                                this.previewCurrentShare === 'weixin' && <div ref='weixinShareWrap' class='weixin-share-wrap' style={{
                                    fontSize: this.shareWrapFontSize + 'px'
                                }}>
                                    <div class='box'>
                                        <div class='share-wrap'>
                                            <div class='share-title'>{stateActivity.data.baseConfig?.shareConfig.title || '分享标题'}</div>
                                            <div class='share-desc'>
                                                <div class='desc-text'>{stateActivity.data.baseConfig?.shareConfig.desc || '分享描述'}</div>
                                                <img class='desc-img' src={stateActivity.data.baseConfig?.shareConfig.img}/>
                                            </div>
                                            <div class='tip'>客户端</div>
                                        </div>
                                        <img class='avatar' src='https://cdn.via.cool/jtp-host/resource/activity/714/2020-07-06/cb0bbf7a9bc44326b8c1a964dad8b9c8'></img>
                                    </div>
                                    <div class='box left'>
                                        <img class='avatar' src='https://cdn.via.cool/jtp-host/resource/activity/714/2020-07-06/cb0bbf7a9bc44326b8c1a964dad8b9c8'></img>
                                        <div class='share-wrap'>
                                            <div class='share-title'>{stateActivity.data.baseConfig?.shareConfig.title || '分享标题'}</div>
                                            <div class='share-desc'>
                                                <div class='desc-text'>{stateActivity.data.baseConfig?.shareConfig.desc || '分享描述'}</div>
                                                <img class='desc-img' src={stateActivity.data.baseConfig?.shareConfig.img}/>
                                            </div>
                                            <div class='tip'>客户端</div>
                                        </div>
                                    </div>
                                </div>
                            }
                        </transition>
                        <transition name='fade'>
                        {
                            stateWorkbench.data.currentPoster &&
                            <div style='position: absolute;top: 0;left: 0;width:100%;height:100%;'>
                                <PreviewPoster
                                    props={{
                                        editPoster: stateWorkbench.data.currentPoster,
                                        backgroundColor: 'white'
                                    }}
                                    {
                                        ...{
                                            ref: 'peviewPoster'
                                        }
                                    } />
                            </div>
                        }
                        </transition>
                    </div>
                    <div class='app-top' style={{
                        top: this.appTitleStyle.top + 'px',
                        left: this.appTitleStyle.left + 'px',
                        width: this.appTitleStyle.width + 'px',
                        height: this.appTitleStyle.height + 'px',
                    }}>
                        <div class='status-bar'>
                            <div class='left'>{this.currentTime}</div>
                            <div class='right'>
                                <i class='icon iconfont icon-wifi'></i>
                                <i class='icon iconfont icon-battery'></i>
                            </div>
                        </div>
                        <div class='app-bar'>
                            <div class='title'>
                            {
                                stateUi.data.currentPage?.config.title || stateUi.data.currentPage?.zhName
                            }
                            </div>
                            <i class='el-icon-more icon'></i>
                        </div>
                    </div>
                    <img class='iphone' src={this.phone.bg} />
                    <div class='icon-list'>
                        <div class='icon' onClick={()=> {
                            this.iframeHadInit = false;
                            stateWorkbench.data.startRenderPreview = false;
                            this.$nextTick(()=> stateWorkbench.data.startRenderPreview = true);
                        }}>
                            <i class='el-icon-refresh' style='font-size: 16px;'></i>
                        </div>
                        <el-dropdown placement='bottom'>
                            <div class='icon'>
                                <i class='iconfont icon-phone'></i>
                            </div>
                            <el-dropdown-menu slot='dropdown'>
                                {
                                    this.phoneNames.map(phone=> {
                                        let style = {};
                                        if (this.phone.name === phone) {
                                            style = {
                                                backgroundColor: '#ecf5ff',
                                                color: '#66b1ff'
                                            };
                                        }
                                        return <el-dropdown-item style={style} nativeOnClick={()=> {this.changePhoneSize(phone);}}>
                                            {phone}
                                        </el-dropdown-item>;
                                    })
                                }
                            </el-dropdown-menu>
                        </el-dropdown>
                        <el-dropdown class='item' placement='bottom'>
                            <div class='icon'>
                                <i class='iconfont icon-eye'></i>
                            </div>
                            <el-dropdown-menu slot='dropdown'>
                                <div class='copy-qrcode-url'>
                                    <img class='img' src={qrcode.create(previewUrl)} />
                                    <el-button class='item' size='mini' plain type='primary'
                                        onClick={()=> utils.copyText(previewUrl)}>
                                        复制链接
                                    </el-button>
                                </div>
                            </el-dropdown-menu>
                        </el-dropdown>
                    </div>
                </div>
            </div>
        );
    }

    private changeRenderBorder() {
        // const renderView = this.$refs.renderView as Element;
        // if (!renderView) {
        //     return;
        // }
        // const width = renderView.clientWidth - padding;
        // const height = renderView.clientHeight - padding;

        const renderWidth = this.getWidth();
        const padding = renderWidth * 0.25;
        const width = renderWidth - padding;
        const height = window.innerHeight - 60 - padding;


        const scale = Math.min(width / this.phone.borderWidth, height / this.phone.borderHeight);
        this.borderStyle.width = this.phone.borderWidth * scale;
        this.borderStyle.height = this.phone.borderHeight * scale;
        this.borderStyle.left = (width - this.borderStyle.width) / 2 + padding / 2;
        this.borderStyle.top = (height - this.borderStyle.height) / 2 + padding / 2;

        this.appStyle.width = this.phone.contentWidth * scale;
        this.appStyle.height = this.phone.contentHeight * scale;
        this.appStyle.left = this.phone.contentLeft * scale;
        this.appStyle.top = this.phone.contentTop * scale;

        this.appTitleStyle.width = this.phone.topBarWidth * scale;
        this.appTitleStyle.height = this.phone.topBarHeight * scale;
        this.appTitleStyle.left = this.phone.topBarLeft * scale;
        this.appTitleStyle.top = this.phone.topBarTop * scale - 1;

        this.shareWrapFontSize = this.appStyle.width / 282 * 100;

        setTimeout(() => {
            (this.$refs.peviewPoster as PreviewPoster)?.changeScale();
        }, 300);
    }

    private changePhoneSize(phone: string) {
        this.phone = PhoneList[phone];
        this.changeRenderBorder();
    }
}
</script>

<style lang="less">
.render-view {
    position: relative;
    height: 100%;
    // width: 600px;
    flex: 1;
    // min-width: 400px;
    min-height: 600px;
    background-color: #f0f2f5;
    z-index: 0;
    > .render-border {
        position: relative;
        transition: width .2s linear,height .2s linear,margin-left .15s linear,margin-top .15s linear;
        > .iphone {
            width: 100%;
            height: 100%;
            position: absolute;
            top: 0;
            left: 0;
            pointer-events: none;
            transition: width .2s linear,height .2s linear,margin-left .15s linear,margin-top .15s linear;
        }
        > .app-content {
            position: absolute;
            transition: width .2s linear,height .2s linear,margin-left .15s linear,margin-top .15s linear;
            > .render-iframe {
                position: relative;
                border: 0;
                width: 100%;
                height: 100%;
            }
            > .weixin-share-wrap {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                padding: 10px;
                box-sizing: border-box;
                background-color: #f3f3f3;
                font-size: 100px;
                > .box {
                    position: relative;
                    display: flex;
                    flex-direction: row;
                    justify-content: flex-end;
                    &.left {
                        justify-content: flex-start;
                        > .share-wrap {
                            transform-origin: top left;
                            margin-left: 0.1em;
                            margin-right: 0;
                            &::after {
                                display: none;
                            }
                            &::before {
                                position: absolute;
                                content: ' ';
                                width: 0;
                                height: 0;
                                border-right: 0.1em solid #ffffff;
                                border-left: 0.1em solid transparent;
                                border-bottom: 0.1em solid transparent;
                                border-top: 0.1em solid transparent;
                                top: 0.1em;
                                left: -0.2em;
                            }
                        }
                    }
                    > .avatar {
                        width: 0.4em;
                        height: 0.4em;
                        border-radius: 0.05em;
                    }
                    > .share-wrap {
                        position: relative;
                        border-radius: 0.05em;
                        margin-right: 0.1em;
                        width: 2em;
                        // align-self: flex-start;
                        background-color: #ffffff;
                        text-align: left;
                        padding: 0.1em;
                        box-sizing: border-box;
                        font-size: 1em;
                        transform: scale(0.85);
                        transform-origin: top right;
                        &::after {
                            position: absolute;
                            content: ' ';
                            width: 0;
                            height: 0;
                            border-left: 0.1em solid #ffffff;
                            border-right: 0.1em solid transparent;
                            border-bottom: 0.1em solid transparent;
                            border-top: 0.1em solid transparent;
                            top: 0.1em;
                            right: -0.2em;
                        }
                        > .share-title {
                            overflow: hidden;
                            text-overflow: ellipsis;
                            display: -webkit-box;
                            -webkit-box-orient: vertical;
                            -webkit-line-clamp: 2;
                            font-size: 0.15em;
                        }
                        > .share-desc {
                            display: flex;
                            font-size: 0.12em;
                            padding-bottom: 0.1em;
                            box-sizing: border-box;
                            border-bottom: 0.12em solid #eeeeee;
                            > .desc-text {
                                overflow: hidden;
                                text-overflow: ellipsis;
                                display: -webkit-box;
                                -webkit-box-orient: vertical;
                                -webkit-line-clamp: 3;
                                flex: 1;
                            }
                            > .desc-img {
                                width: 5em;
                                height: 5em;
                            }
                        }
                        > .tip {
                            font-size: 0.12em;
                        }
                    }
                }
            }
        }
        > .app-top {
            position: absolute;
            border-bottom: 1px solid #eeeeee;
            margin-bottom: 1px;
            font-size: 14px;
            transition: width .2s linear,height .2s linear,margin-left .15s linear,margin-top .15s linear;
            > .status-bar {
                width: 100%;
                height: 40%;
                display: flex;
                box-sizing: border-box;
                justify-content: space-between;
                padding: 0 6%;
                align-items: center;
                font-weight: bold;
                line-height: 1;
                > .right {
                    >.icon+.icon {
                        margin-left: 0.5vw;
                    }
                }
            }
            > .app-bar {
                width: 100%;
                height: 60%;
                display: flex;
                justify-content: space-between;
                align-items: center;
                box-sizing: border-box;
                padding: 0 5%;
                > .title {
                    flex: 1;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    text-align: center;
                }
                > .icon {
                    font-size: 16px;
                }
            }
        }
        >.icon-list {
            position: absolute;
            right: 20px;
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
                font-size: 24px;
                border-radius: 30px;
                box-shadow: 0px 0px 10px 5px #eeeeee;
                margin-left: 10px;
                background-color: white;
            }
        }
    }
}
</style>
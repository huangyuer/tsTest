<script lang='tsx'>
import { Component, Vue, Watch, Prop, Ref } from 'vue-property-decorator';
import { CreateElement } from 'vue';
import { Page, Plugin, Pendant, PosterPluginConfig, Poster, BackgroundSizeType } from '@/config';
import { VIFRAME_KEY } from '@/VIFRAME';
import { stateCommon, stateUi, statePoster, stateWorkbench } from '@/state/index';
import { PluginType } from '@/state/module/activity';
import qrcode from '@/utils/qrcode.js';
import utils from '@/utils/index';
import Drawer from '../../utils/drawer';
import api from '../../api';
import pluginList from './pluginJson';

let html2canvasStr: string = '';

const touchEvent = {
    move: (ev: any)=> {},
    end: (ev: any)=> {},
};

const transformTextAlign = {
    left: 'flex-start',
    center: 'center',
    right: 'flex-end'
};

@Component
export default class PreviewPoster extends Vue {

    @Prop({default: false})
    private editable!: boolean;

    @Prop({default: '#eaecf1'})
    private backgroundColor!: string;

    @Prop({default: null})
    private editPoster!: Poster;

    @Prop({default: 1})
    private contentScale!: number;

    private previewScale: number = 1;

    private previewTransform: string =  '';
    private previewOrigin: string = 'center';

    private isDragableCanvas: boolean = false;

    private touchRecord: {
        touching: boolean,          // 是否有触摸
        sx: number,                 // 按下的x值
        sy: number,                 // 按下的y值
    } = {
        touching: false,
        sx: 0,
        sy: 0
    };

    private get activityQrcode() {
        return qrcode.create(stateWorkbench.data.publishUrl);
    }

    private mounted() {
        this.$nextTick(()=> {
            this.changeScale();
        });
    }

    @Ref('previewOutBox')
    private previewOutBox!: HTMLElement;

    @Ref('previewPoster')
    private previewPosterRef!: HTMLElement;

    @Watch('editPoster.outConfig.width')
    private posterChangeWidth() {
        this.$nextTick(()=> {
            this.changeScale();
        });
    }

    @Watch('editPoster.outConfig.height')
    private posterChangeHeight() {
        this.$nextTick(()=> {
            this.changeScale();
        });
    }

    public changeScale() {
        if (!this.editPoster || this.isDragableCanvas) {
            return;
        }
        const wScale = this.previewOutBox.offsetWidth * this.contentScale / Number(this.editPoster.outConfig.width);
        const hScale = this.previewOutBox.offsetHeight * this.contentScale / Number(this.editPoster.outConfig.height);
        this.previewScale = Math.min(wScale, hScale);
        this.previewTransform =  `translate(-50%, -50%) scale(${this.previewScale})`;
    }

    public render(h: CreateElement) {
        return <div class='preview-out-box' ref='previewOutBox' style={{
            backgroundColor: this.backgroundColor
        }}>
            {
                this.editable && <div class='back-box'>
                    <div class='icon-list'>
                        {

                            // <div class='icon' onClick={()=> {
                            //     this.previewScale = 0.5;
                            //     this.previewOrigin = 'top left';
                            //     this.previewTransform =  `translate(0, 0) scale(${this.previewScale})`;
                            //     this.isDragableCanvas = true;
                            // }}>
                            //     <el-tooltip content='放大画布' placement='bottom'>
                            //         <i class='iconfont icon-full-screen' style='font-size: 14px;'></i>
                            //     </el-tooltip>
                            // </div>
                        }
                        <el-dropdown placement='bottom'>
                            <div class='icon'>
                                <i class='el-icon-plus' style='font-size: 16px;'></i>
                            </div>
                            <el-dropdown-menu slot='dropdown'>
                                {
                                    pluginList.map(plugin=> {
                                        return <el-dropdown-item nativeOnClick={()=> {
                                            statePoster.addPlugin(plugin);
                                        }}>
                                            {plugin.name}
                                        </el-dropdown-item>;
                                    })
                                }
                            </el-dropdown-menu>
                        </el-dropdown>
                        {
                            // <div class='icon' onClick={()=> {
                            // }}>
                            //     <i class='el-icon-refresh' style='font-size: 16px;'></i>
                            // </div>
                        }
                        <div class='icon' onClick={this.downloadPoster}>
                            <el-tooltip content='下载海报' placement='bottom'>
                                <i class='el-icon-download' style='font-size: 16px;'></i>
                            </el-tooltip>
                        </div>
                    </div>
                </div>
            }
            {
                this.previewPoster()
            }
        </div>;
    }

    private previewPoster() {
        const posterView = this.getPosterCanvas();

        if (this.isDragableCanvas) {
            return <div class='dragable-poster-view'>
                {
                    posterView
                }
            </div>;
        }
        return posterView;
    }

    private genTextMinHeight(fontSize: string, lineHeight: string) {
        if (lineHeight.indexOf('b') >= 0) {
            return Number(fontSize) * Number(lineHeight.replace('b', '')) + 'px';
        }
        return Number(fontSize) * Number(lineHeight) + 'px';
    }

    private getPosterCanvas() {
        if (!this.editPoster) {
            return;
        }
        const outConfig = this.editPoster.outConfig;
        const style: {[key: string]: any} = {
            width: outConfig.width + 'px',
            height: outConfig.height + 'px',
            backgroundColor: outConfig.background.color,
            backgroundRepeat: outConfig.background.repeat,
            backgroundPosition: outConfig.background.position
        };
        if (outConfig.background.image) {
            style.backgroundImage = `url(${outConfig.background.image})`;
        }
        if (outConfig.background.size === BackgroundSizeType.fill) {
            style.backgroundSize = '100% 100%';
        } else if (outConfig.background.size !== BackgroundSizeType.auto) {
            style.backgroundSize = outConfig.background.size;
        }
        if (outConfig.border.open) {
            style.borderRadius = outConfig.border.radius;
            style.borderWidth = outConfig.border.width + 'px';
            style.borderColor = outConfig.border.color;
            style.borderStyle = 'solid';
        }
        return <div class='preview-wrap'
            ref='previewPoster'
            style={{
                width: style.width,
                height: style.height,
                transform: this.previewTransform,
                transformOrigin: this.previewOrigin
            }}>
            <div class='preview-poster'
                style={{
                    ...style,
                    position: 'relative',
                    lineHeight: 1,
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                    color: '#000000'
                }}
                id='preview-poster'
                data-type='previewPoster'
                onMousedown={(e: MouseEvent)=> {
                    if (!this.editable) {
                        return;
                    }
                    const type = (e.target as HTMLElement).getAttribute('data-type');
                    if (type === 'previewPoster') {
                        statePoster.data.activePlugin = null;
                    }
                }}>
                {
                    this.editPoster.pluginList.filter(plugin=> !plugin.hidden).map(plugin=> {
                        const boxStyle: {[key: string]: any} = {
                            left: plugin.commConfig.left + 'px',
                            top: plugin.commConfig.top + 'px',
                            width: utils.strAddUnit(plugin.commConfig.width),
                            height: utils.strAddUnit(plugin.commConfig.height),
                        };
                        const contentStyle: {[key: string]: any} = {
                            width: boxStyle.width,
                            height: boxStyle.height,
                            opacity: plugin.commConfig.opacity
                        };
                        if (plugin.commConfig.border.open) {
                            contentStyle.borderRadius = utils.strAddUnit(plugin.commConfig.border.radius);
                        }
                        let view: JSX.Element | null = null;
                        switch(plugin.type) {
                            case 'simpleShape':
                                view = <div style={{
                                    width: boxStyle.width,
                                    height: boxStyle.height,
                                    backgroundColor: plugin.config.backgroundColor
                                }}></div>;
                                break;
                            case 'image':
                                let url = statePoster.changeImage(plugin.config.url);
                                view = <img style={{
                                    width: boxStyle.width,
                                    height: boxStyle.height
                                }} src={url} />;
                                break;
                            case 'text':
                                let text = statePoster.changeText(plugin.config.text);
                                delete boxStyle.height;
                                delete contentStyle.height;
                                view = <div
                                    style={{
                                        width: boxStyle.width,
                                        height: boxStyle.height,
                                        minHeight: this.genTextMinHeight(plugin.config.fontSize, plugin.config.lineHeight),
                                        // textAlign: plugin.config.textAlign,
                                        fontSize: plugin.config.fontSize + 'px',
                                        color: plugin.config.color,
                                        lineHeight: utils.strAddUnit(plugin.config.lineHeight).replace('b', ''),
                                        fontWeight: plugin.config.fontWeight,
                                        letterSpacing: plugin.config.letterSpacing + 'px',
                                        fontStyle: plugin.config.fontStyle,
                                        textDecoration: plugin.config.textDecoration.join(' '),
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        justifyContent: transformTextAlign[plugin.config.textAlign]
                                    }}
                                    >
                                    {
                                        // 拆分单个字符，配合flex换行，解决自动换行对一些字符无效的问题
                                        text.split('').map(c=> <span>{c}</span>)
                                    }
                                    </div>;
                                break;
                            case 'textarea':
                                let html = statePoster.changeText(plugin.config.text);
                                delete boxStyle.height;
                                delete contentStyle.height;
                                view = <div style={{
                                    width: boxStyle.width,
                                    height: boxStyle.height
                                }} domPropsInnerHTML={html}></div>;
                                break;
                        }
                        if (this.touchRecord.touching && statePoster.data.activePlugin?.id === plugin.id) {
                            boxStyle.opacity = 0.5;
                        } else {
                            boxStyle.opacity = 1;
                        }
                        return <div
                            class='box'
                            style={{...boxStyle, position: 'absolute'}}
                            onMousedown={(e: MouseEvent)=> {
                                if (!this.editable) {
                                    return;
                                }
                                statePoster.data.activePlugin = plugin;
                                touchEvent.move = this.pluginTouchmove.bind(this);
                                touchEvent.end = this.pluginTouchend.bind(this);
                                this.touchRecord.touching = true;
                                this.touchRecord.sx = e.pageX;
                                this.touchRecord.sy = e.pageY;
                                document.addEventListener('mousemove', touchEvent.move, false);
                                document.addEventListener('mouseup', touchEvent.end, false);
                            }}>
                            <div class='content' style={{...contentStyle, position: 'relative', overflow: 'hidden'}}>{view}</div>
                            {
                                statePoster.data.activePlugin?.id === plugin.id && <div class='box-line'>
                                {
                                    // <div class='icon-delete' onClick={()=> {
                                    //     statePoster.deletePlugin(plugin);
                                    // }}>
                                    //     <i class='el-icon-close'></i>
                                    // </div>
                                }
                                </div>
                            }
                        </div>;
                    })
                }
            </div>
        </div>;
    }

    private pluginTouchmove(ev: MouseEvent) {
        if (!statePoster.data.activePlugin) {
            return;
        }
        if (!this.touchRecord.touching) {
            return;
        }
        ev.stopPropagation();
        ev.preventDefault();
        const cx = ev.pageX;
        const cy = ev.pageY;
        const left = Number(statePoster.data.activePlugin.commConfig.left);
        const top = Number(statePoster.data.activePlugin.commConfig.top);
        statePoster.data.activePlugin.commConfig.left = (left + (cx - this.touchRecord.sx) / this.previewScale).toFixed(2);
        statePoster.data.activePlugin.commConfig.top = (top + (cy - this.touchRecord.sy) / this.previewScale).toFixed(2);
        this.touchRecord.sx = cx;
        this.touchRecord.sy = cy;
    }

    private pluginTouchend(ev: MouseEvent) {
        if (!this.touchRecord.touching) {
            document.removeEventListener('mousemove', touchEvent.move, false);
            document.removeEventListener('mouseup', touchEvent.end, false);
            return;
        }
        this.touchRecord.touching = false;
        document.removeEventListener('mousemove', touchEvent.move, false);
        document.removeEventListener('mouseup', touchEvent.end, false);
    }

    private async downloadPoster() {
        if (!this.editPoster) {
            this.$message.error('生成失败');
            return;
        }
        statePoster.data.loading = true;
        if (!html2canvasStr) {
            try {
                html2canvasStr = await api.get(process.env.VUE_APP_CDN_URL + '/static/html2canvas.min.custom.js');
            } catch(e) {
                statePoster.data.loading = false;
                this.$message.error('生成失败');
            }
        }
        if (!html2canvasStr) {
            return;
        }
        const iframe = document.createElement('iframe');
        iframe.width = this.editPoster.outConfig.width;
        iframe.height = this.editPoster.outConfig.height;
        iframe.style.border = 'none';
        iframe.style.position = 'fixed';
        // iframe.style.top = '50%';
        // iframe.style.left = '100%';
        // iframe.style.transform = 'translate(-100%, -50%) scale(0.5)';
        // iframe.style.zIndex = '9999999';
        iframe.style.top = '500vh';
        iframe.style.zIndex = '-1';
        iframe.onload = ()=> {
            const doc = iframe.contentWindow?.document;
            if (!doc) {
                statePoster.data.loading = false;
                this.$message.error('生成失败');
                return;
            }
            doc.open();
            doc.write(`
            <html>
                <head>
                    <style>
                        * {
                            margin: 0;
                            padding: 0;
                        }
                    <\/style>
                    <script>
                    ${html2canvasStr}
                    <\/script>
                <\/head>
                <body>
                ${(this.$refs.previewPoster as HTMLElement).innerHTML}
                <\/body>
                <script>
                window.html2canvas(document.getElementById('preview-poster'), {
                    backgroundColor: null,
                    logging: false,
                    proxy: '${api.host}/api/backweb/util/proxy'
                }).then(canvas=> {
                    let base64 = canvas.toDataURL('image/png');
                    window.parent.postMessage({from: 'POSTERIFRAME', data: base64}, '*');
                });
                <\/script>
            <\/html>
            `);
        };
        function download(ev: MessageEvent) {
            if (!ev.data) {
                return;
            }
            if (ev.data.from !== 'POSTERIFRAME') {
                return;
            }
            let a = document.createElement('a');
            let event = new MouseEvent('click');
            a.download = `${stateUi.data.currentPlugin?.zhName}海报`;
            a.href = ev.data.data;
            // 触发a的单击事件
            a.dispatchEvent(event);
            document.body.removeChild(iframe);
            window.removeEventListener('message', download);
            statePoster.data.loading = false;
        }
        window.addEventListener('message', download);
        document.body.appendChild(iframe);
    }
}

</script>

<style lang="less">
.preview-out-box {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    > .preview-wrap {
        position: absolute;
        top: 50%;
        left: 50%;
        transform-origin: center;
        box-shadow: 0px 0px 10px 5px #dddddd;
        > .preview-poster {
            position: relative;
            background-repeat: no-repeat;
            line-height: 1;
            box-sizing: border-box;
            overflow: hidden;
            color: #000000;
            > .box {
                position: absolute;
                > .content {
                    position: relative;
                    overflow: hidden;
                }
                > .box-line  {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    outline: 1px dashed #000000;
                    top: 0;
                    > .icon-delete {
                        position: absolute;
                        top: -15px;
                        right: -15px;
                        width: 30px;
                        height: 30px;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        background-color: white;
                        font-size: 24px;
                        border-radius: 30px;
                    }
                }
            }
        }
    }
    > .back-box {
        position: absolute;
        width: 100%;
        height: 30px;
        background-color: white;
        top: 0;
        left: 0;
        // top: 50%;
        // left: 50%;
        // transform-origin: center;
        // transform: translate3d(-50%, -50%, 0);
        > .icon-list {
            position: absolute;
            right: 0;
            // right: 10px;
            // top: -10px;
            // transform: translate3d(0, -100%, 0);
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
                // border-radius: 30px;
                // box-shadow: 0px 0px 10px 5px #dddddd;
                margin-right: 10px;
                &:hover {
                    color: white;
                    background-color: #404650;
                }
            }
        }
    }
}
.dragable-poster-view {
    position: fixed;
    z-index: 9999999999;
    border: 1px solid #666666;
    top: 30px;
    left: 0;
    width: 500px;
    height: calc(100vh - 2px -  30px);
    overflow: scroll;
    background-color: #eaecf1;
    // > .line {
    //     &.right {

    //     }
    // }
}
</style>
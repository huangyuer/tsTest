<script lang='tsx'>
import { Component, Vue, Watch, Prop } from 'vue-property-decorator';
import { CreateElement } from 'vue';
import BaseLabelComp, { BaseConfig, BaseLabelCompInterface, LockInit, RenderReturnType } from './base/baseLabelComp.vue';
import api from '@/api/index';

interface Config extends BaseConfig {
}

const defaultConfig: Config = {
    disabled: false,
    required: false,
    labelAlign: 'start',
    labelWidth: 'auto',
    label: '',
    width: '',
    info: {
        title: '',
        list: []
    }
};

/**
 * 带标签的音乐配置条
 */
@Component({
    name: 'commLabelMusic'
})
export default class CommLabelMusic extends BaseLabelComp<string, Config> implements BaseLabelCompInterface<Config> {

    private audio!: HTMLAudioElement;
    private playing: boolean = false;
    private progress: number = 0;
    private currentTimeStr: string = '00:00';
    private interval!: number;

    public getDefaultConfig() {
        return defaultConfig;
    }

    public mounted() {
        this.initAudio();
    }

    private initAudio() {
        this.audio = new Audio();
        this.audio.addEventListener('canplaythrough', () => {
                this.setTime();
        });
        this.audio.addEventListener('ended', () => {
            this.end();
        });
        this.audio.src = this.innerValue;
        this.audio.load();
    }

    private toggle() {
      if (this.playing) {
        this.pause();
      } else {
        this.play();
      }
    }

    private play() {
      // 重置进度条和时间
      if (this.progress >= 100) {
        this.progress = 0;
        this.currentTimeStr = '00:00';
      }
      // 定时更新
      this.interval = setInterval(() => {
        this.progress = 100 * this.audio.currentTime / this.audio.duration;
        this.currentTimeStr = this.getMusicTime(this.audio.currentTime);
      }, 300);
      // 播放
      this.playing = true;
      this.audio.play();
      // 派发事件
    }

    private pause() {
      this.playing = false;
      this.audio.pause();
      clearInterval(this.interval);
      this.interval = -1;
    }

    private end() {
      this.playing = false;
      this.audio.pause();
      this.audio.currentTime = 0;
      clearInterval(this.interval);
      this.interval = -1;
      // 还原
      this.currentTimeStr = this.getMusicTime(this.audio.duration);
      this.progress = 100;
    }

    private setTime() {
      if (this.audio.readyState === 4) {
        this.currentTimeStr = this.getMusicTime(this.audio.duration);
      } else {
        this.audio.addEventListener('canplaythrough', () => {
          this.currentTimeStr = this.getMusicTime(this.audio.duration);
        });
      }
    }

    private getMusicTime(time) {
        let musicTime = Math.ceil(time);
        let minute = Math.floor(time / 60).toString().padStart(2, '0');
        let second = (musicTime - +minute * 60).toString().padStart(2, '0');
        return  `${minute}:${second}`;
    }

    private inputChange(event) {
        if (!event || !event.target || !event.target.files || event.target.files.length <= 0) {
            return;
        }
        const file = event.target.files[0];
        const imgfile = new FormData();
        imgfile.append('imgfile', file);
        api.post('https://custom.24haowan.com/public/img/updateImg', {data: imgfile})
            .then(res => {
                const url = res.payload.data.url;
                this.$emit('input', url);
                this.innerValue = url;
                this.audio.src = res.payload.data.url;
                this.$emit('save', {
                    value: this.innerValue,
                    tag: this.tag,
                    type: 'commLabelMusic'
                });
            }).catch(() => {
                this.$message.error('上传出错，请重新上传该音频');
            }).finally(() => {
                event.target.value = '';
            });
    }

    public renderBorder(views: RenderReturnType) {
        return <div
            class='label-music comm-label-wrap'
            style={{width: this.innerConfig.width}}>
            {views}
        </div>;
    }

    protected renderContent(): RenderReturnType {
        return [
            <div class='music-progress'>
                <el-progress percentage={this.progress} show-text={false}/>
            </div>,
            <div class='music-progress-time'>{this.currentTimeStr}</div>,
            <div class='music-btn-wrap'>
                <el-button class='music-item' size='mini' plain onClick={this.toggle}>{this.playing ? '暂停' : '播放'}</el-button>
                <a class='music-item' download target='_blank' href={this.innerValue}>
                    <el-button type='primary' size='mini' plain>下载</el-button>
                </a>
                <el-button class='music-item' type='success' size='mini' plain disabled={this.innerConfig.disabled}>
                    上传
                    <input class='music-upload-input' type='file' accept='audio/mp3' disabled={this.innerConfig.disabled} onChange={this.inputChange} />
                </el-button>
            </div>
        ];
    }

}


</script>

<style lang="less">
.label-music {
    position: relative;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    box-sizing: border-box;
    font-size: 14px;
    > .music-progress {
        flex: 1;
        display: flex;
        justify-content: flex-start;
        align-items: center;
        line-height: 36px;
        .el-progress {
            flex-grow: 1;
        }
        .el-progress-bar__outer {
            overflow: visible;
        }
        .el-progress-bar__inner {
            &::before {
                content: "";
                display: block;
                width: 14px;
                height: 14px;
                width: 14px;
                height: 14px;
                position: absolute;
                background-color: #409EFF;
                right: 0;
                border-radius: 50%;
                top: 50%;
                transform: translate(50%, -50%);
            }
        }
    }
    > .music-progress-time {
        color: #409EFF;
        margin-left: 12px;
    }
    > .music-btn-wrap {
        display: flex;
        justify-content: center;
        align-items: center;
        > .music-item {
            position: relative;
            margin-left: 10px;
            .music-upload-input {
                width: 100%;
                height: 100%;
                position: absolute;
                left: 0;
                top: 0;
                opacity: 0;
            }
        }
    }
}
</style>
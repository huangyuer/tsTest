<script lang='tsx'>
import { Component, Vue, Watch, Prop } from 'vue-property-decorator';
import { CreateElement } from 'vue';
import BaseLabelComp, { BaseConfig, BaseLabelCompInterface, LockInit, RenderReturnType } from './base/baseLabelComp.vue';
import api from '@/api/index';

interface Config extends BaseConfig {
    alignItem: 'center' | 'start' | 'end';
    closeable: boolean;
    height: string;
    file: string[];
    minSize: number;
    maxSize: number;
    ableInput: boolean;
    inputPlaceHolder: string;
    inputValue: string;
    showRedBorder: boolean;
}

const defaultConfig: Config = {
    disabled: false,
    required: false,
    alignItem: 'center',
    showRedBorder: false,
    closeable: false,
    labelAlign: 'start',
    labelWidth: 'auto',
    label: '',
    width: '80px',
    height: '0',
    file: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
    minSize: 0,
    maxSize: 0,
    ableInput: false,
    inputPlaceHolder: '',
    inputValue: '',
    info: {
        title: '',
        list: []
    }
};

/**
 * 带标签的文件上传
 */
@Component({
    name: 'commLabelUpload'
})
export default class CommLabelUpload extends BaseLabelComp<string, Config> implements BaseLabelCompInterface<Config> {

    public getDefaultConfig() {
        return defaultConfig;
    }

    private get inputAccept() {
        const file = this.innerConfig.file.reduce((pre, item) => {
            pre += (pre ? ',' : '') + item;
            return pre;
        }, '');
        return file;
    }

    private preview(e) {
        if (this.innerValue) {
            const target = this.$refs.previewImg as HTMLImageElement;
            let img = target.src || target.style.backgroundImage;
            img = img.replace('url("', '').replace('")', '');
            this.$photo.show({
                src: img,
                elem: target
            });
        }
    }

    private getfilesize(size) {
        if (!size) {
            return '';
        }
        const num = 1024.00;
        if (size < num) {
            return size + 'B';
        }
        if (size < Math.pow(num, 2)) {
            return (size / num).toFixed(2) + 'K';
        }
        if (size < Math.pow(num, 3)) {
            return (size / Math.pow(num, 2)).toFixed(2) + 'M';
        }
        if (size < Math.pow(num, 4)) {
            return (size / Math.pow(num, 3)).toFixed(2) + 'G';
        }
        return (size / Math.pow(num, 4)).toFixed(2) + 'T';
    }

    private selectImg(event) {
        if (!event || !event.target || !event.target.files || event.target.files.length <= 0) {
            return;
        }
        const file = event.target.files[0];
        if (this.innerConfig.file.length > 0 && this.innerConfig.file.indexOf(file.type) < 0) {
            this.$message.error('不是有效的文件!');
            event.target.value = '';
            return;
        }
        if (file.size < this.innerConfig.minSize) {
            this.$message.error(`文件大小不能小于${this.getfilesize(this.innerConfig.minSize)}`);
            event.target.value = '';
            return;
        }
        if (this.innerConfig.maxSize > 0 && file.size > this.innerConfig.maxSize) {
            this.$message.error(`文件大小不能大于${this.getfilesize(this.innerConfig.maxSize)}`);
            event.target.value = '';
            return;
        }
        const imgfile = new FormData();
        imgfile.append('file', file);
        api.vAuthPost('/api/backweb/workbench/uploadFile', { data: imgfile })
            .then(res => {
                const url = res.data.url;
                this.$emit('input', url);
                this.innerValue = url;
                this.$emit('save', {
                    value: this.innerValue,
                    tag: this.tag,
                    type: 'commLabelUpload'
                });
            }).catch(() => {
                this.$message.error('上传出错，请重新上传该图片');
            }).finally(() => {
                event.target.value = '';
            });
    }

    private getImgBase64(source) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(source);
            reader.onload = (e) => {
                resolve(e);
            };
        });
    }

    private closeImg() {
        this.$emit('close');
    }

    private inputChange(e) {
        this.$emit('save', {
            value: e.target.value,
            tag: this.tag,
            type: 'commLabelUpload'
        });
    }

    private renderPreviewImg() {
        let width = this.innerConfig.width;
        let height = this.innerConfig.height;
        if (height === '0') {
            height = width;
        }
        return (
            <div
                class={['upload-img-wrap border', this.innerConfig.showRedBorder ? 'border-red' : '']}
                style={{
                    width,
                    height
                }}>
                <div
                    ref='showImg'
                    class='upload-show-img'>
                    <img ref='previewImg' style='max-width: 100%;max-height: 100%;' src={this.innerValue} />
                    <div class='preview-wrap'>
                        {
                            this.innerValue && [
                                <el-button size='mini' plain class='comm-upload-btn' onClick={this.preview}>大图</el-button>,
                                <div style='margin: 2px 0;'></div>
                            ]
                        }
                        <el-button
                            size='mini'
                            plain
                            class='comm-upload-btn'
                            disabled={this.innerConfig.disabled}
                            onClick={()=> {
                                (this.$refs.uploadInput as HTMLElement).click();
                            }}>
                            {this.innerValue ? '修改' : '上传'}
                        </el-button>
                        <input
                            id='select'
                            type='file'
                            ref='uploadInput'
                            class='upload-inputfile'
                            disabled={this.innerConfig.disabled}
                            accept={this.inputAccept}
                            onChange={this.selectImg} />
                    </div>
                </div>
                {
                    this.innerConfig.closeable &&
                    <div class='upload-close-icon' onClick={this.closeImg}/>
                }
                </div>
        );
    }

    public renderBorder(views: RenderReturnType) {
        return <div class={['label-upload comm-label-wrap', this.innerConfig.alignItem]}>
            {views}
        </div>;
    }

    public renderContent(): RenderReturnType {
        const list: RenderReturnType[] = [
            this.renderPreviewImg(),
        ];
        if (this.innerConfig.ableInput) {
            list.push(
                <div class='upload-input-wrap'>
                    <input
                        v-model={this.innerConfig.inputValue}
                        class='upload-real-input'
                        disabled={this.innerConfig.disabled}
                        placeholder={this.innerConfig.inputPlaceHolder}
                        onInput={this.inputChange}/>
                </div>
            );
        }
        return list;
    }

}


</script>

<style lang="less">
.label-upload {
    position: relative;
    font-size: 14px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    box-sizing: border-box;
    > .upload-img-wrap {
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 10px;
        font-size: 24px;
        position: relative;
        cursor: pointer;
        &.border {
            border: 1px dashed #a6a6a6;
        }
        &.border-red {
            border: 1px dashed red;
        }
        &.border-none {
            border: 1px solid transparent;
        }
        > .upload-show-img {
            position: relative;
            width: 100%;
            height: 100%;
            border-radius: 10px;
            overflow: hidden;
            display: flex;
            justify-content: center;
            align-items: center;
            > .preview-wrap {
                position: absolute;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                border-radius: 10px;
                opacity: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                flex-direction: column;
                padding: 8px 0;
                box-sizing: border-box;
                .comm-upload-btn {
                    color: #ffffff;
                    background: #ecf5ff00;
                    &:hover {
                        background: #599ef8;
                    }
                }
                > .upload-inputfile {
                    width: 1;
                    height: 1;
                    opacity: 0;
                    position: absolute;
                }
            }
            &:hover {
                > .preview-wrap {
                    opacity: 1;
                }
            }
        }
        > .upload-close-icon {
            position: absolute;
            width: 16px;
            height: 16px;
            border-radius: 100%;
            top: -8px;
            right: -8px;
            cursor: pointer;
            background-color: white;
            background-image: url('./assets/imgs/icon_close.svg');
            background-size: 100% 100%;
        }
    }
    .upload-size {
        margin: 2px 0;
        font-size: 12px;
    }
    .upload-input-wrap {
        width: 100%;
        border: 1px solid #a6a6a6;
        background-color: white;
        border-radius: 5px;
        > .upload-real-input {
            width: 100%;
            font-size: 12px;
            line-height: 12px;
            outline: none;
            border: none;
        }
    }
}
</style>
<script lang='tsx'>
import { Component, Vue, Watch, Prop } from 'vue-property-decorator';
import { CreateElement } from 'vue';
import BaseLabelComp, { BaseConfig, BaseLabelCompInterface, LockInit, RenderReturnType } from './base/baseLabelComp.vue';
import '@/plugins/wangEditor/wangEditor.min.js';
import '@/plugins/wangEditor/wangEditor.min.css';
import api from '@/api/index';

interface Config extends BaseConfig {
    editorWidth: string;
    editorHeight: string;
    maxVideoSize: number;
    maxImgSize: number;
    alignItem: 'center' | 'start' | 'end';
}

const defaultConfig: Config = {
    alignItem: 'center',
    editorWidth: '300px',
    editorHeight: '300px',
    maxVideoSize: 20 * 1024 * 1024,
    maxImgSize: 5 * 1024 * 1024,
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
 * 带标签的Editor 开关
 */
@Component({
    name: 'commLabelEditor'
})
export default class CommLabelEditor extends BaseLabelComp<string, Config> implements BaseLabelCompInterface<Config> {

    private editor!: any;
    private editorLoading: boolean = false;

    private focusing: boolean = false;

    public getDefaultConfig() {
        return defaultConfig;
    }

    protected initValue() {
        if (this.innerValue === this.value) {
            return;
        }
        this.innerValue = this.value;
        if (this.editor) {
            this.editor.txt.html(this.innerValue);
        }
    }

    private onEditorChange(html) {
        this.innerValue = html;
        this.change(html);
    }

    protected afterInitConfig() {
        this.changeEditorSize();
    }

    private clickOutside() {
        this.focusing = false;
        this.$emit('clickOutside', {
            value: this.innerValue,
            tag: this.tag,
            type: 'commLabelEditor'
        });
    }

    private changeEditorSize() {
        this.$nextTick(() => {
            if (this.editor) {
                try {
                    const domToolbar = document.getElementsByClassName('w-e-toolbar')[0] as HTMLElement;
                    domToolbar.style.width = this.innerConfig.editorWidth || '300px';
                    const domContent = document.getElementsByClassName('w-e-text-container')[0] as HTMLElement;
                    domContent.style.width = this.innerConfig.editorWidth || '300px';
                    domContent.style.height = this.innerConfig.editorHeight || '300px';
                } catch (e) {
                    // 可能是获取不到dom节点
                }
            }
        });
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

    public mounted() {
        if (!this.editor) {
            this.editor = new window.WangEditor(this.$refs.editor);
            this.editor.customConfig.menus = [
                'head',
                'bold',
                'fontSize',
                'italic',
                'underline',
                'strikeThrough',
                'foreColor',
                'backColor',
                'list',
                'justify',
                'quote',
                'image',
                'video',
                'table',
                'undo',
                'redo'
            ];

            this.editor.customConfig.customUploadImg = (files, insert) => {
                for (let i = 0; i < files.length; ++i) {
                    if (this.innerConfig.maxImgSize > 0 && files[i].size > this.innerConfig.maxImgSize) {
                        this.$message.error(`文件大小不能大于${this.getfilesize(this.innerConfig.maxImgSize)}`);
                        return;
                    }
                }
                this.uploadFiles(files, insert);
            };
            this.editor.customConfig.customUploadVideo = (files, insert) => {
                for (let i = 0; i < files.length; ++i) {
                if (this.innerConfig.maxVideoSize > 0 && files[i].size > this.innerConfig.maxVideoSize) {
                    this.$message.error(`文件大小不能大于${this.getfilesize(this.innerConfig.maxVideoSize)}`);
                    return;
                }
                }
                this.uploadFiles(files, insert);
            };
            this.editor.customConfig.onchange = (content) => {
                this.onEditorChange(content);
            };
            this.editor.customConfig.pasteTextHandle = (content) => {
                if (content === '' && !content) {
                    return '';
                }
                content = content.replace(/<!--[\w\W\r\n]*?-->/gmi, '');
                return content;
            };
            this.editor.customConfig.onfocus = ()=> {
                this.focusing = true;
            };
            this.editor.customConfig.onblur = (html)=> {
                this.clickOutside();
            };
            this.editor.create();
        }
        this.editor.txt.html(this.innerValue);
        this.changeEditorSize();
    }

    private async uploadFiles(files, insertImg) {
        this.editorLoading = true;
        let count = files.length;
        for (let i = 0; i < files.length; ++i) {
            const imgfile = new FormData();
            imgfile.append('file', files[i]);
            const res = await api.vAuthPost('/api/backweb/workbench/uploadFile', {data: imgfile}).catch(() => {});
            if (!res || +res.code !== 0) {
              continue;
            }
            count--;
            insertImg(res.data.url);
        }
        if (count > 0) {
            this.$message.error(`${count}个文件上传失败，请重新上传`);
        }
        this.editorLoading = false;
    }

    private change(value) {
        this.$emit('input', value);
        this.$emit('preview', {
            value,
            tag: this.tag,
            type: 'commLabelEditor'
        });
    }

    public renderBorder(views: RenderReturnType) {
        return <div
            class={['label-editor comm-label-wrap', this.innerConfig.alignItem]}>
            {views}
        </div>;
    }

    protected renderContent(): RenderReturnType {
        return <div
            ref='editor'
            v-loading={this.editorLoading}
            class='editor-et-content'
            style={{
                'pointer-events': this.innerConfig.disabled ? 'none' : 'auto'
            }}  />;
    }

}

</script>

<style lang="less">
.label-editor {
    position: relative;
    display: flex;
    justify-content: flex-start;
    box-sizing: border-box;
    font-size: 14px;
    &.start {
      align-items: flex-start !important;
    }
    &.center {
      align-items: center !important;
    }
    &.end {
      align-items: flex-end !important;
    }
    > .editor-et-content {
        flex: 1;
    }
    .editor-tip {
        margin-left: 12px;
    }
    .el-editor__runway {
        margin: 0;
    }
}
</style>
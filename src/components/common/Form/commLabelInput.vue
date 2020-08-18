<script lang='tsx'>
import { Component, Vue, Watch, Prop } from 'vue-property-decorator';
import { CreateElement } from 'vue';
import BaseLabelComp, { BaseConfig, BaseLabelCompInterface, LockInit, RenderReturnType } from './base/baseLabelComp.vue';

interface Config extends BaseConfig {
    type: 'text' | 'number' | 'textarea';
    resize: 'none' | 'both' | 'horizontal' | 'vertical';
    customInputClass: string[];
    customPreviewClass: string[];
    showPreviewTip: boolean;
    rows: number;
    showControls: boolean;
    placeholder: string;
    append: string;
    maxlength: '' | number;
    min: number;
    max: number;
    precision: number;
    filter: (value: string)=> string;
    subTip?: {
        tip: string;
        color: string
    };
    showInput: boolean;
    select?: {
        show: boolean;
        text: string;
        accept: string
    };
}

const defaultConfig: Config = {
    disabled: false,
    required: false,
    labelAlign: 'start',
    labelWidth: 'auto',
    customInputClass: [],
    customPreviewClass: [],
    showPreviewTip: false,
    rows: 2,
    label: '',
    width: '',
    type: 'text',
    resize: 'both',
    showControls: false,
    placeholder: '',
    append: '',
    maxlength: '',
    min: -9999999999,
    max: 9999999999,
    precision: 0,
    showInput: true,
    filter: (value: string)=> value,
    info: {
        title: '',
        list: []
    },
    subTip: {
        tip: '',
        color: '#999999'
    },
    select: {
        show: false,
        text: '导入',
        accept: '*'
    }
};

/**
 * 带标签的input
 */
@Component({
    name: 'commLabelInput'
})
export default class CommLabelInput extends BaseLabelComp<string, Config> implements BaseLabelCompInterface<Config> {

    private focusing: boolean = false;

    private showPreview: boolean = false;

    private lastValue: string = '';

    private changeValue: boolean = false;

    public getDefaultConfig() {
        return defaultConfig;
    }

    protected created() {
        this.showPreview = this.innerConfig.showPreviewTip;
        this.lastValue = this.innerValue;
    }

    protected initValue() {
        this.innerValue = this.value;
        if (this.changeValue) {
            this.lastValue = this.innerValue;
        }
    }

    @Watch('innerValue')
    @LockInit
    public watchInnerValue(value) {
        this.changeValue = false;
        this.$emit('input', this.innerValue);
        this.$emit('preview', {
            value: this.innerValue,
            tag: this.tag,
            type: 'commLabelInput'
        });
    }

    private selectFile(event) {
        if (!event || !event.target || !event.target.files || event.target.files.length <= 0) {
            return;
        }
        const file = event.target.files[0];
        this.$emit('dealFile', {
            value: file,
            tag: this.tag,
            type: 'commLabelInput',
            cb: this.setValue
        });
        event.target.value = '';
    }

    private setValue(value) {
        this.innerValue = value || '';
    }

    private clickOutside() {
        this.changeValue = true;
        this.focusing = false;
        this.showPreview = true;
        if (this.lastValue !== this.innerValue) {
            this.lastValue = this.innerValue;
            // 有变化才触发
            this.$emit('clickOutside', {
                value: this.innerValue,
                tag: this.tag,
                type: 'commLabelInput'
            });
        }
    }

    private renderTextInput() {
        if (this.innerConfig.type === 'number' || !this.innerConfig.showInput) {
            return '';
        }
        const views = [
            <el-input
                onBlur={this.clickOutside}
                onFocus={()=> this.focusing=true}
                ref='input'
                value={this.innerValue}
                show-word-limit
                type={this.innerConfig.type}
                resize={this.innerConfig.resize}
                class={['input-content', 'input-parent', ...this.innerConfig.customInputClass]}
                rows={this.innerConfig.rows}
                size='mini'
                placeholder={this.innerConfig.placeholder}
                disabled={this.innerConfig.disabled}
                maxlength={this.innerConfig.maxlength}
                min={this.innerConfig.min}
                onInput={(value)=> {
                    if (this.innerConfig.filter) {
                        value = this.innerConfig.filter(value);
                    }
                    this.innerValue = value;
                }}>
                {
                    this.innerConfig.append && <template slot='append'>{this.innerConfig.append }</template>
                }
            </el-input>
        ];
        if (this.innerConfig.showPreviewTip && this.showPreview) {
            views.push(
                <p
                    class={['input-preview', ...this.innerConfig.customPreviewClass]}
                    style={{
                        '-webkit-line-clamp': this.innerConfig.rows
                    }}
                    title={this.innerValue}
                    onClick={()=> {
                        this.showPreview = false;
                        (this.$refs.input as HTMLElement).focus();
                    }}>
                    {this.innerValue}
                </p>
            );
        }
        return views;
    }

    private renderNumberInput() {
        if (this.innerConfig.type !== 'number' || !this.innerConfig.showInput) {
            return '';
        }
        const list: JSX.Element[] = [];
        list.push(
            <el-input-number
                onBlur={this.clickOutside}
                onFocus={()=> this.focusing=true}
                ref='input'
                value={this.innerValue}
                controls-position='right'
                class={['input-content', 'input-parent', ...this.innerConfig.customInputClass]}
                size='mini'
                precision={this.innerConfig.precision}
                placeholder={this.innerConfig.placeholder}
                disabled={this.innerConfig.disabled}
                min={this.innerConfig.min}
                max={this.innerConfig.max}
                controls={this.innerConfig.showControls}
                onInput={(value)=> {
                    if (this.innerConfig.filter) {
                        value = this.innerConfig.filter(value);
                    }
                    this.innerValue = value;
                }}>
            </el-input-number>
        );
        if (this.innerConfig.append) {
            list.push(<div style='margin-left: 10px'>{this.innerConfig.append}</div>);
        }
        return list;
    }

    private renderSubTip() {
        if (!this.innerConfig.subTip?.tip) {
            return '';
        }
        return (
            <div
                class='input-sub-tip'
                style={{
                    color: this.innerConfig.subTip.color,
                    left: this.innerConfig.labelWidth
                }}>
                {this.innerConfig.subTip.tip}
            </div>
        );
    }

    private renderSelect() {
        if (!this.innerConfig.select?.show) {
            return '';
        }
        return (
            <div
                class={{'input-import-wrap': true, 'disabled': this.innerConfig.disabled}}>
                <i class='el-icon-upload2'></i>{this.innerConfig.select.text}
                <input
                    id='select'
                    type='file'
                    class={{'input-inputfile': true, 'disabled': this.innerConfig.disabled}}
                    disabled={this.innerConfig.disabled}
                    accept={this.innerConfig.select.accept}
                    onChange={this.selectFile} />
            </div>
        );
    }

    private renderInfo() {
        if (!this.innerConfig.info || this.innerConfig.info.list.length === 0) {
            return '';
        }
        return (
            <el-popover
                placement='top'
                title={this.innerConfig.info.title}
                trigger='hover'>
                <div class='input-tip-ul'>
                {
                    this.innerConfig.info.list.map((item, index)=> {
                        return <p key={index} class='input-tip-li'>{item}</p>;
                    })
                }
                </div>
                <i slot='reference' class='input-tip el-icon-info' />
            </el-popover>
        );
    }

    public renderBorder(views: RenderReturnType) {
        return <div
            class='label-input comm-label-wrap'
            ref='inputWrap'
            style={{width: this.innerConfig.width}}>
            {views}
        </div>;
    }

    protected renderContent(): RenderReturnType {
        return [
            this.renderTextInput(),
            this.renderNumberInput(),
            this.renderSubTip(),
            this.renderSelect()
        ];
    }

}

</script>

<style lang="less">
.label-input {
    position: relative;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    flex-wrap: wrap;
    box-sizing: border-box;
    font-size: 14px;
    > .el-input-number {
        > .el-input {
            > .el-input__inner {
                text-align: left;
            }
        }
    }
    > .el-input--suffix .el-input__inner {
        padding-right: 30px !important;
    }
    > .input-content {
        flex: 1;
        &::-webkit-scrollbar {
            display: none;
        }
    }
    > .input-preview {
        position: absolute;
        width: 100%;
        height: calc(100% - 2px);
        border-radius: 5px;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        background-color: white;
        line-height: 1.5;
        font-size: 14px;
    }
    > .input-sub-tip {
        position: absolute;
        bottom: 0;
        transform: translate3d(0, 100%, 0);
        font-size: 12px;
        margin-left: 12px;
    }
    .input-tip {
        margin-left: 12px;
    }
    > .input-import-wrap {
        position: relative;
        margin-left: 12px;
        border: 1px solid #DCDFE6;
        padding: 7px 15px;
        font-size: 12px;
        border-radius: 3px;
        color: #606266;
        cursor: pointer;
        &.disabled {
            background-color: #F5F7FA;
            border-color: #E4E7ED;
            color: #C0C4CC;
            cursor: not-allowed;
            &:hover {
                background-color: #F5F7FA;
                border-color: #E4E7ED;
                color: #C0C4CC;
                cursor: not-allowed;
            }
        }
        &:hover {
            color: #409EFF;
            border-color: #c6e2ff;
            background-color: #ecf5ff;
        }
        > .input-inputfile {
            position: absolute;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            opacity: 0;
            &.disabled {
                cursor: not-allowed;
            }
        }
    }
}
</style>
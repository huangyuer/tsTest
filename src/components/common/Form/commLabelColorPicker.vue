<script lang='tsx'>
import { Component, Vue, Watch, Prop } from 'vue-property-decorator';
import { CreateElement } from 'vue';
import BaseLabelComp, { BaseConfig, BaseLabelCompInterface, LockInit, RenderReturnType } from './base/baseLabelComp.vue';

interface Config extends BaseConfig {
    showAlpha: boolean;
}

const defaultConfig: Config = {
    disabled: false,
    required: false,
    labelAlign: 'start',
    labelWidth: 'auto',
    showAlpha: true,
    label: '',
    width: '',
    info: {
        title: '',
        list: []
    }
};

/**
 * 带标签的颜色选择框
 */
@Component({
    name: 'commLabelColorPicker'
})
export default class CommLabelColorPicker extends BaseLabelComp<string, Config> implements BaseLabelCompInterface<Config> {

    public getDefaultConfig() {
        return defaultConfig;
    }

    private change(value) {
        this.$emit('input', value);
        this.$emit('save', {
            value,
            tag: this.tag,
            type: 'commLabelColorPicker'
        });
    }

    private preview(value) {
        this.$emit('preview', {
            value,
            tag: this.tag,
            type: 'commLabelColorPicker'
        });
    }

    private clickOutside() {
        this.$emit('clickOutside', {
            value: this.innerValue,
            tag: this.tag,
            type: 'commLabelColorPicker'
        });
    }

    public renderBorder(views: RenderReturnType) {
        return <div
            class='label-color-picker comm-label-wrap'
            style={{width: this.innerConfig.width}}>
            {views}
        </div>;
    }

    protected renderContent(): RenderReturnType {
        return <el-color-picker
            v-model={this.innerValue}
            size='mini'
            disabled={this.innerConfig.disabled}
            show-alpha={this.innerConfig.showAlpha}
            onActive-change={this.preview}
            onChange={this.change}
            v-s-clickoutside={this.clickOutside}/>;
    }

}

</script>

<style lang="less">
.label-color-picker {
    position: relative;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    box-sizing: border-box;
    font-size: 14px;
    .color-picker-tip {
        margin-left: 12px;
    }
}
</style>
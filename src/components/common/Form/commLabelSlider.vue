<script lang='tsx'>
import { Component, Vue, Watch, Prop } from 'vue-property-decorator';
import { CreateElement } from 'vue';
import BaseLabelComp, { BaseConfig, BaseLabelCompInterface, LockInit, RenderReturnType } from './base/baseLabelComp.vue';

interface Config extends BaseConfig {
    min: number;
    max: number;
    step: number;
}

const defaultConfig: Config = {
    disabled: false,
    required: false,
    labelAlign: 'start',
    labelWidth: 'auto',
    label: '',
    width: '',
    min: 0,
    max: 100,
    step: 1,
    info: {
        title: '',
        list: []
    }
};

/**
 * 带标签的滑块
 */
@Component({
    name: 'commLabelSlider'
})
export default class CommLabelSlider extends BaseLabelComp<number, Config> implements BaseLabelCompInterface<Config> {

    public getDefaultConfig() {
        return defaultConfig;
    }

    private preview(value) {
        this.$emit('input', value);
        this.$emit('preview', {
            value,
            tag: this.tag,
            type: 'commLabelSlider'
        });
    }

    private change(value) {
        this.$emit('input', value);
        this.$emit('save', {
            value,
            tag: this.tag,
            type: 'commLabelSlider'
        });
    }

    public renderBorder(views: RenderReturnType) {
        return <div
            class='label-slider comm-label-wrap'
            style={{width: this.innerConfig.width}}>
            {views}
        </div>;
    }

    protected renderContent(): RenderReturnType {
        return <el-slider
            v-model={this.innerValue}
            class='slider-content'
            disabled={this.innerConfig.disabled}
            min={this.innerConfig.min}
            max={this.innerConfig.max}
            step={this.innerConfig.step}
            onInput={this.preview}
            onChange={this.change}/>;
    }

}

</script>

<style lang="less">
.label-slider {
    position: relative;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    box-sizing: border-box;
    font-size: 14px;
    > .slider-content {
        flex: 1;
        margin-left: 12px
    }
    .slider-tip {
        margin-left: 12px;
    }
    .el-slider__runway {
        margin: 0;
    }
}
</style>
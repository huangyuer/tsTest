<script lang='tsx'>
import { Component, Vue, Watch, Prop } from 'vue-property-decorator';
import { CreateElement } from 'vue';
import BaseLabelComp, { BaseConfig, BaseLabelCompInterface, LockInit, RenderReturnType } from './base/baseLabelComp.vue';

type Item = string | number | {
    [key: string]: any,
    label: string
};

interface Config extends BaseConfig {
    list: Item[];
}

const defaultConfig: Config = {
    disabled: false,
    required: false,
    labelAlign: 'start',
    labelWidth: 'auto',
    label: '',
    width: '',
    list: [],
    info: {
        title: '',
        list: []
    }
};

/**
 * 带标签的单选框
 */
@Component({
    name: 'commLabelRadio'
})
export default class CommLabelRadio extends BaseLabelComp<Item, Config> implements BaseLabelCompInterface<Config> {

    public getDefaultConfig() {
        return defaultConfig;
    }

    protected initValue() {
        const item = this.value;
        if (typeof item === 'object') {
            this.innerValue = item.label || item;
        } else {
            this.innerValue = item;
        }
    }

    private change(value) {
        for (let i = 0; i < this.innerConfig.list.length; ++i) {
            const item = this.innerConfig.list[i];
            let key = item;
            if (typeof item === 'object') {
                key = item.label || item;
            }
            if (value === key) {
                value = item;
                break;
            }
        }
        this.$emit('input', value);
        this.$emit('save', {
            value,
            tag: this.tag,
            type: 'commLabelRadio'
        });
    }

    public renderBorder(views: RenderReturnType) {
        return <div
            class='label-radio comm-label-wrap'
            style={{width: this.innerConfig.width}}>
            {views}
        </div>;
    }

    protected renderContent(): RenderReturnType {
        return <el-radio-group
            v-model={this.innerValue}
            class='radio-content'
            size='mini'
            disabled={this.innerConfig.disabled}
            onChange={this.change}>
            {
                this.innerConfig.list.map(item=> {
                    let key = item;
                    let disabled = false;
                    if (typeof item === 'object') {
                        key = item.label || item;
                        disabled = item.disabled;
                    }
                    return <el-radio label={key} value={key} disabled={disabled}></el-radio>;
                })
            }
        </el-radio-group>;
    }

}

</script>

<style lang="less">
.label-radio {
    position: relative;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    box-sizing: border-box;
    font-size: 14px;
    text-align: left;
    > .radio-content {
      > .el-radio {
        line-height: 1.5;
      }
    }
    .radio-tip {
        margin-left: 12px;
    }
}
</style>
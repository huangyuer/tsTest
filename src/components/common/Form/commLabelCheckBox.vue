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
    showRedTip: boolean;
}

const defaultConfig: Config = {
    disabled: false,
    required: false,
    labelAlign: 'start',
    labelWidth: 'auto',
    showRedTip: false,
    label: '',
    width: '',
    list: [],
    info: {
        title: '',
        list: []
    }
};

/**
 * 带标签的多选框
 */
@Component({
    name: 'commLabelCheckBox'
})
export default class CommLabelCheckBox extends BaseLabelComp<Item[], Config> implements BaseLabelCompInterface<Config> {

    public getDefaultConfig() {
        return defaultConfig;
    }

    protected initValue() {
        this.innerValue = (this.value || []).map(item => {
            let iValue = item;
            if (typeof item === 'object') {
                iValue = item.label || item;
            }
            return iValue;
        });
    }

    private change(value) {
        const list = value.map(v => {
            for (let i = 0; i < this.innerConfig.list.length; ++i) {
                const item = this.innerConfig.list[i];
                let iValue = item;
                if (typeof item === 'object') {
                    iValue = item.label || item;
                }
                if (v === iValue) {
                    return item;
                }
            }
            return null;
        }).filter(item => item);
        this.$emit('input', list);
        this.$emit('save', {
            value,
            tag: this.tag,
            type: 'commLabelCheckBox'
        });
    }

    public renderBorder(views: RenderReturnType) {
        return <div
            class={{
                'label-checkbox': true,
                'comm-label-wrap': true,
                'red-tip': this.innerConfig.showRedTip
            }}
            style={{width: this.innerConfig.width}}>
            {views}
        </div>;
    }

    protected renderContent(): RenderReturnType {
        return <el-checkbox-group
            v-model={this.innerValue}
            class={{
                'checkbox-content': true
            }}
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
                    return <el-checkbox label={key} value={key} disabled={disabled}></el-checkbox>;
                })
            }
        </el-checkbox-group>;
    }

}

</script>

<style lang="less">
.label-checkbox {
    position: relative;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    box-sizing: border-box;
    font-size: 14px;
    text-align: left;
    &.red-tip {
        outline: 1px solid red;
    }
    &.start {
      align-items: flex-start !important;
      > .checkbox-label {
        margin-top: 5px;
      }
    }
    &.center {
      align-items: center !important;
    }
    &.end {
      align-items: flex-end !important;
    }
    .checkbox-tip {
        margin-left: 12px;
    }
    .checkbox-content {
      flex: 1;
    }
}

.el-checkbox {
  margin-right: 5px !important;
  margin-bottom: 5px;
  margin-left: 0 !important;
}
</style>
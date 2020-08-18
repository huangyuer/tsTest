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
    placeholder: string;
    clearable: boolean;
}

const defaultConfig: Config = {
    disabled: false,
    required: false,
    labelAlign: 'start',
    labelWidth: 'auto',
    label: '',
    width: '',
    list: [],
    placeholder: '',
    clearable: false,
    info: {
        title: '',
        list: []
    }
};

/**
 * 带标签的下拉选择
 */
@Component({
    name: 'commLabelSelect'
})
export default class CommLabelSelect extends BaseLabelComp<Item, Config> implements BaseLabelCompInterface<Config> {

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
            type: 'commLabelSelect'
        });
    }

    public renderBorder(views: RenderReturnType) {
        return <div
            class='label-select comm-label-wrap'
            style={{width: this.innerConfig.width}}>
            {views}
        </div>;
    }

    protected renderContent(): RenderReturnType {
        return <el-select
            v-model={this.innerValue}
            class='select-content'
            size='mini'
            clearable={this.innerConfig.clearable}
            placeholder={this.innerConfig.placeholder}
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
                    return <el-option key={key} label={key} value={key} disabled={disabled}></el-option>;
                })
            }
        </el-select>;
    }

}

</script>

<style lang="less">
.label-select {
    position: relative;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    box-sizing: border-box;
    font-size: 14px;
    text-align: left;
    > .select-content {
        flex: 1;
    }
    .select-tip {
        margin-left: 12px;
    }
}
</style>
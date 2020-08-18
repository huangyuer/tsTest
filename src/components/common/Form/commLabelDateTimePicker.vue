<script lang='tsx'>
import { Component, Vue, Watch, Prop } from 'vue-property-decorator';
import { CreateElement } from 'vue';
import BaseLabelComp, { BaseConfig, BaseLabelCompInterface, LockInit, RenderReturnType } from './base/baseLabelComp.vue';
import * as utils from '@/utils/index';



interface Config extends BaseConfig {
    type: 'year' | 'month' | 'date' | 'dates' |  'week' | 'datetime' | 'datetimerange' | 'daterange' | 'monthrange';
    startPlaceholder: string;
    endPlaceholder: string;
    placeholder: string;
    format: string;
    defaultTime: string[];
    clearable: boolean;
    disabledDate: (time: Date)=> boolean;
}

const defaultConfig: Config = {
    type: 'datetimerange',
    disabled: false,
    required: false,
    labelAlign: 'start',
    labelWidth: 'auto',
    clearable: true,
    startPlaceholder: '开始日期',
    endPlaceholder: '结束日期',
    placeholder: '',
    defaultTime: [],
    disabledDate: (time: Date)=> false,
    format: 'yyyy-MM-dd HH:mm:ss',
    label: '',
    width: '',
    info: {
        title: '',
        list: []
    }
};

/**
 * 带标签的日期时间选择框
 */
@Component({
    name: 'commLabelDateTimePicker'
})
export default class CommLabelDateTimePicker extends BaseLabelComp<string[], Config> implements BaseLabelCompInterface<Config> {

    public getDefaultConfig() {
        return defaultConfig;
    }

    private change(value) {
        if (value === null) {
            value = [];
        }
        this.$emit('input', value);
        this.$emit('save', {
            value,
            tag: this.tag,
            type: 'commLabelDateTimePicker'
        });
    }

    public renderBorder(views: RenderReturnType) {
        return <div
            class='label-dateTimePicker comm-label-wrap'
            style={{width: this.innerConfig.width}}>
            {views}
        </div>;
    }

    protected renderContent(): RenderReturnType {
        return <el-date-picker
                v-model={this.innerValue}
                class='dateTimePicker-content'
                size='mini'
                type={this.innerConfig.type}
                start-placeholder={this.innerConfig.startPlaceholder}
                end-placeholder={this.innerConfig.endPlaceholder}
                placeholder={this.innerConfig.placeholder}
                value-format={this.innerConfig.format}
                disabled={this.innerConfig.disabled}
                default-time={this.innerConfig.defaultTime}
                clearable={this.innerConfig.clearable}
                picker-options={{
                    disabledDate: this.innerConfig.disabledDate
                }}
                onChange={this.change}/>;
    }

}

</script>

<style lang="less">
.label-dateTimePicker {
    position: relative;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    box-sizing: border-box;
    font-size: 14px;
    > .dateTimePicker-content {
        flex: 1;
    }
    .dateTimePicker-tip {
        margin-left: 12px;
    }
}
</style>
<script lang='tsx'>
import { Component, Vue, Watch, Prop } from 'vue-property-decorator';
import { CreateElement } from 'vue';
import BaseLabelComp, { BaseConfig, BaseLabelCompInterface, LockInit, RenderReturnType } from './base/baseLabelComp.vue';

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
 * 带标签的Switch 开关
 */
@Component({
    name: 'commLabelSwitch'
})
export default class CommLabelSwitch extends BaseLabelComp<boolean, Config> implements BaseLabelCompInterface<Config> {

    private focusing: boolean = false;

    public getDefaultConfig() {
        return defaultConfig;
    }

    private change(value) {
        this.$emit('input', value);
        this.$emit('save', {
            value,
            tag: this.tag,
            type: 'commLabelSwitch'
        });
    }

    public renderBorder(views: RenderReturnType) {
        return <div
            class='label-switch comm-label-wrap'
            style={{width: this.innerConfig.width}}>
            {views}
        </div>;
    }

    protected renderContent(): RenderReturnType {
        return <el-switch
            v-model={this.innerValue}
            class='switch-content'
            disabled={this.innerConfig.disabled}
            onChange={this.change}/>;
    }

}

</script>

<style lang="less">
.label-switch {
    position: relative;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    box-sizing: border-box;
    font-size: 14px;
    > .switch-content {
        flex: 1;
    }
    .switch-tip {
        margin-left: 12px;
    }
    .el-switch__runway {
        margin: 0;
    }
}
</style>
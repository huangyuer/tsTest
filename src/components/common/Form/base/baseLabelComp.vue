<script lang="tsx">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { CreateElement } from 'vue';
import utils from '@/utils/index';

export type RenderReturnType = JSX.Element | Array<JSX.Element | '' | RenderReturnType> | '';

export interface BaseConfig {
    disabled: boolean;
    required: boolean;
    labelAlign: 'start' | 'center' | 'end';
    labelWidth: string;
    label: string;
    width: string;
    info?: {
        title: string;
        list: string[]
    };
}

export interface BaseLabelCompInterface<C> {
    getDefaultConfig: ()=> C;
}

/**
 * 由于初始化config时会触发watch，所以加上该机制，过滤掉首次触发
 */
export function LockInit(target: any, key: string, des) {
    const fn = des.value;
    des.value = function(...args: any[]) {
        if (!this.hadInit) {
            return;
        }
        fn.call(this, ...args);
    };
}

/**
 * 在created生命周期里先初始化config
 */
export function InitConfig(target: any) {
    const fn = target.prototype.created || (()=> {});
    target.prototype.created = function() {
        this.initValue();
        this.initConfig();
        this.$nextTick(()=> this.hadInit = true);
        fn.call(this);
    };
}

@Component
@InitConfig
export default class BaseLabelComp<V, C extends BaseConfig> extends Vue implements BaseLabelCompInterface<C> {

    @Prop({default: ''})
    protected tag!: string;

    @Prop()
    protected value!: V;

    @Prop()
    protected config!: C;

    protected innerValue: V = {} as V;

    protected innerConfig: C = {} as any;

    protected hadInit: boolean = false;

    public getDefaultConfig() {
        return {} as C;
    }

    protected initValue() {
        this.innerValue = this.value;
    }

    protected initConfig() {
        const defConnfig = this.getDefaultConfig();
        const defaultConfig = JSON.parse(JSON.stringify(defConnfig));
        function deepCloneFunction(obj1, obj2) {
            const keys = Object.keys(obj2);
            for (let i = 0;i < keys.length;++i) {
                const item = obj2[keys[i]];
                if (typeof item === 'function') {
                    obj1[keys[i]] = item;
                } else if (typeof item === 'object') {
                    deepCloneFunction(obj1[keys[i]], item);
                }
            }
        }
        deepCloneFunction(defaultConfig, defConnfig);
        this.innerConfig = Object.assign({}, defaultConfig, this.innerConfig);
        const config = this.config || {};
        for (const key in this.innerConfig) {
            if (typeof this.innerConfig[key] === 'object' && config[key]) {
                if (utils.isArray(this.innerConfig[key])) {
                    this.innerConfig[key] = config[key];
                } else {
                    Object.assign(this.innerConfig[key], config[key]);
                    Object.assign(config[key], this.innerConfig[key]);
                }
            }
        }
        Object.assign(this.innerConfig, config);
        this.afterInitConfig();
    }

    protected afterInitConfig() {

    }

    @Watch('value')
    @LockInit
    protected watchValue() {
        this.initValue();
    }

    @Watch('config')
    @LockInit
    protected watchConfig() {
        this.initConfig();
    }

    protected renderLabel(): RenderReturnType {
        if (!this.innerConfig.label) {
            return '';
        }
        return (
            <div
                class={['comm-label', this.innerConfig.labelAlign]}
                style={{
                    width: this.innerConfig.labelWidth,
                    minWidth: this.innerConfig.labelWidth,
                    textAlign: this.innerConfig.labelAlign
                }}>
                <div class={{label: true, required: this.innerConfig.required}}>
                    {this.innerConfig.label}
                </div>
            </div>
        );
    }

    protected renderContent(): RenderReturnType {
        return '';
    }

    protected renderInfoTip(): RenderReturnType {
        if (!this.innerConfig.info || this.innerConfig.info.list.length === 0) {
            return '';
        }
        return <el-popover
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
            <i slot='reference' class='input-tip el-icon-info' style='margin-left: 5px;' />
        </el-popover>;
    }

    protected renderBorder(views: RenderReturnType): RenderReturnType {
        return views;
    }

    private render() {
        return this.renderBorder([
            this.renderLabel(),
            this.renderContent(),
            this.renderInfoTip()
        ]);
    }
}
</script>

<style lang="less">
.comm-label {
    margin-right: 12px;
    position: relative;
    display: flex;
    justify-content: flex-end;
    &.start {
        justify-content: flex-start;
    }
    &.center {
        justify-content: center;
    }
    &.end {
        justify-content: flex-end;
    }
    align-items: center;
    > .required {
        position: relative;
        &::before {
            position: absolute;
            content: '*';
            font-size: 16px;
            line-height: 16px;
            color: red;
            left: 0;
            top: 50%;
            transform: translate3d(-100%, -50%, 0);
        }
    }
}
</style>
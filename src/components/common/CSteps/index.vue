<script lang='tsx'>
import { Component, Vue, Watch, Prop } from 'vue-property-decorator';
import { CreateElement } from 'vue';

@Component
export default class CSteps extends Vue {

    @Prop()
    public active!: number;
    @Prop()
    public finishStatus!: 'process' | 'finish' | 'success';
    @Prop()
    public processStatus!: 'process' | 'finish' | 'success';
    public stepList: any[] = [];
    public currentActive: number = 0;

    @Watch('active', {immediate: true})
    public watchActive() {
        this.currentActive = this.active;
    }

    public render(h: CreateElement) {
        const list = (this.$slots.default as any).reduce((pre, cur, index)=> {
            if (pre.length > 0) {
                pre.push('arrow');
            }
            cur.stepIndex = index;
            pre.push(cur);
            return pre;
        }, []);
        return <div class='__c-steps-wrap'>
        {
            list.map(item=> {
                if (item === 'arrow') {
                    return <div class='__arrow'></div>;
                }
                return item;
            })
        }
        </div>;
    }
}
</script>

<style lang="less">
.__c-steps-wrap {
    width: 100%;
    display: flex;
    background-color: #F5F7FA;
    padding: 10px;
    box-sizing: border-box;
    justify-content: center;
    align-items: center;
    font-size: 14px;
    > .__arrow {
        position: relative;
        height: 15px;
        &::before {
            content: '';
            display: inline-block;
            position: absolute;
            height: 15px;
            width: 1px;
            background-color: #C0C4CC;
            transform: rotate(-45deg) translateY(-4px);
            transform-origin: 0 0;
        }
        &::after {
            content: '';
            display: inline-block;
            position: absolute;
            height: 15px;
            width: 1px;
            background-color: #C0C4CC;
            transform: rotate(45deg) translateY(4px);
            transform-origin: 100% 100%;
        }
    }
}
</style>

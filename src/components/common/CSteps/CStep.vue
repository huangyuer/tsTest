<script lang='tsx'>
import { Component, Vue, Watch, Prop } from 'vue-property-decorator';
import { CreateElement } from 'vue';
import CSteps from './index.vue';

@Component
export default class CStep extends Vue {

    private parant!: CSteps;
    private index!: number;

    @Prop()
    private status!: string;

    public beforeCreate() {
        this.parant = this.$parent as CSteps;
        this.index = (this.$vnode as any).stepIndex;
    }

    public render(h: CreateElement) {
        const className = ['__c-step-wrap'];
        let status = '';
        if (this.status) {
            status = this.status;
        } else if (this.index > this.parant.active) {
            status = 'wait';
        } else if (this.index < this.parant.active) {
            status = this.parant.finishStatus || 'finish';
            if (this.parant.currentActive === this.index) {
                status = this.parant.processStatus || 'process';
            }
        } else {
            status = this.parant.processStatus || 'process';
            if (this.parant.currentActive !== this.index) {
                status = this.parant.finishStatus || 'finish';
            }
        }
        className.push(status);
        className.push(`${this.index}-${this.parant.active}`);
        return <div class={className} onClick={()=> {
            this.parant.currentActive = this.index;
        }}>
            {this.$slots.title}
        </div>;
    }
}
</script>

<style lang="less">
.__c-step-wrap {
    flex: 1;
    text-align: center;
    height: 20px;
    font-weight: bold;
    &.wait {
        color: #c0c4cc;
    }
    &.finish {
        color: #409eff;
    }
    &.process {
        color: #303133;
    }
    &.success {
        color: #67c23a;
    }
}
</style>

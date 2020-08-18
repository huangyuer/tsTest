<script lang='tsx'>
import { Component, Vue, Watch } from 'vue-property-decorator';
import { CreateElement } from 'vue';

@Component
export default class ErrorPage extends Vue {
    public render(h: CreateElement) {
        return (
            <div class='error-page'>
                找不到页面或页面没有配置数据
            </div>
        );
    }
}
</script>

<style lang="less">
.error-page {
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
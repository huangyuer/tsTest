<script lang='tsx'>
import { Component, Vue, Watch } from 'vue-property-decorator';
import Photo from '@/components/common/Photo/index.vue';
import { CreateElement } from 'vue';
import RenderPage from '@/views/RenderPage.vue';
import IframeRenderPage from '@c/IframeRender/IframeRenderPage.vue';
import { Pendant, PageConfig, Page, ActivityConfig } from '@/config';
import { stateCommon, stateActivity, stateWorkbench, stateUi } from '@/state/index';
import { VIFRAME_KEY } from './VIFRAME';

@Component
export default class App extends Vue {

    public created() {
        stateCommon.showLoading();
        this.$router.replace('workbench', (e: any)=> e);
    }

    public mounted() {
        this.$nextTick(()=> {
            stateCommon.login();
            stateWorkbench.boot()
                .then(res=> {
                    stateCommon.hideLoading();
                    stateWorkbench.data.startRenderPreview = true;
                })
                .catch(err=> {
                    console.log(err);
                    this.$message.error('配置信息加载失败');
                });
        });
    }

    public render(h: CreateElement) {
        return (
            <div id='app' v-loading={stateCommon.data.loading}>
                <transition name='fade'>
                    <router-view></router-view>
                </transition>
                <Photo />
            </div>
        );
    }
}
</script>

<style lang='less'>
@import './style/comm.less';
@import './style/icon.less';
@import './style/animation.less';

* {
    margin: 0;
    padding: 0;
}
#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    color: #2c3e50;
    width: 100vw;
    height: 100vh;
    &::-webkit-scrollbar {
        display: none;
    }
}
.fade {
    &-enter,
    &-leave-to {
        opacity: 0;
    }
    &-enter-active,
    &-leave-active {
        transition: all .5s;
    }
}
</style>

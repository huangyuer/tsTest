<script lang='tsx'>
import { Component, Vue, Watch } from 'vue-property-decorator';
import { CreateElement } from 'vue';

@Component
export default class Photo extends Vue {

    private src: string = '';
    private width: number = 0;
    private height: number = 0;
    private top: number = 0;
    private left: number = 0;
    private show: boolean = false;

    private init!: {
        width: number,
        height: number,
        left: number,
        top: number
    };

    public created() {
        this.init = {
            width: 0,
            height: 0,
            left: 0,
            top: 0
        };
        Vue.prototype.$photo = {
            show: (opt: {
                src?: string,
                bg?: string,
                elem?: Element,
                padding?: number
            }) => {
                const option = Object.assign({
                    src: '',
                    bg: 'rgba(0, 0, 0, 0.6)',
                    elem: null,
                    padding: 40
                }, opt);
                if (!option.src || !option.elem) {
                    console.error('参数错误');
                    return;
                }
                this.showPhoto(option);
            }
        };
    }

    private wait(time) {
      return new Promise(resolve => setTimeout(resolve, time));
    }

    private showPhoto(option: {
        src: string,
        bg: string,
        elem: Element,
        padding: number
    }) {
        this.src = option.src;
        const rect = this.calc(option.elem);
        this.width = this.init.width = rect.width;
        this.height = this.init.height = rect.height;
        this.left = this.init.left = rect.left;
        this.top = this.init.top = rect.top;
        const mw = window.innerWidth - option.padding * 2;
        const mh = window.innerHeight - option.padding * 2;
        const scale = Math.min(mw / rect.width, mh / rect.height);
        const width = rect.width * scale;
        const height = rect.height * scale;
        const left = (mw - width) / 2 + option.padding;
        const top = (mh - height) / 2 + option.padding;
        this.show = true;
        this.wait(100).then(() => {
            this.width = width;
            this.height = height;
            this.left = left;
            this.top = top;
        });
    }

    private async close() {
        this.width = this.init.width;
        this.height = this.init.height;
        this.left = this.init.left;
        this.top = this.init.top;
        await this.wait(500);
        this.show = false;
        await this.wait(500);
        this.width = this.init.width = 0;
        this.height = this.init.height = 0;
        this.left = this.init.left = 0;
        this.top = this.init.top = 0;
    }

    private calc(elem) {
        const rect = elem.getBoundingClientRect();
        return {
            width: rect.width,
            height: rect.height,
            top: rect.top,
            left: rect.left
        };
    }

    public render(h: CreateElement) {
        return (
            <transition name='fade-photo'>
            {
                this.show && <div
                    class='photo-wrap'
                    onClick={this.close}>
                    <img
                        class='img'
                        src={this.src}
                        style={{
                            width: `${this.width}px`,
                            height: `${this.height}px`,
                            top: `${this.top}px`,
                            left: `${this.left}px`
                        }}/>
                </div>
            }
            </transition>
        );
    }
}
</script>

<style lang="less">
.photo-wrap {
    position: fixed;
    background-color: rgba(0, 0, 0, 0.6);
    width: 100vw;
    height: 100vh;
    top: 0;
    left: 0;
    z-index: 99999999;
    > .img {
        position: absolute;
        transition: all .5s;
    }
}

.fade-photo {
    &-enter,
    &-leave-to {
        opacity: 0;
        transition: all 0.5s;
    }
    &-enter-active,
    &-leave-active {
        transition: all 0.5s;
    }
}
</style>

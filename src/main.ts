import Vue from 'vue';
import App from '@/App.vue';
import '@/utils/eventBus';
import '@/state/index';
import router from '@/router';
import VIFRAME from '@/VIFRAME';
VIFRAME.install(Vue);
import '@/components/common/Form';
import sClickOutside from '@/utils/sClickOutside';
Vue.directive('s-clickoutside', sClickOutside);
import '@/directive/clipboard';
import dayjs from 'dayjs';

window.dayjs = dayjs;
Vue.config.productionTip = process.env.NODE_ENV !== 'production';

window.VEDITOR.components = Object.assign({}, window.VEDITOR.components, (window as any).VTEDITOR.components);
const dialogComponents = Object.assign({}, window.VEDITOR.dialogComponents, (window as any).VTEDITOR.dialogComponents);
window.VEDITOR.dialogComponents = {
    ...window.VDIALOG_INJECT,
    ...Object.entries(dialogComponents).reduce((pre, cur: any)=> {
        const json = cur[1].json;
        pre[json.dialogName] = json;
        return pre;
    }, {})
};


new Vue({
    router,
    render: (h) => h(App),
}).$mount('#app');

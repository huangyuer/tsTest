import Vue from 'vue';
import VueRouter, { RouteConfig } from 'vue-router';
import ErrorPage from '@/views/ErrorPage.vue';
import WorkbenchPage from '@/views/WorkbenchPage.vue';

Vue.use(VueRouter);

const routes: RouteConfig[] = [
    {
        path: '/error',
        name: 'error',
        component: ErrorPage
    },
    {
        path: '/workbench',
        name: 'workbench',
        component: WorkbenchPage
    },
];

const router = new VueRouter({
    routes
});


export const reloadRouter = ()=> {
    (router as any).matcher = (new VueRouter({
        routes
    }) as any).matcher;
};

export default router;

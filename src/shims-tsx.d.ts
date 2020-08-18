import Vue, { VNode } from 'vue';
import { VIFRAME } from './VIFRAME';
import { State } from './state';
import XLSX, { ParsingOptions, WorkBook, XLSX$Utils } from 'xlsx';
import dayjs from 'dayjs';

import {
    ElMessage
} from 'element-ui/types/message';
import {
    ElMessageBoxShortcutMethod
} from 'element-ui/types/message-box';

interface AxiosAnyObj {
    [key: string]: any;
}

interface AxiosParams extends AxiosAnyObj {
    params?: AxiosAnyObj;
    data?: AxiosAnyObj;
    headers?: AxiosAnyObj;
    refresh?: boolean;
}

type Method =
| 'get' | 'GET'
| 'delete' | 'DELETE'
| 'head' | 'HEAD'
| 'options' | 'OPTIONS'
| 'post' | 'POST'
| 'put' | 'PUT'
| 'patch' | 'PATCH'
| 'link' | 'LINK'
| 'unlink' | 'UNLINK'

declare module 'vue/types/vue' {
    interface Vue {
        VIFRAME: VIFRAME,
        $state: State,
        // $message: ElMessage,
        // $confirm: ElMessageBoxShortcutMethod,
        $photo: {
            show: (options: {
                src?: string,
                bg?: string,
                elem?: Element,
                padding?: number
            })=> void
        },
        $api: {
            request: (method: Method, url: string, opts?: AxiosParams)=> Promise<any>,
            post: (url: string, opts?: AxiosParams)=> Promise<any>,
            get: (url: string, opts?: AxiosParams)=> Promise<any>
        },
        $bus: {
            register: (instance?: any)=> any;                               // 给某个对象注册监听，方便统一挂载和卸载页面的所有事件
            unregister: (instance?: any)=> any;
            on: (type: string, handler: any, instance?: any)=> any;
            once: (type: string, handler: any, instance?: any)=> any;
            emit: (type: string, ...params: any)=> any;
            stickyEmit: (type: string, ...params: any)=> any;               // 粘性发送事件，即已有注册则马上发送，否则记录起来等到有人注册了才发送
            off: (type: string, handler: any, instance?: any)=> any;
        }
    }
}

declare global {
    interface Window {
        dayjs: (date?: string | number | dayjs.Dayjs | Date | undefined, option?: string | {
            locale?: string | undefined;
            format?: string | undefined;
            utc?: boolean | undefined;
        } | undefined, locale?: string | undefined)=> dayjs.Dayjs;
        VPLUGINS: any;
        VEDITOR: any;
        WangEditor: any;
        webfunny: any;
        VDIALOG_INJECT: any;
        __loadAssetsList: (type: string, list: string[], callback: Function)=> any;
        __loadScript: (src: string, callback: Function)=> any;
        __loadCss: (src: string, callback: Function)=> any;
        __loadAssetsListFromCdn: (type: string, list: string[], callback: Function)=> any;
        __loadScriptFromCdn: (name: string, callback: Function)=> any;
        __loadCssFromCdn: (name: string, callback: Function)=> any;
        XLSX: {
            read: (data: any, opts?: ParsingOptions)=> WorkBook;
            utils: XLSX$Utils;
        };
        html2canvas: any;
    }
    namespace JSX {
        interface Element extends VNode {}
        interface ElementClass extends Vue {}
        interface IntrinsicElements {
            [elem: string]: any;
        }
    }
}

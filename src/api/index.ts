import Vue from 'vue';
import { Method } from 'axios';
import config from './config';

import {
    request,
    post,
    get,
    AxiosParams
} from './axios';
import { stateCommon } from '@/state';

let cacheJwt = '';

const setJwt = (jwt: string)=> {
    cacheJwt = jwt;
};

const authRequest = async (method: Method, url: string, opts?: AxiosParams)=> {
    const options = Object.assign({params: {}, headers: {}, data: {}, refresh: false}, opts);
    options.headers.Authorization = `Bear ${cacheJwt}`;
    return request(method, url, options);
};

const authGet = async (url: string, opts?: AxiosParams)=> {
    return authRequest('get', url, opts);
};

const authPost = async (url: string, opts?: AxiosParams)=> {
    return authRequest('post', url, opts);
};

const vGet = (url: string, opts?: AxiosParams) => {
    if (!opts) {
        opts = {};
    }
    if (!opts.params) {
        opts.params = {};
    }
    opts.params.activityId = stateCommon.urlQuery.id;
    return api.get(url, opts);
};

const vPost = (url: string, opts?: AxiosParams) => {
    if (!opts) {
        opts = {};
    }
    if (!opts.data) {
        opts.data = {};
    }
    opts.data.activityId = stateCommon.urlQuery.id;
    return api.post(url, opts);
};

const vAuthGet = (url: string, opts?: AxiosParams) => {
    if (!opts) {
        opts = {};
    }
    if (!opts.params) {
        opts.params = {};
    }
    opts.params.activityId = stateCommon.urlQuery.id;
    return api.authGet(url, opts);
};

const vAuthPost = (url: string, opts?: AxiosParams) => {
    if (!opts) {
        opts = {};
    }
    if (!opts.data) {
        opts.data = {};
    }
    if ('[object FormData]' === Object.prototype.toString.call(opts.data)) {
        opts.data.append('activityId', stateCommon.urlQuery.id);
    } else {
        opts.data.activityId = stateCommon.urlQuery.id;
    }
    return api.authPost(url, opts);
};

const api = {
    host: config.host,
    setJwt,
    request,
    post,
    get,
    authRequest,
    authGet,
    authPost,
    vGet,
    vPost,
    vAuthGet,
    vAuthPost
};

Vue.prototype.$api = api;

export default api;

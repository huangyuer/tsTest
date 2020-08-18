import config from './config';
import Axios, { Method, AxiosResponse } from 'axios';
import { md5 } from 'md5js';

export interface AxiosAnyObj {
    [key: string]: any;
}

export interface AxiosParams extends AxiosAnyObj {
    params?: AxiosAnyObj;
    data?: AxiosAnyObj;
    headers?: AxiosAnyObj;
    refresh?: boolean;
}

const axios = Axios.create({
    baseURL: config.host,
    headers: config.defaultHeaders,
    timeout: config.timeout
});

axios.interceptors.request.use(res=> {
    return res;
}, error=> {
    return Promise.reject(error);
});

axios.interceptors.response.use((response: AxiosResponse<any>)=> {
    return response;
}, error=> {
    console.log(error);
    return Promise.reject(error.response && error.response.data);
});

const cacheData: AxiosAnyObj = {};

const getMD5 = (method: Method, url: string, params: AxiosAnyObj, data: AxiosAnyObj, headers: AxiosAnyObj)=> {
    const str = method + '_' +
                url + '_' +
                Object.entries(params).map(([k, v])=> `${k}=${JSON.stringify(v)}`).sort().join('&') + '_' +
                Object.entries(data).map(([k, v])=> `${k}=${JSON.stringify(v)}`).sort().join('&') + '_' +
                Object.entries(headers).map(([k, v])=> `${k}=${JSON.stringify(v)}`).sort().join('&');
    return md5(encodeURI(str), 16);
};

const preDeal = async (md5Str: string, fn: Promise<AxiosResponse<any>>) => {
    return fn.then(res=> {
        return res.data;
    });
};

const request = async (method: Method, url: string, opts?: AxiosParams)=> {
    const options = Object.assign({params: {}, headers: {}, data: {}, refresh: false}, opts);
    return preDeal('', axios({
        url,
        method,
        params: options.params,
        data: options.data,
        headers: options.headers,
        ...opts
    }));
};

const get = async (url: string, opts?: AxiosParams)=> {
    return request('get', url, Object.assign({params: {}, data: {}, headers: {}, refresh: false}, opts));
};

const post = async (url: string, opts?: AxiosParams)=> {
    return request('post', url, Object.assign({params: {}, data: {}, headers: {}, refresh: false}, opts));
};

export {
    request,
    post,
    get
};

import Vue from 'vue';
import BaseModule from './base';
import api from '@/api/index';
import { ActivityConfig, Page } from '@/config';
import jwtDecode from 'jwt-decode';
import utils from '@/utils';
import Qrcode from '@/utils/qrcode.js';
import { stateActivity, stateGift, stateRaffle } from '..';

class Common extends BaseModule<{
    loading: boolean;
    userInfo: {
        id: string;
        name: string;
        role: string;
    } | null;
}> {
    /**
     * 链接中带的参数
     */
    public urlQuery: {[key: string]: any} = {};
    /**
     * 生成二维码
     */
    public qrcode: any = Qrcode;
    public constructor() {
        super({
            loading: false,
            userInfo: null
        });
        this.urlQuery = utils.loadUrlQuery(window.location.search);
    }

    public async login() {
        let jwt = this.urlQuery.jwt || localStorage.getItem('v:workbench:jwt') || 'eyJhbGciOiJIUzUxMiJ9.eyJkYXRhIjp7ImlkIjozLCJuYW1lIjoiY29kZWJlYXIiLCJwYXNzd29yZCI6IjdCQ0NGREU3NzE0QTFFQkFERjA2QzVGNENFQTc1MkMxIn0sImV4cCI6MTU5MjQ4MjI3Miwic3ViIjoiIn0.OK5G-u1_bf0I_PJNvJ4ZGqp28M0X0b67JtyMkoZT2qhBDOZjlV4BDaNdUWtiQhMPleLAyh3leQV3f6TMUPX0vw';

        try {
            let info = jwtDecode(jwt);
            this.data.userInfo = info.data;
            if (window.webfunny) {
                window.webfunny.wmInitUser(info.data.id, '1.0.0');
            }
        } catch(e) {
            console.log('jwt', e);
        }
        api.setJwt(jwt);
    }

    public async showLoading() {
        this.data.loading = true;
    }

    public async hideLoading() {
        this.data.loading = false;
    }
}

export default Common;

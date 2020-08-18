let host = 'http://3140rb8114.wicp.vip';
host = 'http://jego-micro-back-schedule.dev06.svc.cluster.local:3014/';
host = 'http://activity.via.cool:3014';
// host = 'http://192.168.1.189:3014/';
// host = 'http://47.91.213.107:3014';

if (process.env.VUE_APP_API_HOST) {
    host = process.env.VUE_APP_API_HOST;
}
// host = 'http://192.168.1.105:3014';

const defaultHeaders = {
    'Content-Type': 'application/json'
};

// 超时时间
const timeout = 10000;

export default {
    host,
    defaultHeaders,
    timeout
};

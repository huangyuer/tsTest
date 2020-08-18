import Vue from 'vue';
import Clipboard from 'clipboard';

export const isArray = (value: any) => {
    if (typeof Array.isArray === 'function') {
      return Array.isArray(value);
    }
    return Object.prototype.toString.call(value) === '[object Array]';
};



export const loadUrlQuery = (query: string): {[key: string]: any}=> {
  query = query.split('?')[1] || '';
  query = query.split('#')[0];
  if (!query) {
      return {};
  }
  return query.split('&')
              .map(item=> item.split('='))
              .reduce((pre, cur)=> {
                  const key = decodeURI(cur[0]);
                  let value = decodeURI(cur[1]);
                  try {
                      const obj = JSON.parse(value);
                      value = obj;
                  } catch(e) {
                      // console.log(e);
                  }
                  pre[key] = value;
                  return pre;
              }, {});
};

export const formatTime = (time: Date | string = new Date(), format: string = 'YYYY-MM-DD HH:mm:ss', convert: boolean = false)=> {
    let date = window.dayjs(time);
    if (date.toString() === 'Invalid Date') {
        date = window.dayjs();
    }

    if (convert) {
        const diff = date.diff(window.dayjs());
        if (diff < 30) {
            return '刚刚';
        } else if (diff < 3600) {
            return Math.floor(diff / 60) + '分钟前';
        } else if (diff < 3600 * 24) {
            return Math.floor(diff / 3600) + '小时前';
        } else if (diff < 3600 * 24 * 2) {
            return '1天前';
        }
    }
    return window.dayjs(date).format(format);
};

/**
 * 复制
 * @param text
 */
export const copyText = (text: string)=> {
    const dom = document.createElement('div');
    const clipboard = new Clipboard(dom, {
        text: () => text,
        action: ()=> 'copy'
    });
    clipboard.on('success', () => {
        Vue.prototype.$message.success('复制成功');
        clipboard.destroy();
    });
    clipboard.on('error', () => {
        Vue.prototype.$message.error('复制失败');
        clipboard.destroy();
    });
    dom.click();
};

/**
 * 深度合并对象
 * @param firstObj  被合并的对象，会改变对象本身
 * @param secondObj 合并进来的对象，会覆盖firstObj
 */
export const deepObjectMerge = (firstObj, secondObj)=> {
    const merge = (first, second)=> {
        if (second && second.toString() === '[object Object]') {
            for (let key in second) {
                if (first[key] && first[key].toString() === '[object Object]') {
                    first[key] = deepObjectMerge(first[key], second[key]);
                } else {
                    first[key] = second[key];
                }
            }
        }
        return first;
    };
    // 目的是为了避免传进来的firstObj被污染
    return merge(JSON.parse(JSON.stringify(firstObj)), secondObj);
};


export const strAddUnit = (value: string, unit: string = 'px')=> {
    const numberValue = Number(value);
    if (!isNaN(numberValue)) {
        value = numberValue + unit;
    }
    return value;
};



export const throttle = (func: () => void, delay: number)=> {
    let prev = Date.now();
    return () => {
        const now = Date.now();
        if (now - prev >= delay) {
            func();
            prev = Date.now();
        }
    };
};
export const uuid = ()=> {
    return window.dayjs().format('YYYYMMDDHHmmssSSS') + '-' + Math.floor(Math.random() * 10000000).toString().padStart(8, '0');
};

const utils = {
    isArray,
    loadUrlQuery,
    formatTime,
    uuid,
    copyText,
    deepObjectMerge,
    strAddUnit,
    throttle
};

Vue.prototype.$utils = utils;

export default utils;

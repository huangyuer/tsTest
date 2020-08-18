import Vue from 'vue';

/**
 * 通信用的到key
 */
export enum VIFRAME_KEY {
    CHANGE_CONFIG = 'change_config',                                // 配置改变
    CHANGE_PAGE = 'change_page',                                    // 页面改变
    CHANGE_PLUGIN_CONFIG = 'change_plugin_config',                  // 修改组件配置(后续废弃，使用批量接口)
    CHANGE_PLUGIN_CONFIGS = 'change_plugin_configs',                // 批量修改组件配置
    CHANGE_PAGE_CONFIG = 'change_page_config',                      // 修改页面配置(后续废弃，使用批量接口)
    CHANGE_PAGE_CONFIGS = 'change_page_configs',                    // 批量修改页面配置
    CHANGE_ACTIVITY_CONFIG = 'change_activity_config',              // 修改活动配置(后续废弃，使用批量接口)
    CHANGE_ACTIVITY_CONFIGS = 'change_activity_configs',            // 批量修改活动配置
    MOVE_PLUGIN = 'move_plugin',                                    // 移动组件---移动端向工作台发送的事件
    MOVE_PENDANT = 'move_pendant',                                  // 移动挂件---移动端向工作台发送的事件
    MOVE_PENDANT_END = 'move_pendant_end',                          // 移动挂件结束（鼠标离开之类的，触发数据的保存）---移动端向工作台发送的事件
    MOVE_INDEX = 'move_index',                                      // 组件位置交换
    LIFE_CYCLE = 'life_cycle',                                      // 生命周期---移动端向工作台发送的事件
    ACTIVE_PLUGIN = 'active_plugin',                                // 激活组件
    RESET_ACTIVE_PLUGIN = 'reset_active_plugin',                    // 重置激活组件
    ADD_PLUGIN = 'add_plugin',                                      // 添加组件
    DELETE_PLUGIN = 'delete_plugin',                                // 删除组件
    PREVIEW_PLUGIN_CONFIG = 'preview_plugin_config',                // 预览组件配置
    SHOW_DIALOG = 'show_dialog',                                    // 显示弹窗
    CHANGE_DIALOG_DATA = 'change_dialog_data',                      // 预览弹窗数据
    CLOSE_DIALOG = 'close_dialog',                                  // 关闭弹窗
    REFRESH = 'refresh',                                            // 刷新（通用，会依赖下面的key）
}

export enum REFRESH_KEY {
    RAFFLE_GIFT = 'raffle_key',                                     // 刷新奖品
    RAFFLE_DATA_VALUE = 'raffle_data_value',                        // 更新奖品data数据
}

/**
 * 通信数据结构
 */
export interface VIFRAMEDATA {
    from: 'VIFRAME';
    type: VIFRAME_KEY;
    data: any;
}

export class VIFRAME {

    private vue?: Vue;
    private iframe?: Window | null;

    constructor(vue: typeof Vue) {
        this.vue = new vue();
        // 监听message事件，并过滤掉非viframe的消息
        window.addEventListener('message', (ev: MessageEvent)=> {
            if (!ev.data) {
                return;
            }
            if (ev.data.from !== 'VIFRAME') {
                return;
            }
            console.log(ev.data.from, ev.data.type, ev.data.data);
            this.vue?.$emit(ev.data.type, ev.data.data);
        });
    }

    public init(iframe: Window | null) {
        this.iframe = iframe;
    }

    public on(key: VIFRAME_KEY, callback: (...data: any[])=> void) {
        this.vue?.$on(key, callback);
        return this;
    }

    public send(type: VIFRAME_KEY, data: any) {
        // 只需传入type和数据，统一组合加上from字段发送事件
        this.iframe?.postMessage({from: 'VIFRAME', type, data}, '*');
    }
}

export default {
    install: (vue: typeof Vue)=> {
        vue.prototype.VIFRAME = new VIFRAME(vue);
    }
};

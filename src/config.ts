export interface GlobalConfig {                     // 可能跟页面会差不多
    animation: string;                              // 页面切换动画
    backgroundColor: string;                        // 背景颜色
    backgroundImage: string;                        // 背景图片
    title: string;                                  // 页面标题
    themeColor: string;                             // 主题色
}

export interface PageConfig {                       // 页面配置
    animation: string;                              // 页面切换动画
    backgroundColor: string;                        // 背景颜色
    backgroundImage: string;                        // 背景图片
    title: string;                                  // 页面标题
}
export interface OutConfig {
    margin: {                                   // 组件边距
        left: string;
        right: string;
        top: string;
        bottom: string;
    };
    align: 'left' | 'right' | 'center';         // 水平方向对齐方式
    hidden: boolean;                            // 是否隐藏该组件
    backgroundColor: string;                    // 背景颜色
    backgroundImage: string;                    // 背景图片
    width: string;                              // 宽度
    height: string;                             // 高度
    border: {
        open: boolean;                          // 是否开启边框
        radius: {                               // 边框圆角
            topLeft: string;
            topRight: string;
            bottomLeft: string;
            bottomRight: string;
        };
        radiusType: 'number' | 'percentage';    // 圆角类型（百分比或固定大小）
    };
    shadow: {
        open: boolean;                          // 是否开启阴影
        h: string;                              // 水平阴影的位置
        v: string;                              // 垂直阴影的位置
        blur: string;                           // 模糊距离
        spread: string;                         // 阴影的大小
        color: string;                          // 阴影的颜色
        inset: boolean;                         // 是否内阴影
    };
}

export interface Plugin<C = any> {                  // 组件配置
    id: string;                                     // 组件id，命名规则plugin-xxx
    name: string;                                   // 组件名称
    zhName: string;                                 // 组件中文名
    tName: string;                                  // 组件类型名（同一组件多个类型）
    outConfig: OutConfig;
    config: C;                                      // 组件自身的配置
    deletable: boolean;                             // 是否可删除
}
export interface Pendant<C = any> extends Plugin<C> {   // 挂件配置
    mode: 'fixed' | 'dragable';                         // 模式（在移动端的表现），fixed固定位置，dragable可拖动
    wMode: 'fixed' | 'dragable' | 'changePos';          // 工作台的表现，fixed（固定），dragable可拖动，changePos可选择挂件位置
    alignH: 'left' | 'right';                           // 按左边边距算还是按右边边距算
    alignV: 'top' | 'bottom';                           // 按顶部边距算还是按底部边距算
    fixedType: 'fixed' | 'absolute';                    // 固定在屏幕或固定在页面上
    disabledChangeFixedType?: boolean;                  // 是否禁用切换固定方式
    position: {                                         // 位置，wMode为fixed时，string，加单位才会生效，
        left: string;                                   // 距离屏幕左边的距离（alignH为right时无效）
        right: string;                                  // 距离屏幕右边的距离（alignH为left时无效）
        top: string;                                    // 距离屏幕顶部的距离（align为bottom时无效）
        bottom: string;                                 // 距离屏幕底部的距离（align为top时无效）
    };
    pos: number;                                        // 挂件位置（-1: 随处拖动，0：左上角，1：左下角，2：右上角，3：右下角）
    showInScreen: number[];                             // 显示在第几屏（0：所有，1、2、3...）
    deletable: boolean;                                 // 是否可删除
}

export interface Dialog<C = any> {
    id: string;
    name: string;
    zhName: string;
    dialogName: string;
    config: C;
}

export interface Page {                             // 页面
    id: string;                                     // 页面id，命名规则page-xxx
    name: string;                                   // 页面名称
    zhName: string;                                 // 页面中文名
    config: PageConfig;                             // 页面配置
    plugins: Plugin[];                              // 页面组件
    pendants: Pendant[];                            // 页面挂件
    deletable: boolean;                             // 是否可删除
    isFristPage?: boolean;                          // 是否是首页（先显示，比如设置加载页等）
}

export interface PosterCommConfig {
    left: string;
    top: string;
    width: string;
    height: string;
    opacity: number;
    border: {
        open: boolean;
        radius: string;
        width: string;
        color: string;
    };
}

export interface PosterPluginConfig<T = any> {
    type: string;
    config: T;
    commConfig: PosterCommConfig;
    id: string;
    hidden: boolean;
    name: string;
}

export enum BackgrountRepeatType {
    repeat = 'repeat',
    noRepeat = 'no-repeat',
    repeatX = 'repeat-x',
    repeatY = 'repeat-y'
}

export enum BackgrountPositionType {
    topLeft = 'top left',
    topCenter = 'top center',
    topRight = 'top right',
    centerLeft = 'center left',
    center = 'center',
    centerRight = 'center right',
    bottomLeft = 'bottom left',
    bottomCenter = 'bottom center',
    bottomRight = 'bottom right'
}

export enum BackgroundSizeType {
    cover = 'cover',
    fill = 'fill',
    contain = 'contain',
    auto = 'auto'
}

export interface Poster {                           // 海报
    id: string;
    name: string;
    zhName: string;
    // pageId: string;
    // pluginId: string;
    outConfig: {
        width: string;
        height: string;
        border: {
            open: boolean;
            radius: string;
            width: string;
            color: string;
        };
        background: {
            color: string;
            image: string;
            repeat: BackgrountRepeatType;
            position: BackgrountPositionType;
            size: BackgroundSizeType;
        };
    };
    pluginList: PosterPluginConfig[];
}

export interface Tpl {
    name: string;                                   // 模板名称
    zhName: string;                                 // 模板中文名称
    enableLoadingPage?: boolean;                    // 是否启用加载页
    pages: Page[];                                  // 页面列表
    dialogs: Dialog[];                              // 弹窗列表
    posters: Poster[];                              // 海报列表
    posterAssociate?: Array<{                       // 海报关联数据
        posterId: string;
        dataList: Array<{
            type: 'plugin' | 'pendant' | 'dialog',  // 被关联的类型
            id: string,                             // 组件id或挂件id或弹窗id
            pageId: string;                         // 页面id
            tag: string;                            // 关联标记
            customData: {[key: string]: any};       // 组件的自定义参数（比如同一组件有不同地方会用到海报，就可以在这里标记）
        }>
    }>;
    rule: string;                                   // 活动规则
}

export interface ActivityConfig extends Tpl {
    id: string;                                     // 活动id，后端返回
    config: GlobalConfig;                           // 全局配置
}

export interface WorkbenchPuginItem<C extends Plugin> {
    type: 'plugin' | 'pendant';                     // 组件类型（普通组件、挂件）
    tplOnly?: boolean;                              // 是否模板独有
    tpl?: string;                                   // 属于哪个模板的
    allowCount?: number;                            // 允许添加的数量（限单页面）
    pages?: string[];                               // 属于哪个页面
    banner: string;                                 // 预览图片
    zhName: string;                                 // 名字
    tName: string;
    pluginName: string;                             // 组件名称
    classify?: string;                              // 组件分类
    json: C;
}

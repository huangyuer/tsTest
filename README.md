# front-workbench

前端工作台

## form组件使用文档

### 所有组件通用配置
```ts
disabled: boolean;                      // 是否禁用
required: boolean;                      // 是否必填（label前会显示红色的*）
labelAlign: 'start' | 'center' | 'end'; // 标签的对齐方式
labelWidth: string;                     // 标签的宽度，默认auto
label: string;                          // 标签名
width: string;                          // 整个组件的宽度
info?: {                                // 右边显示“？”，鼠标移过去会显示提示
    title: string;                      // 提示标题
    list: string[]                      // 提示内容（字符串列表）
};
```

使用方式
```tsx
<commLabelxxxxx
    v-model={value}                     // 所有组件都支持v-model
    config={{                           // 所有组件都通过config传递配置信息
        labelWidth: '100px',            // 标签宽度
        label: '背景颜色',               // 标签名
        ...
    }}
    onSave={()=> {               // 可保存数据（所有组件都有）
    }}
    onPreview={()=> {            // 预览数据（部分组件有）
    }}
    onClickOutside={()=> {       // 点击组件外部触发（部分组件有）
    }}
/>
```

### 各组件独立配置
以下只列出组件独有的配置项，其他看上面的通用配置

* 带标签的多项选择

    组件名称：commLabelCheckBox

    配置项：
    ```ts
    type Item = string | number | {         // v-model以及list每项的数据类型
        [key: string]: any,
        label: string
    };

    interface Config extends BaseConfig {
        list: Item[];                       // 列表
    }
    ```

---

* 带标签的颜色选择

    组件名称：commLabelColorPicker

    配置项：
    ```ts
    // v-model 传字符串（颜色值）

    interface Config extends BaseConfig {
        showAlpha: boolean;                 // 是否显示透明度
    }
    ```

---

* 带标签的日期选择

    组件名称：commLabelDateTimePicker

    配置项：
    ```ts
    // v-model 根据type类型不同，具体看element-ui文档

    interface Config extends BaseConfig {
        type: 'year' | 'month' | 'date' | 'dates' |  'week' | 'datetime' | 'datetimerange' | 'daterange' | 'monthrange';
        startPlaceholder: string;
        endPlaceholder: string;
        placeholder: string;
        format: string;                 // 日期格式化，具体看element-ui文档
    }
    ```

---

* 带标签的富文本编辑

    组件名称：commLabelEditor

    配置项：
    ```ts
    // v-model 传字符串

    interface Config extends BaseConfig {
        editorWidth: string;                        // 编辑器宽度
        editorHeight: string;                       // 编辑器高度
        maxVideoSize: number;                       // 上传的视频最大值
        maxImgSize: number;                         // 上传的图片最大值
        alignItem: 'center' | 'start' | 'end';      // 标签的对齐方式
    }
    ```

---

* 带标签的输入框

    组件名称：commLabelInput

    配置项：
    ```ts
    // v-model 传字符串

    interface Config extends BaseConfig {
        type: 'text' | 'number' | 'textarea';
        showControls: boolean;                  // type为number时有效，即输入框是否显示数字调整的控制按钮
        placeholder: string;
        append: string;                         // 输入框右边的后缀
        maxlength: '' | number;                 // 文本最大长度
        min: number;                            // 数字最小值
        max: number;                            // 数字最大值
        subTip?: {                              // 输入框底部提示
            tip: string;
            color: string
        };
        showInput: boolean;                     // 是否显示输入框（可能是选择文件）
        select?: {                              // 选择文件
            show: boolean;                      // 是否显示选择文件
            text: string;                       // 文案
            accept: string                      // 支持上传什么文件
        };
    }
    ```

---

* 带标签的音乐组件

    组件名称：commLabelMusic

    配置项：
    ```ts
    // v-model 传音乐链接

    interface Config extends BaseConfig {       // 无额外特殊配置
    }
    ```

---

* 带标签的单项选择

    组件名称：commLabelRadio

    配置项：
    ```ts
    type Item = string | number | {         // v-model以及list每项的数据类型
        [key: string]: any,
        label: string
    };

    interface Config extends BaseConfig {
        list: Item[];                       // 列表
    }
    ```

---

* 带标签的下拉选择

    组件名称：commLabelSelect

    配置项：
    ```ts
    type Item = string | number | {          // v-model以及list每项的数据类型
        [key: string]: any,
        label: string
    };

    interface Config extends BaseConfig {
        list: Item[];                       // 列表
        placeholder: string;
        clearable: boolean;                 // 是否显示清空按钮
    }
    ```

---

* 带标签的进度条滑块

    组件名称：commLabelSlider

    配置项：
    ```ts
    // v-model 传数字

    interface Config extends BaseConfig {
        min: number;                // 最小值
        max: number;                // 最大值
        step: number;               // 步长
    }
    ```

---

* 带标签的开关组件

    组件名称：commLabelSwitch

    配置项：
    ```ts
    // v-model boolean值

    interface Config extends BaseConfig {       // 无额外特殊配置
    }
    ```

---

* 带标签的图片上传

    组件名称：commLabelUpload

    配置项：
    ```ts
    // v-model 图片链接

    interface Config extends BaseConfig {
        alignItem: 'center' | 'start' | 'end';          // 标签对齐方式，labelPos为row时有效
        closeable: boolean;                             // 图片是否显示删除按钮
        labelPos: 'column' | 'row';                     // 标签排列方式，上下和左右排列
        height: string;                                 // 图片边框大小
        file: string[];                                 // 支持上传的文件格式
        minSize: number;                                // 图片最小值
        maxSize: number;                                // 图片最大值
        size: string;                                   // 图片尺寸提示，也可使用info字段来提示
        ableInput: boolean;                             // 是否显示输入框（可能有些图片还需要输入对应的文案）
        inputPlaceHolder: string;
        inputValue: string;                             // 输入框输入文案
    }
    ```
---
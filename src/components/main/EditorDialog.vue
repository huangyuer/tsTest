<script lang='tsx'>
import { Component, Vue, Watch, Prop } from 'vue-property-decorator';
import { CreateElement } from 'vue';
import { Page, Plugin, Pendant } from '@/config';
import { VIFRAME_KEY } from '@/VIFRAME';
import { stateCommon, stateUi } from '@/state/index';
import { PluginType } from '@/state/module/activity';

interface PluginItem<T extends Plugin> {
    name: string;
    plugin: T;
    type: PluginType;
}

@Component
export default class EditorDialog extends Vue {

    private get currentDialog() {
        return stateUi.data.currentDialog;
    }

    public render(h: CreateElement) {
        const editorName = 'WEditor' + this.currentDialog?.name;
        return (
            <div class='editor-plugin'>
                <p class='config-title'>{this.currentDialog?.zhName}-配置</p>
                <editorName props={{plugin: JSON.parse(JSON.stringify(this.currentDialog))}} />
            </div>
        );
    }

}

</script>

<style lang="less">
.editor-plugin {
    position: relative;
    overflow: scroll;
    background-color: white;
    box-sizing: border-box;
    > .page-title {
        text-align: left;
        padding: 8px 15px;
        font-weight: bold;
        font-size: 14px;
        border-bottom: 1px dashed #eeeeee;
    }
    .config-title {
        text-align: left;
        padding: 8px 15px;
        font-weight: bold;
        font-size: 12px;
        border-bottom: 1px dashed #eeeeee;
        border-left: 4px solid #589ef8;
    }
    > .page-config {
        padding: 8px 15px;
        > .line {
            padding: 8px 0;
            display: flex;
        }
    }
    .editor-content {
        padding: 8px 15px;
        > .line {
            display: flex;
        }
    }
}
</style>
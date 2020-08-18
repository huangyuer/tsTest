import { PosterPluginConfig } from '@/config';

export interface TextareaConfig {
    text: string;
}

const json: PosterPluginConfig<TextareaConfig> = {
    id: '',
    hidden: false,
    name: '富文本',
    type: 'textarea',
    commConfig: {
        left: '0',
        top: '0',
        width: '200',
        height: '200',
        opacity: 1,
        border: {
            open: false,
            radius: '',
            width: '',
            color: '#ffffff'
        }
    },
    config: {
        text: '富文本'
    }
};

export default [json];

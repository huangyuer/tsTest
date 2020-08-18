import { PosterPluginConfig } from '@/config';

export interface TextConfig {
    text: string;
    fontSize: string;
    color: string;
    fontWeight: string;
    lineHeight: string;
    letterSpacing: string;
    fontClass: {
        name: string;
        value: string;
    };
    fontStyle: string;
    textDecoration: Array<'none' | 'underline' | 'overline' | 'line-through'>;
    textAlign: 'left' | 'center' | 'top';
}

const json: PosterPluginConfig<TextConfig> = {
    id: '',
    hidden: false,
    name: '文案',
    type: 'text',
    commConfig: {
        left: '0',
        top: '0',
        width: '200',
        height: '24',
        opacity: 1,
        border: {
            open: false,
            radius: '',
            width: '',
            color: '#ffffff'
        }
    },
    config: {
        text: '文案',
        fontSize: '24',
        color: '#000000',
        fontWeight: 'normal',
        lineHeight: '1.2b',
        letterSpacing: '0',
        fontClass: {
            name: '默认字体',
            value: ''
        },
        fontStyle: 'normal',
        textDecoration: [],
        textAlign: 'left'
    }
};

export default [json];

import { PosterPluginConfig } from '@/config';
import utils from '@/utils';

export interface SimpleShapeConfig {
    backgroundColor: string;
}

const defaultJson: PosterPluginConfig<SimpleShapeConfig> = {
    id: '',
    hidden: false,
    name: '简单图形',
    type: 'simpleShape',
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
        backgroundColor: '#000000'
    }
};

const list = [
    utils.deepObjectMerge(defaultJson, {
        name: '圆形',
        commConfig: {
            border: {
                open: true,
                radius: '100%'
            }
        }
    }),
    utils.deepObjectMerge(defaultJson, {
        name: '矩形',
    }),
    utils.deepObjectMerge(defaultJson, {
        name: '圆角矩形',
        commConfig: {
            border: {
                open: true,
                radius: '20'
            }
        }
    }),
    utils.deepObjectMerge(defaultJson, {
        name: '线条',
        commConfig: {
            height: '2'
        }
    }),
];

export default list;

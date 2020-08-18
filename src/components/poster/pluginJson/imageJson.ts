import { PosterPluginConfig } from '@/config';

export interface ImageConfig {
    url: string;
}

const json: PosterPluginConfig<ImageConfig> = {
    id: '',
    hidden: false,
    name: '图片',
    type: 'image',
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
        url: 'https://cdn.via.cool/jtp-host/resource/activity/714/2020-07-06/cb0bbf7a9bc44326b8c1a964dad8b9c8'
    }
};

export default [json];

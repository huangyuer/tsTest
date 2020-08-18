const path = require('path');
const InjectTplAssetsPlugin = require('../InjectTplAssetsPlugin');
const resolve = (p)=> path.resolve(p);

module.exports = {
    publicPath: '/',
    configureWebpack: {
        entry: {
            app: [resolve('src/mock.ts'), resolve('src/main.ts')]
        },
        externals: {
            'vue': 'Vue',
            'element-ui': 'element-ui',
            'xlsx': 'xlsx'
        },
        plugins: [
            new InjectTplAssetsPlugin()
        ]
    },
    parallel: require('os').cpus().length > 1,
    productionSourceMap: true,
    css: {
        // 是否使用css分离插件 ExtractTextPlugin
        // 提取 CSS 在开发环境模式下是默认不开启的，因为它和 CSS 热重载不兼容。
        extract: false,
        sourceMap: true,
        // 启用 CSS modules for all css / pre-processor files.
        requireModuleExtension: false
    },
    chainWebpack: config => {
        config.plugin('html')
            .tap(args=> {
                // 定义html文件中需要用到的一些数据
                const htmlParams = {
                    production: false,
                    mode: 'dev',
                    cdnUrl: process.env.VUE_APP_CDN_URL
                };
                Object.assign(args[0], htmlParams);
                return args;
            });
    },
}
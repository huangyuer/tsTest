const path = require('path');
const JsCss2JsonPlugin = require('../JsCss2JsonPlugin');

const resolve = (p)=> path.resolve(p);

module.exports = {
    publicPath: process.env.VUE_APP_CDN_URL + '/workbench/',
    outputDir: 'dist/jtp-prod/',
    configureWebpack: {
        entry: {
            app: [resolve('src/main.ts')]
        },
        externals: {
            vue: 'Vue',
            'element-ui': 'element-ui'
        },
        plugins: [
            new JsCss2JsonPlugin()
        ]
    },
    parallel: require('os').cpus().length > 1,
    productionSourceMap: false,
    css: {
        // 是否使用css分离插件 ExtractTextPlugin
        // 提取 CSS 在开发环境模式下是默认不开启的，因为它和 CSS 热重载不兼容。
        extract: true,
        sourceMap: false,
        // 启用 CSS modules for all css / pre-processor files.
        requireModuleExtension: false
    },
    chainWebpack: config => {
        config.plugin('html')
            .tap(args=> {
                // 定义html文件中需要用到的一些数据
                const htmlParams = {
                    production: true,
                    inject: false,
                    cdnUrl: process.env.VUE_APP_CDN_URL
                };
                Object.assign(args[0], htmlParams);
                return args;
            });
    },
}
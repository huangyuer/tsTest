const path = require('path');
const DealHtmlPlugin = require('../DealHtmlPlugin');

const resolve = (p)=> path.resolve(p);

module.exports = {
    configureWebpack: {
        mode: 'development',
        entry: {
            app: resolve('src/main.ts')
        },
        externals: {
            vue: 'Vue',
            'element-ui': 'element-ui'
        },
        plugins: [
            new DealHtmlPlugin()
        ]
    },
    publicPath: '/workbench-preview/',
    outputDir: 'dist/workbench-preview/',
    parallel: require('os').cpus().length > 1,
    productionSourceMap: true,
    css: {
        // 是否使用css分离插件 ExtractTextPlugin
        // 提取 CSS 在开发环境模式下是默认不开启的，因为它和 CSS 热重载不兼容。
        extract: true,
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
                    mode: 'forPlugin',
                    cdnUrl: process.env.VUE_APP_CDN_URL
                };
                Object.assign(args[0], htmlParams);
                return args;
            });
    },
}
const fs = require('fs');
const path = require('path');
const minify = require('html-minifier').minify;
const md5 = require('md5js').md5;

/**
 * dev模式使用
 */
class InjectTplAssetsPlugin {
    constructor(options) {
    }

    apply(compiler) {
        compiler.hooks.emit.tapAsync('InjectTplAssetsPlugin', (compilation, callback)=> {
            const publicPath = compiler.context;
            let pluginFile  = fs.readdirSync(publicPath + '/public/plugin');
            pluginFile = pluginFile.map(item=> `plugin/${item}`);
            const extensionRegexp = /\.(css|js)(\?|$)/;
            let content = '';
            pluginFile.forEach(fileName=> {
                const extMatch = extensionRegexp.exec(fileName);
                if (!extMatch) {
                    return;
                }
                if (extMatch[1] === 'css') {
                    content += `<link rel="stylesheet" href="/${fileName}"></link>`;
                } else {
                    content += `<script src="/${fileName}"></script>`;
                }
            })
            let html = compilation.assets['index.html'].source();
            html = html.replace('<noscript>inject plugin assets</noscript>', content);
            compilation.assets['index.html'] = {
                source: ()=> html,
                size: ()=> html.length
            }
            callback();
        });
    }
}

module.exports = InjectTplAssetsPlugin;
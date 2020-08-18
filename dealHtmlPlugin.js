const fs = require('fs');
const minify = require('html-minifier').minify;

class DealHtmlPlugin {
    constructor() {
        this.distPath = '';
    }

    change() {
        if (this.distPath.length && this.distPath.substr(-1, 1) !== '/') {
            this.distPath += '/';
        }
        const htmlPath = this.distPath + 'index.html';
        let content = fs.readFileSync(htmlPath, 'utf-8');
        fs.writeFileSync(htmlPath, content.replace('</body>', '').replace('<!-- built files will be auto injected -->', '<!-- built files will be auto injected --></body>'));
    }
    
    apply(compiler) {
        compiler.hooks.afterEmit.tapAsync('JsCss2JsonPlugin', (compilation, callback)=> {
            this.distPath = compilation.mainTemplate.outputOptions.path;
            this.change();
            callback();
        });
    }
}

module.exports = DealHtmlPlugin;
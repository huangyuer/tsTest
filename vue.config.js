const path = require('path');
const fs = require('fs');

const configFile = process.env.CONFIG_FILE;
if (!configFile) {
    throw '没有指定配置文件';
}

const configFilePath = path.resolve(`config/${configFile}`);
console.log(`从${configFilePath}读取配置文件`);

if (!fs.existsSync(configFilePath)) {
    throw '配置文件不存在';
}
module.exports = require(configFilePath);
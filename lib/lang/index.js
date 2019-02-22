module.exports = function () {
    const filetool = require('../utils/filetool');
    const fs = require('fs');
    const _ = require('underscore');
    require('colors');

    return {

        extract: function (cfg) {
            const srcPath = cfg.srcPath;
            const outputPath = cfg.outputPath;
            const keyArray = this.getKeyArray(srcPath);
            const keyfile = process.cwd() + '/' + outputPath + '/keys';
            let exsitKeys = [];

            if (filetool.isFile(keyfile)) {
                exsitKeys = fs.readFileSync(keyfile, 'utf-8').split('\n');
            }

            const difference = _.difference(keyArray, exsitKeys);

            const result = exsitKeys.concat('=============== 新增key（' + (new Date().toLocaleString()) + '）=============== ').concat(difference).join('\n');

            filetool.writefile(keyfile, result);
            console.log('多语言keys已生成:'.green + ' ==========> ' + (keyfile).yellow);
        },

        getKeyArray: function (srcPath) {
            // const langKeyExp = /lang\.template\(\s*?['"]+((\\.|.)*?)['"]\)/gi;
            const langKeyExp = /lang\.template\(\s*?['"]+((\\.|.)*?)['"][\)\s*,]/gi;

            const jsfiles = filetool.walker(process.cwd() + '/' + srcPath);
            const result = [];

            jsfiles.forEach(function (item) {
                // console.log(1)
                const file = fs.readFileSync(item, 'utf-8');
                const keys = [];
                file.replace(langKeyExp, function ($1, $2) {
                    if (result.indexOf($2) === -1) {
                        result.push($2);
                        keys.push($2);
                    }
                });

                //  按照文件输出，这样在谷歌文档上录入的时候看到是那个文件了，有助于翻译人员进行定位
                //  console.log($2.gray);
                if (keys.length) {
                    console.log(item.red);
                    keys.forEach(function (k) {
                        console.log(k.gray);
                    });
                }
            });

            return result;
        }
    };
};

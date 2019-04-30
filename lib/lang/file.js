/**
 * 导出多语言文件
 */
module.exports = function() {
    const Promise = require('bluebird');
    const fs = require('fs');
    const stringify = require('json-stable-stringify');
    const filetool = require('../utils/filetool');
    const lang = require('./index');
    const axios = require('axios');
    let exsitKeys = [];

    return {
        main: function(cfg) {
            const self = this;
            const split = cfg.split;
            const cwd = process.cwd();
            const package = require(cwd + '/package.json');
            const spreadsheetId = package.googleSpreadsheetId;
            const googleWorksheet = package.googleWorksheet || 0; // 从0开始
            const fileContent = package.googleFileExport || 'module.exports';

            exsitKeys = lang().getKeyArray();

            console.log('\n\n');
            console.log('正在拉取文案，请稍后...');
            console.log('keys:' + exsitKeys.length);

            if (cfg.multi) {
                for (let entername in googleWorksheet) {

                    (function() {
                        const _entername = entername;
                        const sheetTitle = googleWorksheet[entername];

                        self.spreadsheetToJson({
                                spreadsheetId: spreadsheetId,
                                worksheet: sheetTitle
                            })
                            .then(function(res) {
                                // 获取JSON数据
                                // TODO 导出到指定的文件目录中
                                self.save(res, fileContent, cfg, _entername);
                            })
                            .catch(function(err) {
                                console.log(err);
                            });
                    })();
                }
                return;
            }
            if (spreadsheetId) {
                this.spreadsheetToJson({
                        spreadsheetId: spreadsheetId,
                        worksheet: googleWorksheet
                    })
                    .then(function(res) {
                        // 获取JSON数据
                        // TODO 导出到指定的文件目录中
                        self.save(res, fileContent, cfg);
                    })
                    .catch(function(err) {
                        console.log(err);
                    });
            } else {
                console.log('googleSpreadsheetId未配置，请在package.json中进行配置'.red);
            }
        },

        save: function(data, fileContent, cfg, entername) {
            const outputPath = cfg.outputPath;
            const gsfile = process.cwd() + '/' + outputPath + '/' + (entername ? (entername + '/') : '') + 'pack.js';
            const split = cfg.split;

            let content = stringify(data, { space: '    ' });

            content = fileContent + '=' + content;

            filetool.writefile(gsfile, content);

            // console.log('++++++++++++++++++++++++++++++++', split);
            if (split) {
                this.splitFile(content, gsfile, fileContent);
            }
            console.log('多语言文件已生成:'.green + ' ==========> ' + (gsfile).yellow);

            console.log('正在检查多语言翻译结果，请稍后...');

            this.check(content, fileContent);
        },

        /**
         * 验证google是否有不匹配的key
         * 1、google中哪种语言，哪个key没有被翻译
         * 2、google中缺少哪个key
         * 3、google中哪个key在代码中没有被使用
         */
        check: function(content, fileContent) {

            content = JSON.parse(content.replace(fileContent + '=', ''));

            for (let i in content) {
                let data = content[i];
                let list = [...exsitKeys];
                let remains = [];

                for (let j in data) {
                    let idx = list.indexOf(j + '');

                    if (idx > -1) {
                        list.splice(idx, 1)
                    } else {
                        remains[remains.length] = j.gray;
                    }
                }

                console.log('========================== ' + i + ' ========================')
                console.log('--- Google中多余的keys：' + remains.length + '个，极客精神，可适当优化');
                console.log('--- Google中缺少或未翻译的keys: ' + list.length + '个 ===> ');
                console.log(list.length > 0 ? list.join('\n').red : 'very good，多语言全部完成啦');
            }
        },

        splitFile: function(content, _path, fileContent) {
            content = JSON.parse(content.replace(fileContent + '=', ''));
            let itemPath;

            for (let i in content) {
                itemPath = _path.replace('pack', i);
                // console.log(content[i])
                filetool.writefile(itemPath, fileContent + '=' + stringify(content[i], {
                    space: '    '
                }) + ';');
                console.log('多语言文件已生成:' + ' ==========> ' + (itemPath));
            }
        },

        spreadsheetToJson: function(options) {

            return new Promise((resolve) => {
                axios.post('http://3.0.235.100/dev/lang/pack', {
                    id: options.spreadsheetId,
                    sheets: options.worksheet.join('|~~~@__@~~~|')
                }).then(({data}) => {
                    if (data.code === 0) {
                        return resolve(data.data);
                    }
                    return resolve({});
                });
            });
        },
    };
};
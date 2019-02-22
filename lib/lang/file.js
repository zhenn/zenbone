/**
 * 导出多语言文件
 */
module.exports = function() {
    const Promise = require('bluebird');
    const fs = require('fs');
    const stringify = require('json-stable-stringify');
    const filetool = require('../utils/filetool');
    const lang = require('./index');
    let exsitKeys = [];

    const languages = [
        'zh-CN', 'zh-TW', 'zh', 'zh-HK', 'ar', 'ar-EG', 'vi', 'vi-VN', 'en', 'en-US',
        'fr-FR', 'fr', 'ko-KR', 'ko', 'ru-RU', 'ru', 'ja-JP', 'ja', 'ar-SA', 'bg', 'bg-BG',
        'hr-HR', 'hr', 'cs-CZ', 'cs', 'da-DK', 'da', 'nl-NL', 'nl', 'et-EE', 'et', 'fi-FI', 'fi',
        'de-DE', 'de', 'el-GR', 'el', 'he-IL', 'he', 'hu-HU', 'hu', 'it-IT', 'it', 'lv-LV',
        'nb-NO', 'nb', 'pl-PL', 'pl', 'pt-BR', 'pt', 'pt-PT', 'ro-RO', 'ro', 'sr-Latn-CS',
        'sk-SK', 'sk', 'sl-SI', 'sl', 'es-ES', 'es', 'sv-SE', 'sv', 'th-TH', 'th', 'tr-TR', 'tr',
        'uk-UA', 'uk', 'yo-NG', 'yo', 'cy-GB', 'cy', 'uz-Latn-UZ', 'ur-PK', 'ur', 'te-IN', 'te',
        'tt-RU', 'tt', 'ta-IN', 'ta', 'si-LK', 'si', 'tn-ZA', 'tn', 'nso-ZA', 'sr-Cyrl-CS',
        'quz-PE', 'quz', 'pa-IN', 'pa', 'fa-IR', 'fa', 'or-IN', 'or', 'nn-NO', 'nn', 'ne-NP', 'ne',
        'mr-IN', 'mr', 'mi-NZ', 'mi', 'mt-MT', 'mt', 'ml-IN', 'ml', 'ms-MY', 'ms', 'ms-BN',
        'mk-MK', 'mk', 'lb-LU', 'lb', 'ky-KG', 'ky', 'kok-IN', 'kok', 'sw-KE', 'sw', 'km-KH', 'km',
        'kk-KZ', 'kk', 'kn-IN', 'kn', 'zu-ZA', 'zu', 'xh-ZA', 'xh', 'ga-IE', 'ga', 'iu-Latn-CA', 'iu',
        'id-ID', 'id', 'ig-NG', 'ig', 'is-IS', 'is', 'hi-IN', 'hi', 'ha-Latn-NG', 'gu-IN', 'gu',
        'ka-GE', 'ka', 'gl-ES', 'gl', 'fil-PH', 'fil', 'ca-ES', 'ca', 'bs-Latn-BA', 'bs', 'bs-Cyrl-BA',
        'bn-IN', 'bn-BD', 'bn', 'eu-ES', 'eu', 'az-Latn-AZ', 'as-IN', 'as', 'hy-AM', 'hy', 'am-ET', 'am',
        'sq-AL', 'sq', 'af-ZA', 'af',
    ];

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
                                vertical: true,
                                hash: 'key',
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
                        vertical: true,
                        hash: 'key',
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

        cellsToJson: function(cells, options) {
            options = options || {};

            const rowProp = options.vertical ? 'col' : 'row';
            const colProp = options.vertical ? 'row' : 'col';
            const isHashed = options.hash && !options.listOnly;
            const includeHeaderAsValue = options.listOnly && options.includeHeader;
            const finalList = isHashed ? {} : [];

            // organizing (and ordering) the cells into arrays

            const rows = cells.reduce(function(rows, cell) {
                const rowIndex = cell[rowProp] - 1;

                if (typeof rows[rowIndex] === 'undefined') {
                    rows[rowIndex] = [];
                }
                rows[rowIndex].push(cell);
                return rows;
            }, []);

            const cols = cells.reduce(function(cols, cell) {
                const colIndex = cell[colProp] - 1;

                if (typeof cols[colIndex] === 'undefined') {
                    cols[colIndex] = [];
                }
                cols[colIndex].push(cell);
                return cols;
            }, []);

            // find the first row with data to use it as property names
            let firstRowIndex = 0;
            for (; firstRowIndex < rows.length; firstRowIndex++) {
                if (rows[firstRowIndex]) {
                    break;
                }
            }

            // creating the property names map (to detect the name by index)
            const properties = (rows[firstRowIndex] || []).reduce(function(properties, cell) {
                if (typeof cell.value !== 'string' || cell.value === '') {
                    return properties;
                }

                properties[cell[colProp]] = (cell.value || '').trim();

                return properties;
            }, {});

            // removing first rows, before and including (or not) the one that is used as property names
            rows.splice(0, firstRowIndex + (includeHeaderAsValue ? 0 : 1));

            // iterating through remaining row to fetch the values and build the final data object

            rows.forEach(function(cells) {

                const newObject = options.listOnly ? [] : {};
                let hasValues = false;

                cells.forEach(function(cell) {
                    let val;
                    const colNumber = cell[colProp];
                    // console.log(cell);
                    if (!options.listOnly && !properties[colNumber]) {
                        return;
                    }

                    if (typeof cell.numericValue !== 'undefined') {
                        val = parseFloat(cell.numericValue);
                        hasValues = true;
                    } else if (cell.value === 'TRUE') {
                        val = true;
                        hasValues = true;
                    } else if (cell.value === 'FALSE') {
                        val = false;
                        hasValues = true;
                    } else if (cell.value !== '' && typeof cell.value !== 'undefined') {
                        val = cell.value;
                        hasValues = true;
                    }

                    if (properties[colNumber] == options.hash) {
                        newObject[options.hash] = val;
                    } else {
                        if (!newObject.data) {
                            newObject.data = {};
                        }
                        if (options.listOnly) {
                            newObject['data'][colNumber - 1] = val;
                        } else {
                            // 过滤多余的key, key为英文不被过滤
                            // let english = /^[A-Za-z]+$/.test(properties[colNumber]);

                            // if (!english && exsitKeys.indexOf(properties[colNumber]) == -1) {
                            //     return;
                            // }

                            newObject['data'][properties[colNumber]] = val;
                        }
                    }
                });


                if (hasValues) {
                    if (isHashed) {
                        let key = newObject[options.hash];

                        if (languages.indexOf(key) > -1) {
                            key = key.replace('-', '').toLowerCase();
                            finalList[key] = newObject.data;
                        } else {
                            return;
                        }

                    } else {
                        finalList.push(newObject);
                    }
                }
            });

            return finalList;
        },

        spreadsheetToJson: function(options) {
            const self = this;

            return this.getWorksheets(options)
                .then(function(worksheets) {
                    const identifiers = normalizeWorksheetIdentifiers(options.worksheet);

                    let selectedWorksheets = worksheets.filter(function(worksheet, index) {
                        return identifiers.indexOf(index) !== -1 || identifiers.indexOf(worksheet.title) !== -1;
                    });

                    // if an array is not passed here, expects only first result
                    if (!Array.isArray(options.worksheet)) {
                        selectedWorksheets = selectedWorksheets.slice(0, 1);
                        if (selectedWorksheets.length === 0) {
                            throw new Error('No worksheet found!');
                        }
                    }

                    return selectedWorksheets;
                })
                .then(function(worksheets) {
                    return Promise.all(worksheets.map(function(worksheet) {
                        return worksheet.getCellsAsync();
                    }));
                })
                .then(function(results) {
                    const finalList = results.map(function(cells) {
                        return self.cellsToJson(cells, options);
                    });

                    if (Array.isArray(options.worksheet)) {
                        const result = {};
                        for (let i = finalList.length; i--;) { // 前面的sheet覆盖后面
                            const finalListItem = finalList[i];

                            for (const key in finalListItem) {
                                const value = finalListItem[key];

                                if (result[key]) {
                                    result[key] = MergeRecursive(result[key], value);
                                } else {
                                    result[key] = value;
                                }
                            }
                        }
                        return result;
                    } else {
                        return finalList[0];
                    }
                });
        },

        getWorksheets: function(options) {
            const GoogleSpreadSheet = require('google-spreadsheet');
            return Promise.try(function() {

                    const spreadsheet = Promise.promisifyAll(new GoogleSpreadSheet(options.spreadsheetId));

                    if (options.token) {

                        spreadsheet.setAuthToken({
                            value: options.token,
                            type: options.tokentype || 'Bearer'
                        });

                    } else if (options.user && options.password) {

                        return spreadsheet.setAuthAsync(options.user, options.password).return(spreadsheet);

                    }
                    return spreadsheet;
                })
                .then(function(spreadsheet) {
                    return spreadsheet.getInfoAsync();
                })
                .then(function(sheetInfo) {
                    return sheetInfo.worksheets.map(function(worksheet) {
                        return Promise.promisifyAll(worksheet);
                    });
                });
        }
    };

    function MergeRecursive(obj1, obj2) {

        for (let p in obj2) {
            try {
                // Property in destination object set; update its value.
                if (obj2[p].constructor === Object) {
                    obj1[p] = MergeRecursive(obj1[p], obj2[p]);

                } else {
                    obj1[p] = obj2[p];

                }
            } catch (e) {
                // Property in destination object not set; create it and set its value.
                obj1[p] = obj2[p];

            }
        }

        return obj1;
    }

    function normalizeWorksheetIdentifiers(option) {

        if (typeof option === 'undefined') {
            return [0];
        }

        if (!Array.isArray(option)) {
            return [option];
        }

        return option;
    }
};
/**
 * 导出多语言文件
 */
module.exports = function () {
    const Promise = require('bluebird');
    const stringify = require('json-stable-stringify');

    let filetool = null;

    const languages = [
        'zh-CN', 'zh-TW', 'zh-HK', 'ar-EG', 'vi-VN', 'en-US',
        'fr-FR', 'ko-KR', 'ru-RU', 'ja-JP', 'ar-SA', 'bg-BG',
        'hr-HR', 'cs-CZ', 'da-DK', 'nl-NL', 'et-EE', 'fi-FI',
        'de-DE', 'el-GR', 'he-IL', 'hu-HU', 'it-IT', 'lv-LV',
        'nb-NO', 'pl-PL', 'pt-BR', 'pt-PT', 'ro-RO', 'sr-Latn-CS',
        'sk-SK', 'sl-SI', 'es-ES', 'sv-SE', 'th-TH', 'tr-TR',
        'uk-UA', 'yo-NG', 'cy-GB', 'uz-Latn-UZ', 'ur-PK', 'te-IN',
        'tt-RU', 'ta-IN', 'si-LK', 'tn-ZA', 'nso-ZA', 'sr-Cyrl-CS',
        'quz-PE', 'pa-IN', 'fa-IR', 'or-IN', 'nn-NO', 'ne-NP',
        'mr-IN', 'mi-NZ', 'mt-MT', 'ml-IN', 'ms-MY', 'ms-BN',
        'mk-MK', 'lb-LU', 'ky-KG', 'kok-IN', 'sw-KE', 'km-KH',
        'kk-KZ', 'kn-IN', 'zu-ZA', 'xh-ZA', 'ga-IE', 'iu-Latn-CA',
        'id-ID', 'ig-NG', 'is-IS', 'hi-IN', 'ha-Latn-NG', 'gu-IN',
        'ka-GE', 'gl-ES', 'fil-PH', 'ca-ES', 'bs-Latn-BA', 'bs-Cyrl-BA',
        'bn-IN', 'bn-BD', 'eu-ES', 'az-Latn-AZ', 'as-IN', 'hy-AM', 'am-ET',
        'sq-AL', 'af-ZA'
    ];

    return {
        main: function (cfg) {
            const self = this;
            const split = cfg.split;
            const cwd = process.cwd();
            const package = require(cwd + '/package.json');
            const spreadsheetId = package.googleSpreadsheetId;
            const googleWorksheet = package.googleWorksheet || 0; // 从0开始
            const fileContent = package.googleFileExport || 'module.exports';

            console.log('正在拉取文案，请稍后...');

            filetool = require('../utils/filetool');

            if (cfg.multi) {
                for (let entername in googleWorksheet) {
                    (function () {
                        const _entername = entername;
                        const sheetTitle = googleWorksheet[entername];
                        self.spreadsheetToJson({
                            spreadsheetId: spreadsheetId,
                            vertical: true,
                            hash: 'key',
                            worksheet: sheetTitle
                        })
                            .then(function (res) {
                                // 获取JSON数据
                                // TODO 导出到指定的文件目录中
                                self.save(res, fileContent, cfg, _entername);
                            })
                            .catch(function (err) {
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
                    .then(function (res) {
                        // 获取JSON数据
                        // TODO 导出到指定的文件目录中
                        self.save(res, fileContent, cfg);
                    })
                    .catch(function (err) {
                        console.log(err);
                    });
            } else {
                console.log('googleSpreadsheetId未配置，请在package.json中进行配置'.red);
            }
        },

        save: function (data, fileContent, cfg, entername) {
            const gsfile = process.cwd() + '/js/lang/' + (entername ? (entername + '/') : '') + 'pack.js';
            const split = cfg.split;

            let content = stringify(data, {space: '    '});

            content = fileContent + '=' + content;

            filetool.writefile(gsfile, content);

            // console.log('++++++++++++++++++++++++++++++++', split);
            if (split) {
                this.splitFile(content, gsfile);
            }
            console.log('多语言文件已生成:'.green + ' ==========> ' + (gsfile).yellow);
        },

        splitFile: function (content, _path) {
            content = JSON.parse(content.replace('module.exports=', ''));
            let itemPath;
            for (let i in content) {
                itemPath = _path.replace('pack', i);
                // console.log(content[i])
                filetool.writefile(itemPath, 'module.exports=' + stringify(content[i], {
                    space: '    '
                }) + ';');
            }
        },

        cellsToJson: function (cells, options) {
            options = options || {};

            const rowProp = options.vertical ? 'col' : 'row';
            const colProp = options.vertical ? 'row' : 'col';
            const isHashed = options.hash && !options.listOnly;
            const includeHeaderAsValue = options.listOnly && options.includeHeader;
            const finalList = isHashed ? {} : [];

            // organizing (and ordering) the cells into arrays

            const rows = cells.reduce(function (rows, cell) {
                const rowIndex = cell[rowProp] - 1;

                if (typeof rows[rowIndex] === 'undefined') {
                    rows[rowIndex] = [];
                }
                rows[rowIndex].push(cell);
                return rows;
            }, []);

            const cols = cells.reduce(function (cols, cell) {
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

            const properties = (rows[firstRowIndex] || []).reduce(function (properties, cell) {
                if (typeof cell.value !== 'string' || cell.value === '') {
                    return properties;
                }

                properties[cell[colProp]] = (cell.value || '').trim();

                return properties;
            }, {});

            // removing first rows, before and including (or not) the one that is used as property names
            rows.splice(0, firstRowIndex + (includeHeaderAsValue ? 0 : 1));

            // iterating through remaining row to fetch the values and build the final data object

            rows.forEach(function (cells) {

                const newObject = options.listOnly ? [] : {};
                let hasValues = false;

                cells.forEach(function (cell) {
                    let val;
                    const colNumber = cell[colProp];

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
                            newObject['data'][properties[colNumber]] = val;
                        }
                    }
                });

                if (hasValues) {
                    if (isHashed) {
                        let key = newObject[options.hash];
                        console.log(key);
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

        spreadsheetToJson: function (options) {
            const self = this;

            return this.getWorksheets(options)
                .then(function (worksheets) {
                    const identifiers = normalizeWorksheetIdentifiers(options.worksheet);

                    let selectedWorksheets = worksheets.filter(function (worksheet, index) {
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
                .then(function (worksheets) {
                    return Promise.all(worksheets.map(function (worksheet) {
                        return worksheet.getCellsAsync();
                    }));
                })
                .then(function (results) {
                    const finalList = results.map(function (cells) {
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

        getWorksheets: function (options) {
            const GoogleSpreadSheet = require('google-spreadsheet');
            return Promise.try(function () {

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
                .then(function (spreadsheet) {
                    return spreadsheet.getInfoAsync();
                })
                .then(function (sheetInfo) {
                    return sheetInfo.worksheets.map(function (worksheet) {
                        return Promise.promisifyAll(worksheet);
                    });
                });
        }
    };

    function MergeRecursive (obj1, obj2) {

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

    function normalizeWorksheetIdentifiers (option) {

        if (typeof option === 'undefined') {
            return [0];
        }

        if (!Array.isArray(option)) {
            return [option];
        }

        return option;
    }
};

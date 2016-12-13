/**
 * 导出多语言文件
 */
var GoogleSpreadsheet = require('google-spreadsheet');
var Promise = require('bluebird');
var stringify = require('json-stable-stringify');
var filetool = require('../base/filetool');

var languages = [
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

var exportLangFile = {
    main: function() {
        var self = this;
        var cwd = process.cwd();
        var package = require(cwd + '/package.json');
        var spreadsheetId = package.googleSpreadsheetId;
        var spreadsheetIdx = package.googleSpreadsheetIndex; // 从0开始

        if (spreadsheetId) {
            this.spreadsheetToJson({
                    spreadsheetId: spreadsheetId,
                    vertical: true,
                    hash: 'key',
                    worksheet: spreadsheetIdx
                })
                .then(function(res) {
                    // 获取JSON数据
                    // TODO 导出到指定的文件目录中
                    self.save(res);
                })
                .catch(function(err) {
                    console.log(err);
                })
        } else {
            console.log('googleSpreadsheetId未配置，请在package.json中进行配置'.red);
        }
    },

    save: function(data) {
        var gsfile = process.cwd() + '/js/lang/pack.js';

        var content = stringify(data, { space: '    ' });

        content = 'module.exports = ' + content;

        filetool.writefile(gsfile, content);
        console.log('多语言文件已生成:'.green + ' ==========> ' + (gsfile).yellow);
    },

    cellsToJson: function(cells, options) {
        options = options || {};

        var rowProp = options.vertical ? 'col' : 'row';
        var colProp = options.vertical ? 'row' : 'col';
        var isHashed = options.hash && !options.listOnly;
        var includeHeaderAsValue = options.listOnly && options.includeHeader;
        var finalList = isHashed ? {} : [];

        // organizing (and ordering) the cells into arrays

        var rows = cells.reduce(function(rows, cell) {
            var rowIndex = cell[rowProp] - 1;

            if (typeof rows[rowIndex] === 'undefined')
                rows[rowIndex] = [];
            rows[rowIndex].push(cell);
            return rows;
        }, []);

        var cols = cells.reduce(function(cols, cell) {
            var colIndex = cell[colProp] - 1;

            if (typeof cols[colIndex] === 'undefined')
                cols[colIndex] = [];
            cols[colIndex].push(cell);
            return cols;
        }, []);
        // find the first row with data to use it as property names

        for (var firstRowIndex = 0; firstRowIndex < rows.length; firstRowIndex++) {
            if (rows[firstRowIndex])
                break;
        }

        // creating the property names map (to detect the name by index)

        var properties = (rows[firstRowIndex] || []).reduce(function(properties, cell) {
            if (typeof cell.value !== 'string' || cell.value === '')
                return properties;

            properties[cell[colProp]] = handlePropertyName(cell.value, options.propertyMode);

            return properties;
        }, {});

        // removing first rows, before and including (or not) the one that is used as property names
        rows.splice(0, firstRowIndex + (includeHeaderAsValue ? 0 : 1));

        // iterating through remaining row to fetch the values and build the final data object

        rows.forEach(function(cells) {

            var newObject = options.listOnly ? [] : {};
            var hasValues = false;

            cells.forEach(function(cell) {
                var val;
                var colNumber = cell[colProp];

                if (!options.listOnly && !properties[colNumber])
                    return;

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
                    if (options.listOnly)
                        newObject['data'][colNumber - 1] = val;
                    else
                        newObject['data'][properties[colNumber]] = val;
                }
            });

            if (hasValues) {
                if (isHashed) {
                    var key = newObject[options.hash];

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
        var self = this;

        return this.getWorksheets(options)
            .then(function(worksheets) {
                var identifiers = normalizeWorksheetIdentifiers(options.worksheet);

                var selectedWorksheets = worksheets.filter(function(worksheet, index) {
                    return identifiers.indexOf(index) !== -1 || identifiers.indexOf(worksheet.title) !== -1;
                });

                // if an array is not passed here, expects only first result
                if (!Array.isArray(options.worksheet)) {
                    selectedWorksheets = selectedWorksheets.slice(0, 1);
                    if (selectedWorksheets.length === 0)
                        throw new Error('No worksheet found!');
                }

                return selectedWorksheets;
            })
            .then(function(worksheets) {
                return Promise.all(worksheets.map(function(worksheet) {
                    return worksheet.getCellsAsync();
                }));
            })
            .then(function(results) {
                var finalList = results.map(function(cells) {
                    return self.cellsToJson(cells, options);
                });

                if (Array.isArray(options.worksheet))
                    return finalList;
                else
                    return finalList[0];
            });
    },

    getWorksheets: function(options) {
        return Promise.try(function() {

                var spreadsheet = Promise.promisifyAll(new GoogleSpreadsheet(options.spreadsheetId));

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
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getWords(phrase) {
    return phrase.replace(/[- ]/ig, ' ').split(' ');
}

function handlePropertyName(cellValue, handleMode) {

    var handleModeType = typeof handleMode;

    if (handleModeType === 'function')
        return handleMode(cellValue);

    var propertyName = (cellValue || '').trim();

    if (handleMode === 'camel' || handleModeType === 'undefined')
        return getWords(propertyName.toLowerCase()).map(function(word, index) {
            return !index ? word : capitalize(word);
        }).join('');

    if (handleMode === 'pascal')
        return getWords(propertyName.toLowerCase()).map(function(word) {
            return capitalize(word);
        }).join('');

    if (handleMode === 'nospace')
        return getWords(propertyName).join('');

    return propertyName;
}


function normalizeWorksheetIdentifiers(option) {

    if (typeof option === 'undefined')
        return [0];

    if (!Array.isArray(option))
        return [option];

    return option;
}

module.exports = exportLangFile;

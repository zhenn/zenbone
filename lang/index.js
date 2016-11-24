var filetool = require('../base/filetool');
var fs = require('fs');
var _ = require('underscore');
require('colors');

var lang = {
    
    extract: function() {
        
        var keyArray = this.getKeyArray();
        var keyfile = process.cwd() + '/js/lang/keys';
        var exsitKeys = [];
        var reuslt = '';

        if (filetool.isFile(keyfile)) {
            exsitKeys = fs.readFileSync(keyfile, 'utf-8').split('\n')
        }

        var difference = _.difference(keyArray, exsitKeys);
        
        result = exsitKeys.concat('==============================新增key==============================').concat(difference).join('\n');

        filetool.writefile(keyfile, result);
        console.log('多语言keys已生成:'.green + ' ==========> ' + (keyfile).yellow);
    },

    getKeyArray: function() {
        var langKeyExp = /lang\.template\(\s*['"](.*?)["']/gi;
        var jsfiles = filetool.walker(process.cwd() + '/js');
        var result = [];

        jsfiles.forEach(function(item, i) {
            var file = fs.readFileSync(item, 'utf-8');
            file.replace(langKeyExp, function($1, $2) {
                if (result.indexOf($2) == -1) {
                    result.push($2);
                    console.log($2.gray);
                }
            });
        });

        return result;
    }
};

module.exports = lang;
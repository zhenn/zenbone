var _process = require('child_process');
var colors = require('colors');
var filetool = require('./base/filetool');
var path = require('path');
var fs = require('fs');

module.exports = {
    main: function(opt) {
        var self = this;
        var env = self.env = opt.product ? 'product' : 'stage';
        self.createAssets(opt, function() {
            self.buildHTML();
            console.log('\n项目构建完成...'.green);
            console.log((env + '环境哦 ' + env).red);
        });
        
    },

    createAssets: function(opt, callback) {
        var env = this.env;
        console.log('正在构建...'.yellow);
        var buildChild = _process.exec('NODE_ENV=' + env + ' webpack -p', function() {
            callback();
        });

        buildChild.stdout.on('data', function(data) {
            console.log(data);
        });
    },

    // reutrn:
    //    [ '/Users/zhenn/ddd/index.html' ]
    getHtmlFiles: function() {
        var _path = process.cwd();
        var contains = filetool.getContains(_path).list,
            arr = [];
        contains.forEach(function(item, i) {
            if (item.type != 'file') {
                return;
            }
            var file = _path + '/' + item.name;
            if (path.extname(file) == '.html') {
                arr.push(file);
            }
        });

        return arr;
    },

    compileHTML: function(content) {

        var package = require(process.cwd() + '/package.json'),
            name = package.name,
            version = package.version,
            scriptReg = /<script +?src="(.+?).js">[\s\S]*?<\/script>/gi,
            linkReg = /<link \/>/i,
            fileKey,
            prehost = '/';

        if (this.env == 'product') {
            prehost = 'http://h.cdn.pengpengla.com/';
        }

        content = content.replace(scriptReg, function($1, $2) {
            if ($2.indexOf('/') >= 0) {
                return $1;
            }
            fileKey = $2;
            return $1.replace($2, prehost + name + '/' + version + '/assets/' + $2);
        });

        content = content.replace(linkReg, '<link type="text/css" rel="stylesheet" href="' + prehost + name + '/' + version + '/assets/' + fileKey + '.css" />');

        return content;
    },

    buildHTML: function() {
        var self = this;
        var htmlFiles = self.getHtmlFiles();
        htmlFiles.forEach(function(item, i) {
            self.buildSingleHTML(item);
        });
    },

    // 输入文件路径, 创建编译后的html文件到build目录
    buildSingleHTML: function(file) {
        var self = this;
        var cwd = process.cwd();
        var targetPath = cwd + '/build' + file.replace(cwd, '');
        var source = fs.readFileSync(file, 'utf-8');

        console.log(('\n打包html:').green);
        console.log(file.gray + '  =====>  '.gray + targetPath.gray + '      100%'.white);

        var compiledContent = this.compileHTML(source);

        filetool.writefile(targetPath, compiledContent);
    }

};
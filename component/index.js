var filetool = require('../base/filetool');
var fs = require('fs');
var path = require('path');
var _process = require('child_process');
var NodeHttp = require('node-http');
var stringify = require('json-stable-stringify');
var _ = require('underscore');
var colors = require('colors');
var babel = require('babel-core');

var componentDomain = 'http://h5widget.xingyunzhi.cn/';

module.exports = {
    build: function() {
        console.log('即将打包组件...');
        
        this.compileES6();
        this.makeTar();
    },

    compileES6: function() {
        var self = this;
        var cwd = process.cwd();
        if (!fs.existsSync(cwd + '/dist')) {
            filetool.mkdir(cwd + '/dist');
        }

        var srcFiles = filetool.walker(cwd + '/src');
        
        srcFiles.forEach(function(item, i) {
            if (path.extname(item) == '.js') {
                var file = fs.readFileSync(item, 'utf-8');
                var content = babel.transform(file, {
                    presets: ['es2015', 'react', 'stage-0']
                }).code.replace('\'use strict\';', '');

                filetool.writefile(cwd + '/dist/' + item.replace(cwd + '/src/', ''), content);
            }
        });
    },

    // 生成tar包(不包含node_modules)
    makeTar: function() {
        var contains = filetool.getContains(process.cwd()).list;
        var cwd = process.cwd();
        var curDir = path.basename(cwd);

        var parentPath = path.resolve(cwd, '../');
        var existTar = cwd + '/' + curDir + '.tar.gz';

        if (fs.existsSync(existTar)) {
            fs.unlinkSync(existTar);
        }

        if (fs.existsSync(cwd + '/node_modules')) {
            fs.renameSync(cwd + '/node_modules', parentPath + '/node_modules');
        }

        if (fs.existsSync(cwd + '/.git')) {
            fs.renameSync(cwd + '/.git', parentPath + '/.git');
        }
         
        _process.exec('cd ' + parentPath + ' && tar -zcvf ' + curDir + '.tar.gz ' + curDir, function(err, stdout, stderr) {
            console.log('生成' + existTar);
            fs.renameSync(parentPath + '/' + curDir + '.tar.gz', existTar);
            fs.renameSync(parentPath + '/node_modules', cwd + '/node_modules');
            fs.renameSync(parentPath + '/.git', cwd + '/.git');
        });
    },

    initScaffold: function() {
        
        var cwd = process.cwd();
        var basename = path.basename(cwd);
        var packagePath = cwd + '/package.json';
        filetool.copydir(__dirname + '/temp', cwd);
        var newPackage = _.template(fs.readFileSync(packagePath, 'utf-8'))({
            name: basename
        });
        
        filetool.writefile(packagePath, newPackage);
        console.log('组件脚手架创建完成...');
    },

    installedArray: [],

    // 检测某组件是否已安装
    isInstalled: function(name) {
        return this.installedArray.indexOf(name) >= 0;
    },

    // 安装组件
    install: function(name) {
        var self = this;
        var cwd = process.cwd();
        var nodeHttp = new NodeHttp;
        var stamp = +new Date;

        if (!name) {
            self.installFromPackage();
            return;
        }

        // 是否已安装
        var installed = self.isInstalled(name); 
        if (installed) {
            return;
        }

        self.installedArray.push(name);

        
        var url = componentDomain + name + '/' + name + '.tar.gz';
        console.log('正在获取: ' + url);

        self.emitPackage(name);

        nodeHttp.GET(url, function (response) {

            if(response.buffer.toString().indexOf('404 Not Found') >= 0) {
                console.log('未找到tar包: ' + url.red);
                return;
            }

            var localTarPath = cwd + '/' + name + '.tar.gz';
            
            fs.writeFileSync(localTarPath , response.buffer);
            console.log(localTarPath.gray, fs.statSync(localTarPath).size.toString().yellow + 'B');
            _process.exec('tar -xzvf ' + name + '.tar.gz', function(err, stdout, stderr) {
                
                fs.unlinkSync(localTarPath);
                var package = JSON.parse(fs.readFileSync(cwd + '/' + name + '/package.json', 'utf-8'));
                
                var dependencies = package._depComponent;

                function moveDir() {
                    // console.log(name.yellow)
                    if (fs.existsSync(cwd + '/node_modules/' + name)) {
                        filetool.rmdirSync(cwd + '/node_modules/' + name);
                    }
                    // console.log(fs.existsSync(cwd + '/' + name).toString().red)
                    fs.renameSync(cwd + '/' + name, cwd + '/node_modules/' + name);
                }
                moveDir();

                // 若组件零依赖
                // 下载组件移动到node_modules
                if (dependencies.length == 0) {
                    return;
                }
                
                dependencies.forEach(function(item, i) {
                    self.install(item);
                });

            });
            
        });

    },

    emitPackage: function(name) {
        var self = this;
        var cwd = process.cwd(),
            path = cwd + '/package.json';

        var packageFile = fs.readFileSync(path, 'utf-8');

        var package = JSON.parse(packageFile),
            _depComponent = package._depComponent || [],
            _arr = _depComponent.concat();
        
        // console.log(name, _arr);

        if (_arr.indexOf(name) >= 0) {
            return;
        }
        _arr.push(name);

        package._depComponent = _arr;
        fs.writeFileSync(path, stringify(package, {space: '  '}));
        // filetool.writefile(path, stringify(package, {space: '  '}));
    },

    installFromPackage: function() {
        var self = this;
        var cwd = process.cwd();
        var package = JSON.parse(fs.readFileSync(cwd + '/package.json', 'utf-8'));
        var _depComponent = package._depComponent;

        if (_depComponent.length == 0) {
            console.log('未发现本项目有任何组件依赖...');
            return;
        }

        _depComponent.forEach(function(item, i) {
            self.install(item);
        });
    }
}
module.exports = function () {
    const filetool = require('../utils/filetool');
    const fs = require('fs');
    const path = require('path');
    const _process = require('child_process');
    const stringify = require('json-stable-stringify');
    const ora = require('ora');

    require('colors');

    let cacheList = [];

    return {
        cwd: process.cwd(),
        spinner: null,
        build: function (cb) {
            this.spinner = ora('正在编译组件，可能需要一段时间，请稍候');
            this.spinner.start();

            this.compileES6();
            this.makeTar();

            this.spinner.succeed('组件编译完成。');

            cb && cb();
        },

        compileES6: function () {
            const cwd = this.cwd;
            if (!fs.existsSync(cwd + '/dist')) {
                filetool.mkdir(cwd + '/dist');
            }

            const srcFiles = filetool.walker(cwd + '/src');
            this.spinner.text = '正在转换es6文件';
            srcFiles.forEach(function (item) {
                if (/\.js$/.test(item)) {
                    const file = fs.readFileSync(item, 'utf-8');
                    const content = require('babel-core').transform(file, {
                        presets: ['es2015', 'react', 'stage-0']
                    }).code.replace('\'use strict\';', '');

                    filetool.writefile(cwd + '/dist/' + item.replace(cwd + '/src/', ''), content);
                } else if (/\.css$/.test(item)) {
                    filetool.copyfile(item, item.replace('/src/', '/dist/'));
                }
            });
            this.spinner.succeed('组件es6转换完成。');
        },

        // 生成tar包(不包含node_modules)
        makeTar: function () {
            const self = this;
            const curDir = path.basename(this.cwd);

            const parentPath = path.resolve(this.cwd, '../');
            const existTar = this.cwd + '/' + curDir + '.tar.gz';

            this.spinner.text = '正在生成tar.gz压缩包';

            if (fs.existsSync(existTar)) {
                fs.unlinkSync(existTar);
            }

            if (fs.existsSync(this.cwd + '/node_modules')) {
                fs.renameSync(this.cwd + '/node_modules', parentPath + '/node_modules');
            }

            if (fs.existsSync(this.cwd + '/.git')) {
                fs.renameSync(this.cwd + '/.git', parentPath + '/.git');
            }

            _process.exec('cd ' + parentPath + ' && tar -zcvf ' + curDir + '.tar.gz ' + curDir, function (err, stdout, stderr) {
                fs.renameSync(parentPath + '/' + curDir + '.tar.gz', existTar);
                fs.renameSync(parentPath + '/node_modules', self.cwd + '/node_modules');
                if (fs.existsSync(parentPath + '/.git')) {
                    fs.renameSync(parentPath + '/.git', self.cwd + '/.git');
                }
                self.spinner.succeed('组件tar.gz打包完成。');
            });
        },

        // 安装组件
        install: function (name) {
            const self = this;
            const NodeHttp = require('node-http');
            const nodeHttp = new NodeHttp();
            const pkgJson = path.resolve(self.cwd, 'package.json');
            const pkgConfig = require(pkgJson);
            const componentDomain = pkgConfig.componentDomain;

            if (!name) {
                self.installFromPackage();
                return;
            }

            if (!this.spinner) {
                this.spinner = ora('正在安装选择的依赖');
                this.spinner.start();
            }

            //  先看看有没有node_modules，没有需要创建
            if (!fs.existsSync(path.resolve(self.cwd, 'node_modules'))) {
                fs.mkdirSync(path.resolve(self.cwd, 'node_modules'));
            }

            //  一次安装多个widget
            const widgetNames = name.trim().split(/\s+/);
            if (widgetNames.length > 1) {
                let widgetNameObj = {};
                widgetNames.forEach(function (item) {
                    widgetNameObj[item] = 1;
                });
                return Object.keys(widgetNameObj).forEach(function (item) {
                    self.install(item);
                });
            }

            //  主要是解决一次安装多个的时候，多组件依赖同一组件导致的多次安装
            if (cacheList.indexOf(name) !== -1) {
                return;
            }

            //  将已经安装的缓存起来，防止多次安装
            cacheList.push(name);

            const url = componentDomain + name + '/' + name + '.tar.gz';
            self.spinner.text = '正在下载：' + url;
            nodeHttp.GET(url, function (response) {

                if (response.buffer.toString().indexOf('404 Not Found') >= 0) {
                    self.spinner.fail(name + '安装失败，因为' + url + ' 不存在。');
                    return;
                }

                const localTarPath = self.cwd + '/' + name + '.tar.gz';
                //  获取到包，将依赖写入_depComponent
                self.emitPackage(name);

                fs.writeFileSync(localTarPath, response.buffer);

                _process.exec('tar -xzvf ' + name + '.tar.gz', function (err, stdout, stderr) {
                    if (fs.existsSync(localTarPath)) {
                        fs.unlinkSync(localTarPath);
                    }

                    const widgetDeps = require(path.resolve(self.cwd, name, 'package.json'))._depComponent;

                    // 如果已经存在了，就先删除
                    if (fs.existsSync(self.cwd + '/node_modules/' + name)) {
                        filetool.rmdirSync(self.cwd + '/node_modules/' + name);
                    }

                    // 移动到node_modules下面
                    fs.renameSync(self.cwd + '/' + name, self.cwd + '/node_modules/' + name);

                    // 若组件零依赖
                    // 下载组件移动到node_modules
                    if (widgetDeps && widgetDeps.length > 0) {
                        self.install(widgetDeps.join(' '));
                    }

                    self.spinner.succeed(name + '安装成功。');
                });

            });

        },

        uninstall: function (name) {
            const self = this;
            if (!name) {
                return console.log('请选择你要卸载的组件。'.red);
            }
            //  一次安装多个widget
            const widgetNames = name.trim().split(/\s+/);
            if (widgetNames.length > 1) {
                return widgetNames.forEach(function (item) {
                    self.uninstall(item);
                });
            }

            if (!this.spinner) {
                this.spinner = ora('正在删除选择的zenbone组件');
                this.spinner.start();
            }

            const libDir = path.resolve(self.cwd, 'node_modules');
            this.spinner.text = '正在卸载' + name;
            if (fs.existsSync(libDir)) {
                const widgetDir = path.resolve(libDir, name);
                const pkgJson = path.resolve(self.cwd, 'package.json');
                const pkgConfig = require(pkgJson);
                const _deps = pkgConfig._depComponent || [];
                if (fs.existsSync(widgetDir)) {
                    require('../utils/rmdir-sync')(widgetDir);
                    if (_deps.indexOf(name) !== -1) {
                        _deps.splice(_deps.indexOf(name), 1);
                    }
                    pkgConfig._depComponent = _deps;
                    fs.unlinkSync(pkgJson);
                    fs.writeFile(pkgJson, stringify(pkgConfig, {space: '  '}), 'utf8');
                    self.spinner.succeed(name + '卸载完成');
                } else {
                    self.spinner.fail(name + '没有安装，不需要卸载');
                }
            } else {
                self.spinner.fail(name + '没有安装，不需要卸载');
            }
        },

        emitPackage: function (name) {
            const pkgJson = path.resolve(this.cwd, 'package.json');
            const pkgConfig = require(pkgJson),
                _depComponent = pkgConfig._depComponent || [],
                _arr = _depComponent.concat();

            if (_arr.indexOf(name) >= 0) {
                return;
            }
            _arr.push(name);

            pkgConfig._depComponent = _arr;
            fs.unlinkSync(pkgJson);
            fs.writeFileSync(pkgJson, stringify(pkgConfig, {space: '  '}), 'utf8');
        },

        installFromPackage: function () {
            const self = this;
            const pkgJson = path.resolve(this.cwd, 'package.json');
            const pkgConfig = require(pkgJson);
            const _depComponent = pkgConfig._depComponent;

            if (!_depComponent || _depComponent.length === 0) {
                console.log('未发现本项目有任何组件依赖...');
                return;
            }

            self.install(_depComponent.join(' '));
        },
        widgetList: function () {
            const WordTable = require('word-table');
            return require('axios')
                .get('http://gitlab.pengpeng.la/api/v3/groups/6?private_token=Vc8tNijVAeKTAy66wueN')
                .then(function (resp) {
                    let header = ['ID', 'Widget Name', 'Widget Description', 'Gitlab Web Url'];
                    let body = resp.data.projects.map(function (item, index) {
                        return [index + 1, item.name, item.description, item.web_url];
                    });
                    let table = new WordTable(header, body);
                    console.log(('\n一共找到了个' + resp.data.projects.length + '组件，可以使用 "zenbone install [widgetName]" 安装组件到当前项目中。\n').green);
                    console.log(table.string());
                    console.log(('\n一共找到了个' + resp.data.projects.length + '组件，可以使用 "zenbone install [widgetName]" 安装组件到当前项目中。\n').green);
                })
                .catch(function (e) {
                    if (e.response.data.message === '401 Unauthorized') {
                        console.log('gitlab服务器token过期了，请联系开发者替换最新的key吧'.red);
                        console.log('请访问：');
                        console.log('http://gitlab.pengpeng.la/profile/personal_access_tokens'.blue);
                    } else {
                        console.log(e.message.red);
                    }
                });
        }
    };
};

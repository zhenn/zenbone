module.exports = function () {
    const fs = require('fs');
    const fsextra = require('fs-extra');
    const os = require('os');
    const path = require('path');
    const _ = require('underscore');
    require('colors');

    let inquirer = null;
    const templateDir = path.resolve(os.homedir(), '.zenbone-templates');

    // && item.toUpperCase() === 'README.MD'
    const ignoreFileRegex = /^(\..+|readme\.md)$/i;

    return {
        cwd: process.cwd(),
        spinner: null,
        gitReposUrl: 'http://gitlab.pengpengla.com/template/<%=name%>.git',
        templateDir: templateDir,
        templateDirExist: fs.existsSync(templateDir),
        templateList: function () {
            const WordTable = require('word-table');
            return require('axios')
                .get('http://gitlab.pengpengla.com/api/v3/groups/133?private_token=Vc8tNijVAeKTAy66wueN')
                .then(function (resp) {
                    let header = ['ID', 'Template Name', 'Template Description', 'Template Web Url'];
                    let body = resp.data.projects.map(function (item, index) {
                        return [index + 1, item.name, item.description, item.web_url];
                    });
                    let table = new WordTable(header, body);
                    console.log(('\n一共找到了个' + resp.data.projects.length + '模板，可以使用 "zenbone pull [templateName]" 或者使用 "zenbone init [templateName]" 创建项目。\n').green);
                    console.log(table.string());
                    console.log(('\n一共找到了个' + resp.data.projects.length + '模板，可以使用 "zenbone pull [templateName]" 或者使用 "zenbone init [templateName]" 创建项目。\n').green);
                })
                .catch(function (e) {
                    if (e.response.data.message === '401 Unauthorized') {
                        console.log('gitlab服务器token过期了，请联系开发者替换最新的key吧'.red);
                        console.log('请访问：');
                        console.log('http://gitlab.pengpengla.com/profile/personal_access_tokens'.blue);
                    } else {
                        console.log(e.message.red);
                    }
                });
        },
        //  下载模板
        downloadTemplate: function (gitUrl, targetDir, cb, errCb) {
            const self = this;
            const ora = require('ora');
            const name = gitUrl.match(/\/([A-Za-z-\d]+)\.git/)[1];
            if (!this.spinner) {
                this.spinner = ora('正在下载模板：' + name);
                this.spinner.start();
            }
            if (!self.templateDirExist) {
                fs.mkdirSync(self.templateDir);
                self.templateDirExist = true;
            }
            require('git-clone')(gitUrl, targetDir + '-git', {}, function (err) {
                if (err === undefined) {
                    // 下载完成后再删除，防止下载失败了，什么都没有了
                    if (fs.existsSync(targetDir)) {
                        require('../utils/rmdir-sync')(targetDir);
                    }
                    // 重新命名
                    fs.renameSync(targetDir + '-git', targetDir);
                    self.spinner.succeed('模板下载成功：' + name);
                    cb && cb();
                } else {
                    self.spinner.fail('模板下载失败：' + name + ' (网络原因、模板不存在或者权限问题)');
                    errCb && errCb();
                }
            });
        },
        //  根据模板名称拉取模板
        pullTemplate(name) {
            const self = this;
            //  没有输入名字，就需要更新所有的template
            if (!name && !fs.existsSync(self.templateDir)) {
                return console.log('你从来没有下载过模板，请使用 `zenbone pull templateName`，下载模板再试'.yellow);
            }

            let pulled = [];

            if (name) {
                // 支持同时下载多个模板
                const tplNames = name.trim().split(/\s+/);
                if (tplNames.length > 1) {
                    return tplNames.forEach(function (item) {
                        // 去重
                        if (pulled.indexOf(item) === -1) {
                            self.pullTemplate(item);
                            pulled.push(item);
                        }
                    });
                }
                self.downloadTemplate(_.template(self.gitReposUrl)({name: name}), path.resolve(self.templateDir, name));
            } else {
                console.log('即将更新本地所有的模板，请稍候...'.green);
                const dirs = fs.readdirSync(self.templateDir);
                if (!dirs.length) {
                    return console.log('你从来没有下载过模板，请使用 `zenbone pull templateName`，下载模板再试'.yellow);
                }
                dirs.forEach(function (item) {
                    if (!(/^\./.test(item))) {
                        self.pullTemplate(item);
                    }
                });
            }
        },
        //  检查文件夹是不是空的
        checkDirectory: function (cb) {
            const me = this;
            const files = fs.readdirSync(me.cwd);
            let existFile = false;

            files.forEach(function (item) {
                if (!existFile) {
                    existFile = !ignoreFileRegex.test(item);
                }
            });

            if (existFile) {
                return inquirer.prompt([
                    {
                        name: 'isEmpty',
                        message: '当前文件夹不为空,继续将覆盖文件夹中的内容，是否继续？',
                        type: 'list',
                        choices: [{name: '全部覆盖', value: 1}, {name: '取消操作', value: 0}]
                    }
                ]).then(function (data) {
                    const isEmpty = data.isEmpty;
                    if (isEmpty === 1) {
                        files.forEach(function (item) {
                            if (!ignoreFileRegex.test(item)) {
                                fsextra.removeSync(item);
                            }
                        });
                        cb();
                    }
                });
            }
            cb();
        },
        // get basic message for project
        createProjectConfig: function (options, cb) {
            inquirer.prompt([
                {
                    name: 'name',
                    message: '项目名称',
                    default: path.basename(this.cwd)
                }
            ].concat(options)).then(cb);
        },
        //  开始创建项目
        createProject: function (templateName) {
            console.log('开始创建项目...'.blue);
            const self = this;
            const encoding = 'utf-8';
            const currTemplate = path.resolve(self.templateDir, templateName);
            //  读取询问的配置文件
            const templateConfigFile = path.resolve(currTemplate, 'config.json');
            let templateConfig = [];
            // 不存在就是[]
            if (fs.existsSync(templateConfigFile)) {
                templateConfig = require(templateConfigFile);
            }
            // 按照配置询问用户需要的字段
            self.createProjectConfig(templateConfig, function (result) {
                fsextra.copy(path.resolve(currTemplate, 'template'), self.cwd, function (err) {
                    if (!err) {
                        // 重命名文件
                        fs.renameSync(self.cwd + '/gitignore', self.cwd + '/.gitignore');
                        // 按照输入的信息填充package.json和webpack配置文件
                        const pkgConfig = path.resolve(self.cwd, 'package.json');
                        const webpackConfig = path.resolve(self.cwd, 'webpack.config.js');
                        fs.writeFileSync(pkgConfig, _.template(fs.readFileSync(pkgConfig, encoding))(result), encoding);
                        fs.writeFileSync(webpackConfig, _.template(fs.readFileSync(webpackConfig, encoding))(result), encoding);
                        console.log('log:'.green + (' 项目 "' + result.name + '" 创建成功。').gray);
                    }
                });
            });
        },
        /**
         * @param {String} templateName 模版名称
         */
        main: function (templateName) {
            const self = this;
            //  延迟加载
            inquirer = require('inquirer');
            self.checkDirectory(function () {
                //  判断template是否存在
                const currTemplateDir = path.resolve(self.templateDir, templateName);
                const gitUrl = _.template(self.gitReposUrl)({name: templateName});

                // 默认在线上拉取，没有的会从本地拉取，两处都没有就报错误
                console.log('正在从服务器下载模板...'.green);
                self.downloadTemplate(gitUrl, currTemplateDir, function () {
                    self.createProject(templateName);
                }, function () {
                    console.log('服务器上下载模板失败'.red);
                    if (!fs.existsSync(currTemplateDir)) {
                        console.log('使用本地缓存的模板创建项目...');
                        self.createProject(templateName);
                    } else {
                        console.log('模板不存在，请检查模板名称'.red);
                    }
                });
            });
        }
    };
};

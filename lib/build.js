/**
 * 打包部署
 * @param options 是否检查分支，发布小组件的时候不要检查分支
 * @returns {{buildHTML: buildHTML, buildSingleHTML: buildSingleHTML, compileHTML: (function(*): (void | string)), getHtmlFiles: (function(): Array), main: main, createAssets: createAssets, spinner: null}}
 */
module.exports = function (options) {
    const _process = require('child_process');
    const filetool = require('./utils/filetool');
    const path = require('path');
    const fs = require('fs');
    const check = (options || {}).check;
    require('colors');

    let cwd, pkgJson, pkgConfig;

    return {
        spinner: null,
        main: function (opt) {
            const self = this;
            const env = self.env = opt.product ? 'product' : 'stage';
            // 获取当前项目的文件夹
            cwd = process.cwd();
            // 获取项目的package.json
            pkgJson = path.resolve(cwd, 'package.json');
            // 获取项目配置
            pkgConfig = require(pkgJson);
            if (!fs.existsSync(pkgJson)) {
                return console.log('没有找到package.json，你可能没有在项目根目录，或者请先使用`zenbone init [templateName]`初始化项目'.red);
            }
            if (check) {
                const branchTool = require('./utils/branchtool')();
                // 检测一下git分支
                if (env === 'product'){
                    if (branchTool.isDaily()){
                        return console.log('当前是daily分支，请切换到master分支上打包线上代码'.red);
                    }
                } else {
                    if (branchTool.isMaster()) {
                        return console.log('当前是master分支，请切换到daily分支上打包stage代码'.red);
                    }
                    const branchVersion = branchTool.getDailyVersion();
                    if (branchVersion !== pkgConfig.version) {
                        return console.log(`当前分支的版本是：${branchVersion}，package.json版本是：${pkgConfig.version}，请保持一致`.red);
                    }
                }
            }

            const inquirer = require('inquirer');

            let commitMsg = 'ci';
            let tagMsg = '';

            if (pkgConfig.gitlabGroup !== undefined && pkgConfig.gitlabGroup.trim() === '') {
                return console.log('防止发布失败，请先配置gitlabGroup'.red);
            }

            filetool.rmdirSync(cwd + '/build');

            function startBuild () {
                const ora = require('ora');
                self.spinner = ora('正在构建项目，可能需要一段时间，请稍候');
                self.spinner.start();
                self.createAssets(opt, function (error) {
                    if (error) {
                        self.spinner.fail('使用webpack打包失败，请查看日志。');
                        // return;
                    }
                    self.spinner.succeed('使用webpack打包完成。');
                    self.buildHTML();
                    console.log(`[${opt.widget ? 'widget' : env}] 项目构建完成，请上传发布吧。`.red);
                    console.log('\n你可能需要执行：');
                    if (env === 'product') {
                        console.log(`\n git add . && git commit -m "${commitMsg}" && git push origin master && git tag -a publish/${pkgConfig.version} -m "${tagMsg}" && git push origin publish/${pkgConfig.version}\n`.yellow);
                        console.log('执行完上面的命令，你可以使用下面的命令直接调用jenkins部署：');
                        console.log('\n zenbone deploy --product\n'.yellow);
                    } else if (opt.widget) {
                        console.log(`\n git add . && git commit -m "${commitMsg}" && git push origin master\n`.yellow);
                    } else {
                        console.log(`\n git add . && git commit -m "${commitMsg}" && git push origin daily/${pkgConfig.version}\n`.yellow);
                        console.log('执行完上面的命令，你可以使用下面的命令直接调用jenkins部署：');
                        console.log('\n zenbone deploy\n'.yellow);
                    }
                });
            }

            if (env === 'product') {
                inquirer.prompt([
                    {
                        name: 'version',
                        message: '请输入要发布的版本号',
                        default: pkgConfig.version,
                        validate (input) {
                            if (/^\d+\.\d+\.\d+$/.test(input)) {
                                return true;
                            }
                            console.log('版本号是由三段数字组成的，例如：1.1.0');
                            return false;
                        }
                    },
                    {
                        name: 'comment',
                        message: '本次提交的备注',
                        default: commitMsg
                    },
                    {
                        name: 'tagComment',
                        message: '本次发版的备注，用来后期版本分析，例如 "fixbug:修改了货币精度问题"',
                        validate (input) {
                            input = input.trim();
                            if (input.length < 5) {
                                console.log('发版的备注长度不能小于5');
                                return false;
                            }
                            return true;
                        }
                    }
                ]).then(({version, comment, tagComment}) => {
                    if (version !== pkgConfig.version) {
                        const stringify = require('json-stable-stringify');
                        pkgConfig.version = version;
                        fs.writeFileSync(pkgJson, stringify(pkgConfig, {space: '  '}), 'utf8');
                    }
                    commitMsg = comment;
                    tagMsg = tagComment;
                    startBuild();
                });
            } else {
                inquirer.prompt([
                    {
                        name: 'comment',
                        message: '本次提交的备注',
                        default: commitMsg
                    }
                ]).then(({comment}) => {
                    commitMsg = comment;
                    startBuild();
                });
            }
        },

        createAssets: function (opt, callback) {
            let buildError = false;
            const env = this.env;
            const self = this;
            self.spinner.text = '正在使用webpack打包项目';
            // console.log('正在构建项目，可能需要一段时间，请稍候...'.yellow);
            const buildChild = _process.exec('NODE_ENV=' + env + ' webpack -p', function () {
                callback(buildError);
            });

            buildChild.stdout.on('data', function (data) {
                console.log(data);
            });

            buildChild.stderr.on('data', function (data) {
                console.log(data.toString().red);
                buildError = true;
            });
        },

        getHtmlFiles: function () {
            const contains = filetool.getContains(cwd).list,
                arr = [];
            contains.forEach(function (item, i) {
                const file = path.resolve(cwd, item.name);
                if (/\.(html|php|xml|txt)$/.test(file)) {
                    arr.push(file);
                }
            });
            return arr;
        },

        compileHTML: function (content) {
            const name = pkgConfig.name,
                group = pkgConfig.gitlabGroup,
                version = pkgConfig.version,
                scriptReg = /<script +?src="(.+?\.js)">[\s\S]*?<\/script>/gi,
                linkReg = /<script/i;
            let fileKey = '', prehost = '/';

            if (this.env === 'product') {
                prehost = '//' + pkgConfig.cdnDomain + '/';
            }

            content = content.replace(scriptReg, function ($1, $2) {
                if ($2.indexOf('/') >= 0) {
                    return $1;
                }
                fileKey = $2;
                return $1.replace($2, `${prehost + group}/${name}/${version}/assets/${$2}?tm=${+new Date()}`);
            });

            if (fileKey) {
                content = content.replace(linkReg, function ($1) {
                    return `<link type="text/css" rel="stylesheet" href="${prehost + group}/${name}/${version}/assets/${fileKey.replace(/\.js$/, '.css')}?tm=${+new Date()}" />\n` + $1;
                });
            }

            return content;
        },

        buildHTML: function () {
            const self = this;
            const htmlFiles = self.getHtmlFiles();
            htmlFiles.forEach(function (item, i) {
                self.buildSingleHTML(item);
            });
        },

        // 输入文件路径, 创建编译后的html文件到build目录
        buildSingleHTML: function (file) {
            const targetPath = cwd + '/build' + file.replace(cwd, '');
            const source = fs.readFileSync(file, 'utf-8');
            const compiledContent = this.compileHTML(source);
            filetool.writefile(targetPath, compiledContent);
            this.spinner.succeed('HTML文件：' + file + ' 处理完成');
        }

    };
};

#!/usr/local/bin/node --harmony

var package = require('../package.json');
var program = require('commander');
var scaffold = require('../scaffold/index');
var app = require('../app');
var build = require('../build');
var component = require('../component/index');
var lang = require('../lang/index');
var exportLangFile = require('../lang/file');

program
    .version(package.version)
    .option('-p, --port [number]', 'select port for node-service', 80) // 声明端口
    .option('-s, --stage', 'define stage-env for building')
    .option('-P, --product', 'define product-env for building');

// 子命令: 初始化项目
program
    .command('init')
    .description('scraffold for initialize project')
    .action(function(action) {
        if (action == 'act') {
            scaffold.main('/temp-act');
        } else {
            scaffold.main('/temp');
        }
    });

program
    .command('start')
    .description('start dev env')
    .action(function() {
        app();
    });


// 子命令:打包服务
program
    .command('build')
    .description('build project')
    .action(function () {
        build.main({
            stage : program.stage,
            product : program.product
        });
    });


program
    .command('lang <action>')
    .description('extract multi-language key and export multi-language file')
    .action(function(action) {
        
        if (action == 'file') {
            exportLangFile.main();
        } else if (action == 'key'){
            lang.extract();
        } else {
            console.log('未知action\n可选操作:\n  file 导出js文件\n  key 提取多语言包keys');
        }
    });

program
    .command('component <action>')
    .description('component')
    .action(function (action) {
        if (action == 'build') {
            component.build();
            build.main({
                stage : program.stage
            }); 
        } else if (action == 'init') {
            component.initScaffold();
        } else {
            console.log('未知action\n可选操作:\n  init 初始化组件\n  build 打包组价');
        }
        
    });

// 子命令:安装js组件
program
    .command('install [name]')
    .description('intall widget')
    .action(function (name) {
        component.install(name);
    });

// 子命令:更新js组件
program
    .command('update <name>')
    .description('update widget')
    .action(function (name) {
        widget.update(name);
    });

// 子命令:更新所有js组件
program
    .command('update <allWidget>')
    .description('update all-widget')
    .action(function (name) {
        widget.updateAll(name);
    });

// 子命令:卸载js组件
program
    .command('uninstall <name>')
    .description('unintall widget')
    .action(function (name) {
        widget.uninstall(name);
    });

program.parse(process.argv);


#!/usr/local/bin/node --harmony

var package = require('../package.json');
var program = require('commander');
var scaffold = require('../scaffold/index');
var app = require('../app');
var build = require('../build');

program
    .version(package.version)
    .option('-p, --port [number]', 'select port for node-service', 80) // 声明端口
    .option('-s, --stage' , 'define stage-env for building')
    .option('-P, --product' , 'define product-env for building')

// 子命令: 初始化项目
program
    .command('init')
    .description('scraffold for initialize project')
    .action(function() {
        scaffold.main();
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

// 子命令:安装js组件
program
    .command('install <name>')
    .description('intall widget')
    .action(function (name) {
        widget.install(name);
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


#!/usr/bin/env node
const program = require('commander');
const pkgConfig = require('../package.json');
const scaffold = require('../lib/scaffold/index'); // man
const app = require('../lib/app');
const build = require('../lib/build');
const component = require('../lib/widget/index'); // man
const lang = require('../lib/lang/index');
const exportLangFile = require('../lib/lang/file'); //  很慢啊

require('colors');

if (parseInt(process.version.match(/v(\d+)/)[1]) < 6) {
    console.log('你的node.js版本过低，该程序要求node.js版本不能低于v6.0.0');
    process.exit();
}

program
    .version(pkgConfig.version, '-v, --version')
    .usage('<command> [options]')
    .option('-p, --port [number]', '选择一个端口启动调试服务器', 80) // 声明端口
    .option('-s, --stage', '构建或部署当前代码为测试(stage)环境')
    .option('-P, --product', '构建或部署当前代码为生产(product)环境')
    .option('-V, --version-set', '构建当前代码为生产(product)环境时询问版本号')
    .option('-sp, --split', '将语言包拆成一个单独的文件而不是打包在项目的js中，有助于单独拉取文案')
    .option('-m, --multi', '是否导出为多个语言文件');

// 子命令: 初始化项目
program
    .command('init')
    .description('使用脚手架初始化一个基于模板的项目，默认normal模板')
    .action(function (templateName) {
        if (typeof templateName === 'object') {
            templateName = 'normal';
        }
        if (templateName === 'act') {
            templateName = 'activity';
        }
        scaffold().main(templateName);
    });

program
    .command('start')
    .description('启动调试服务器(sudo webpack-dev-server)')
    .action(function () {
        app();
    });

// 子命令:打包服务
program
    .command('build')
    .description('构建项目到stage或者product环境')
    .action(function () {
        build().main({
            stage: program.stage,
            product: program.product,
            versionSet: program.versionSet
        });
    });

program
    .command('deploy')
    .description('调用Jenkins构建项目，支持stage,product环境')
    .action(function () {
        require('../lib/deploy')({
            stage: !program.product
        });
    });

program
    .command('lang <action>')
    .description('生成多语言的key，或者拉取多语言的文案')
    .action(function (action) {
        if (action === 'file') {
            exportLangFile().main({
                split: program.split,
                multi: program.multi
            });
        } else if (action === 'key') {
            lang().extract();
        } else {
            console.log('未知操作，可选操作:\n  file 拉取文案导出js文件\n  key 提取多语言包keys');
        }
    });

program
    .command('widget [action]')
    .alias('component')
    .description('对组件进行操作，可选操作action（init, list, build）')
    .action(function (action) {
        if (action === 'build') {
            component().build(function () {
                build().main({
                    stage: program.stage,
                    detail: program.detail,
                    widget: true
                });
            });
        } else if (action === 'list') {
            component().widgetList();
        } else if (action === 'init') {
            scaffold().main('widget');
        } else {
            console.log('未知操作，可选操作:\n  list 列出线上所有的小组件\n  build 构建你的小组件(widget)并压缩成tar.gz文件供发布\n  init 初始化一个widget的工程');
        }
    });

// 更新下载的模板
program
    .command('template')
    .description('列出服务器上的所有的模板')
    .action(function () {
        scaffold().templateList();
    });

// 更新下载的模板
program
    .command('pull [name]')
    .description('在远程的服务器上下载一个或多个模板')
    .action(function (name) {
        scaffold().pullTemplate(typeof name === 'string' ? name : null);
    });

// 子命令:安装js组件
program
    .command('install [name]')
    .description('将远程服务器上的组件下载到本地并添加到项目的依赖中')
    .action(function (name) {
        component().install(typeof name === 'string' ? name : null);
    });

program
    .command('uninstall [name]')
    .description('从本地node_modules中删除小组件并从项目依赖中移除')
    .action(function (name) {
        component().uninstall(typeof name === 'string' ? name : null);
    });

program.parse(process.argv);
const cmds = ['init', 'start', 'build', 'deploy', 'lang', 'widget', 'component', 'template', 'pull', 'install', 'uninstall'];
if (process.argv.length < 3 || cmds.indexOf(process.argv[2]) === -1) {
    program.help();
}

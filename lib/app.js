module.exports = function () {
    const _process = require('child_process');
    const os = require('os');
    const fs = require('fs');
    const needRoot = os.platform() !== 'win32';
    const filetool = require('./utils/filetool');
    require('colors');

    function start () {
        const dirContains = filetool.getContains(process.cwd());
        let installedDeps = 0;
        for (let i = 0, list = dirContains.list; i < list.length; i++) {
            const item = list[i];
            if (item.name.indexOf('node_modules') >= 0) {
                installedDeps = 1;
                break;
            }
        }

        // 若已安装本项目依赖
        if (installedDeps) {
            const devChild = _process.exec(needRoot ? 'sudo webpack-dev-server' : 'webpack-dev-server');

            devChild.stdout.on('data', function (data) {
                console.log(data.toString());
            });

            devChild.stderr.on('data', function (data) {
                const str = data.toString();
                console.log(str.red);
                if (str.indexOf('webpack-dev-server: command not found') >= 0) {
                    console.log('\n检测到尚未安装webpack或webpack-dev-server.\n正在自动安装webpack...\n'.yellow);
                    installWebpack();
                }
            });

            devChild.on('exit', function (code) {
                console.log('child process exited with code ' + code.toString().red);
            });
        } else {
            installLocalDeps();
        }
    }

    function installLocalDeps () {
        const dirContains = filetool.getContains(process.cwd());
        if (!dirContains.list.length || !fs.existsSync(process.cwd() + '/package.json')) {
            console.log('该目录下不是一个zenbone创建的项目, 请执行zenbone init [templateName].'.red);
            return;
        }

        const child = _process.exec('npm install', function () {
            console.log('本项目依赖安装完成, 正在重启服务...'.green);
            start();
        });

        console.log('安装本项目依赖, 时间较长请耐心等待..'.green);

        child.stdout.on('data', function (data) {
            console.log(data.toString());
        });
    }

    function installWebpack () {
        let command = 'npm install webpack@3.5.5 webpack-dev-server@1.14.1 -g';
        if (needRoot) {
            command = 'sudo npm install webpack@3.5.5 webpack-dev-server@1.14.1 -g';
        }
        const installChild = _process.exec(command, start);

        installChild.stdout.on('data', function (data) {
            console.log(data.toString());
        });

        installChild.stderr.on('data', function (data) {
            console.log(data.toString());
        });
    }

    return start();
};

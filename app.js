var _process = require('child_process');
var colors = require('colors');
var filetool = require('./base/filetool');

function start() {

    var dirContains = filetool.getContains(process.cwd()),
        installedDeps = 0;
    for (var i = 0, list = dirContains.list; i < list.length; i++) {
        var item = list[i];
        if (item.name.indexOf('node_modules') >= 0) {
            installedDeps = 1;
            break;
        }
    }

    // 若已安装本项目依赖
    if (installedDeps) {
        var devChild = _process.spawn('sudo', ['webpack-dev-server']);

        devChild.stdout.on('data', function(data) {
            console.log(data.toString());
        });

        devChild.stderr.on('data', function(data) {
            var str = data.toString();
            console.log(str.red);
            if (str.indexOf('webpack-dev-server: command not found') >= 0) {
                console.log('\n检测到尚未安装webpack或webpack-dev-server.\n正在自动安装webpack...\n'.yellow);
                installWebpack({
                    needRoot: false
                });
            }
            
        });

        devChild.on('exit', function(code) {
            console.log('child process exited with code ' + code.toString().red);
        });

    } else {

        installLocalDeps();
    }

    
}

function installLocalDeps() {

    var dirContains = filetool.getContains(process.cwd());
    if (!dirContains.list.length) {
        console.log('请执行zenbone init'.red);
        return;
    }

    var child = _process.exec('npm isntall', function(err, stdout, stderr) {
        console.log('本项目依赖安装完成, 正在重启服务...'.green);
        start();
    });
    console.log('安装本项目依赖, 时间较长请耐心等待..'.green);

    child.stdout.on('data', function(data) {
        console.log(data.toString());
    });
}

function installWebpack(opt) {
    
    var opt = opt || {};
    var needRoot = opt.needRoot;
    var command = 'npm install webpack webpack-dev-server -g';
    if (needRoot) {
        command = 'sudo npm install webpack webpack-dev-server -g';
    }
    var installChild = _process.exec(command, function(err, stdout, stderr) {
        if (stderr && stderr.indexOf('permission denied') >= 0) {
            installWebpack({
                needRoot: true
            });
            return;
        } 
        start();
    });

    installChild.stdout.on('data', function(data) {
        console.log(data.toString());
    })
}

module.exports = start;

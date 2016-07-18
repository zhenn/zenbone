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
        var devChild = _process.exec('sudo webpack-dev-server', function(err, stdout, stderr) {
        
            if (stderr) {
                console.log(stderr.red);
                console.log('\n检测到尚未安装webpack或webpack-dev-server.\n正在自动安装webpack...\n'.yellow);
                installWebpack({
                    needRoot: false
                });
            } else {
                console.log('开发环境：'.white + '启动完成'.gray);
            }
            
        });

        devChild.stdout.on('data', function(data) {
            console.log(data);
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
        console.log(data);
    });

    child.stderr.on('data', function(data) {
        console.log(data);
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

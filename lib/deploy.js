require('colors');
const axios = require('axios');
const filetool = require('./utils/filetool');

const JENKINS_HOST = 'https://ci.pengpengla.com/job/';

// 测试环境
let stageUrl = JENKINS_HOST + 'stage-h5-new/';
let stageToken = '1q2w3e4r';

// 正式环境，目前不支持，后期加入配置文件支持即可
let releaseUrl = JENKINS_HOST + 'prod-h5-new/';
let releaseToken = 'VJMhDCt1';

// 个人认证的信息，优先读取配置文件中的用户名和密码
let auth = {
    username: 'fuqiang.zhang',
    password: 'e3445c91f61b86c539a8638c822bd934'
};

let prevMessage = '';
let finishMsg = 'Finished';
let attemptNum = 0;
let consoleTextUrl = '';

function printLog(num, http) {
    http.get(num + '/logText/progressiveHtml')
        .then(r => {
            let msg = r.data.replace(prevMessage, '');
            process.stdout.write(msg);
            if (r.data.indexOf(finishMsg) === -1) {
                setTimeout(function () {
                    printLog(num, http);
                }, 1000);
            }
            prevMessage = r.data;
        })
        .catch(function (err) {
            if (err.message.indexOf('404') !== -1) {
                attemptNum++;
                if (attemptNum > 12) {
                    console.log(('请求日志失败，请查看：' + consoleTextUrl + '。').red);
                    return;
                }
                setTimeout(function () {
                    printLog(num, http);
                }, 1000);
            }
        });
}

module.exports = function ({stage, configFile}) {
    const pkgConfig = require(process.cwd() + '/package.json');
    const git = pkgConfig.name;
    const version = pkgConfig.version;
    const gitlabGroup = pkgConfig.gitlabGroup;


    const deployfilePath = process.cwd() + '/' + (configFile || 'deploy.json');

    if (filetool.isFile(deployfilePath)) {
        let deployConfig = require(deployfilePath);
        
        stageUrl = deployConfig.stageUrl || stageUrl;
        stageToken = deployConfig.stageToken || stageToken;

        releaseUrl = deployConfig.releaseUrl || releaseUrl;
        releaseToken = deployConfig.releaseToken || releaseToken;

        auth = {
            username: deployConfig.username,
            password: deployConfig.password
        }
    }

    const stageHttp = axios.create({
        baseURL: stageUrl,
        auth
    });

    const releaseHttp = axios.create({
        baseURL: releaseUrl,
        auth
    });

    if (!git) {
        return console.log('package.json中的name配置为空'.red);
    }

    if (!version) {
        return console.log('package.json中的version配置为空'.red);
    }

    if (!gitlabGroup) {
        return console.log('package.json中的gitlabGroup配置为空'.red);
    }

    if (stage && !stageToken) {
        return console.log('部署stage环境需要token，请联系运维工程师配置token'.red);
    }

    if (!stage && !releaseToken) {
        return console.log('部署product环境需要token，请联系运维工程师配置token'.red);
    }

    console.log(('正在使用下面的配置进行构建' + (stage ? '"stage"' : '"product"') + '环境：').green);
    console.log(('name => ' + git).blue);
    console.log(('version => ' + version).blue);
    console.log(('gitlabGroup => ' + gitlabGroup).blue);
    

    let request = stage ? stageHttp({
        url: 'buildWithParameters?token=' + stageToken,
        params: {
            git,
            edition: 'daily/' + version,
            git_group: gitlabGroup
        }
    }) : releaseHttp({
        url: 'buildWithParameters?token=' + releaseToken,
        params: {
            git,
            edition: 'daily/' + version,
            tag: 'publish/' + version,
            group: gitlabGroup
        }
    });

    let logHttpStart = () => {
        const http = stage ? stageHttp : releaseHttp;
        return http({
            url: 'api/json'
        }).then(re => {
            consoleTextUrl = (stage ? stageUrl : releaseUrl) + re.data.nextBuildNumber + '/console'
            console.log(('^_^ 构建已经成功提交，正在请求日志...！LINK => ' + consoleTextUrl + '\n').green);
            printLog(re.data.nextBuildNumber, http);
        }).catch(err => {
            console.log(err.message);
        })
    };

    request.then(logHttpStart).catch(err => {
        console.error(err.message);
        console.log('): 构建出错了，请检查网络或者hosts配置（如果不在公司你需要链接VPN）,或者检查环境的配置！'.red);
    });
};

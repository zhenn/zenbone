
var path = require('path');
var fs = require('fs'); 
var _ = require('underscore');
var filetool = require('../base/filetool');
var colors = require('colors');
var prompt = require('prompt');
var _process = require('child_process');
var step = require('step');

module.exports = {
    /**
     * temp 模版名称
     */
    main : function (temp) {
        var self = this;
        self.cwd = process.cwd();
        self.tempDir = __dirname + temp || '/temp';
        
        // if (self.isEmpty()) {
            self.create();

        // } else {
            // console.log('当前目录为非空目录...操作已中断'.red);
        // }

    },

    // check current dir is empty or not
    isEmpty : function () {
        var self = this;
        var contains = filetool.getContains(self.cwd);
        return !contains.list.length
    },

    // get basic message for project
    getBaseMsg : function (cb) {
        var self = this;
        var schema = {
            properties: {
                name : {
                    description : '项目名称',
                    default : path.basename(self.cwd)
                },
                version: {
                    description : '项目版本',
                    pattern: /^\d+?\.\d+?\.\d+?$/,
                    message: 'pattern: 1.0.0',
                    required: true
                },
                cssmode: {
                    description: '设计稿分辨率模式',
                    required: true,
                    message: 'pattern: 640 | 750 | 0'
                },
                cdnDomain: {
                    description: 'cdn服务域名',
                    default: 'h.cdn.pengpengla.com',
                    required: true
                },
                gitlabGroup: {
                    description: 'gitlab group名称, 用于生成cdn资源路径\n 若为空, 请在项目打包前在package.json中补全'
                }
            }
        };

        prompt.start();
        prompt.get(schema , cb);
    },

    // create the basic structure for project
    create : function () {
        var self = this;
        


        self.getBaseMsg(function (err , result) {
            filetool.copydir(self.tempDir , self.cwd);
            fs.renameSync(self.cwd + '/gitignore', self.cwd + '/.gitignore');
            self.createPackage(result);
            self.createWebpackConfig(result);
            console.log('log:'.green + (' project ' + result.name + ' has created').gray);
        });
        
    },

    // create meta.json
    createPackage : function (obj) {
        var self = this;
        var packageJSON = _.template(fs.readFileSync(self.tempDir + '/package.json' , 'utf-8'))(obj);
        fs.writeFileSync(self.cwd + '/package.json' , packageJSON , 'utf-8');
    },

    createWebpackConfig: function(obj) {
        var self = this;
        var configs = _.template(fs.readFileSync(self.tempDir + '/webpack.config.js' , 'utf-8'))(obj);
        fs.writeFileSync(self.cwd + '/webpack.config.js' , configs , 'utf-8');
    }


};
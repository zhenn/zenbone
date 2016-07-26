var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');  // 导出额外的文件插件
var StringReplacePlugin = require('string-replace-webpack-plugin'); // 字符串替换插件

// 获取环境变量, 方便做不同处理
// stage, product打包处理方式略有不同, 如assets资源的引用路径
var env = process.env.NODE_ENV;

// 读取项目配置文件
// 获得项目名称及版本, 方便做打包处理assets cdn路径
var package = require('./package.json');
var projectVersion = package.version;
var projectName = package.name;
var cssmode = package.cssmode;

// 输出口
var output = {
    path: path.resolve(__dirname, "build/assets"),
    filename: '[name].js' 
};

// 声明cssloader
var cssLoader = {
    test: /\.css$/,
    loader: 'style!css'
};

// 为product环境打包时
if (env == 'product') {
    // 定制cdn路径
    output.publicPath = 'http://h.cdn.pengpengla.com/' + projectName + '/' + projectVersion + '/assets/';
    cssLoader.loader = ExtractTextPlugin.extract("style-loader", "css-loader");
}

if (env == 'stage') {
     // 定制cdn路径
    output.publicPath = '/' + projectName + '/' + projectVersion + '/assets/';
    cssLoader.loader = ExtractTextPlugin.extract("style-loader", "css-loader");
}

module.exports = {
    entry: {
        // 可对应多个入口文件
        test: './test.js'
    },
    output: output,
    devtool: 'source-map', // 输出source-map
    module: {
        loaders: [
            {
                test: /\.jsx?$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
                query: {
                    presets: ['es2015', 'react', 'stage-0']
                }
            },
            
            cssLoader,
            { 
                test: /\.css|jsx?$/,
                loader: StringReplacePlugin.replace({
                    replacements: [
                        {
                            pattern: /\d+?px['"; ]/ig,
                            replacement: function (res) {
                                // 若cssmode为0, 则不需要额处理单位
                                // 可选: 640 | 750
                                if (cssmode > 0) {
                                    res = res.replace(/(\d+?)px([; ',"])/ig, function($1 , $2 , $3, index , source) {
                                        return ($2 * 2) / (cssmode / 10) + 'rem' + $3;
                                    });
                                }
                                return res;
                            }
                        }
                    ]
                })
            },
            { 
                test: /\.png$/, 
                loader: "url-loader?limit=10000" // 小于3k, 转成base64
            },
            { 
                test: /\.jpg$/, 
                loader: "file-loader" 
            }
        ]
    },
    // server配置
    // sudo webpack-dev-server
    devServer: {
        contentBase: './',  // 服务根目录
        color: true,  // 命令行是否彩色
        inline: true, // 项目文件保存自动编译文件模块
        port: 80 // 启动端口
    },

    // 插件
    plugins: [
        new ExtractTextPlugin("[name].css"),
        new StringReplacePlugin()
    ]

};

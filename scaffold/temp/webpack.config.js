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
var gitlabGroup = package.gitlabGroup;
var cdnDomain = package.cdnDomain;

// 输出口
var output = {
    path: path.resolve(__dirname, "build/assets"),
    filename: '[name].js',
    chunkFilename: '[name].[chunkhash:5].chunk.js'
};

// 声明cssloader
var cssLoader = {
    test: /\.(css|less)$/,
    use: [
        'style-loader',
        'css-loader',
        'postcss-loader',
        'less-loader'
    ]
};

var extractCSS = new ExtractTextPlugin({
    allChunks: true,
    filename: '[name].css'
});

// 为product环境打包时
if (env == 'product') {
    // 定制cdn路径
    output.publicPath = '//' + cdnDomain + '/' + gitlabGroup + '/' + projectName + '/' + projectVersion + '/assets/';
    cssLoader.loader = extractCSS.extract(['css-loader', 'postcss-loader', 'less-loader']);
    delete cssLoader.use;
}

if (env == 'stage') {
     // 定制cdn路径
    output.publicPath = '/' + gitlabGroup + '/' + projectName + '/' + projectVersion + '/assets/';
    cssLoader.loader = extractCSS.extract(['css-loader', 'postcss-loader', 'less-loader']);
    delete cssLoader.use;
}

var config = {
    entry: {
        // 可对应多个入口文件
        app: ['./js/app.js']
    },
    output: output,
    devtool: 'source-map', // 输出source-map
    module: {
        loaders: [
            {
                test: /\.tmpl$/,
                loader: "underscore-template-loader",
                query: {
                    engine: 'lodash'
                }
            },
            {
                test: /\.jsx?$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
                query: {
                    presets: ['es2015', 'react', 'stage-0'],
                    plugins: ['transform-remove-strict-mode']
                }
            },
            {
                test: /\.vue$/, // vue-loader 加载.vue单文件组件
                loader: 'vue'
            },
            cssLoader,
            {
                test: /\.(css|less|jsx?)$/,
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
                loader: "url-loader?limit=6000" // 小于3k, 转成base64
            },
            {
                test: /\.jpg|mp3|mp4|gif$/,
                loader: "file-loader"
            }
        ]
    },
    resolve: {
        extensions: ['.js', '.vue'], // 确保引用时省略模块扩展名
        alias:{
            'vue$': 'vue/dist/vue.common.js'  // 可同时使用独立构建和运行构建
        }
    },
    // server配置
    // sudo webpack-dev-server
    devServer: {
        contentBase: './',  // 服务根目录
        color: true,  // 命令行是否彩色
        inline: true, // 项目文件保存自动编译文件模块
        host: '0.0.0.0', //  使用IP访问
        port: 80 // 启动端口
    },

    // 插件
    plugins: [
        extractCSS,
        new StringReplacePlugin(),
        new webpack.optimize.CommonsChunkPlugin({
            name: "commons",
            filename: "commons.js",
            minChunks: 3, // (Modules must be shared between 3 entries)
            chunks: ["pageA", "pageB"] // (Only use these entries)
        })
    ]

};

module.exports = config;

# zenbone

## 一，概述

**要点**

- 基于[webpack](https://webpack.github.io/)
- 模块化管理、打包工具
- 集成脚手架工具，适用于创建项目或组件
- HTML打包
- 自动配置webpack.config

**优势：**

- 代码向后兼容——完全遵守webpack编码规范，让我们更加方便使用ES6（新一代Javascript编程规范）
- 高性能——使用webpack编译工具，编译性能高，开发体验佳
- 生态圈繁荣——可快速使用[NPM](https://www.npmjs.com/)海量JS组件 & [webpack插件](http://webpack.github.io/docs/list-of-plugins.html)
- 化繁为简——使用脚手架工具，可帮助我们跳过繁琐的webpack配置，及其他相关学习成本，快速进入项目开发状态

**项目地址：**[https://github.com/zhenn/zenbone](https://github.com/zhenn/zenbone)



## 二，安装维护
### 安装

	npm install zenbone -g
	
### 更新

	npm update zenbone -g
	
若更新失败，可指定最新版本号重新安装，`npm install zenbone@x.y.z -g`

## 三，项目开发

### 1，创建项目

	mkdir test 
	cd ./test
	zenbone init
	
创建项目结构如下：

	test
 	  | -- css
 	  	 | -- reset.css		# reset
 	  	 | -- whatever.css	# 项目级css
 	  | -- js
 	  	 | -- app.js	# js入口
 	  | -- images
 	  | -- index.html	# html入口
 	  | -- package.json		# 项目配置
 	  | -- webpack.config.js	# webpack配置文件
 	  | -- .gitignore

zenbone对`css、js、images`文件夹没有要求，可以任意存放，JS模块无论引用CSS模块还是图片，均使用相对路径，只要保证路径正确即可。


### 2，启动本地环境

启动本地静态服务器

	zenbone start

执行上述命令，做了以下几件事情：

- 检测本机是否安装`webpack`及`webpack-dev-server`，若未安装，则自动安装;
- 检测是否已安装项目依赖，若未安装，则自动安装;
- 启动静态服务器

首次使用`zenbone start`启动环境，等待时间通常会比较长，其主要时间消耗安装工具依赖及项目依赖上，亦可逐次执行上述操作。

	npm install webpack webpack-dev-server -g
	npm install 
	zenbone start

在浏览器键入: `localhost`即可查看index.html相关内容。由于在webpack.config.js中配置了watch功能，当文件发生变化后，系统将自动刷新浏览器。

### 3，使用组件

组件通常分为`通用组件`和`业务组件`。

通用组件，指和业务逻辑无关的组件、模块，如react、dialog等，若其使用npm系统管理，则直接通过npm安装。

	npm install react
	
业务组件，通常和业务逻辑结合紧密，并不具备更高通用性，通常发布到业务服务器，则需要通过zenbone命令安装。

	zenbone install xxx

业务组件开发、发布方式，zenbone提供定制方案，详见下文『组件开发』。在业务模块中使用安装的组件:

	import React, {Component} from 'react';
	

### 4，打包

	zenbone build --product		# 生产环境
	zenbone build --stage		# 预发布环境
	
预发布和生产环境打包之间，仅html中引用资源(css、js)路径不同，其它处理完全一致。

**webpack配置：**

	// 为product环境打包时
	if (env == 'product') {
    	// 定制cdn路径
    	output.publicPath = 'http://cdn/' + projectName + '/' + projectVersion + '/assets/';
	}

	if (env == 'stage') {
     	// 定制cdn路径
    	output.publicPath = '/' + projectName + '/' + projectVersion + '/assets/';
	}
	
由此配置可看出，项目打包时会使用package.json中`name`、`version`字段作为CDN文件输出的关键路径。

影响范围：

- css\js对图片资源的引用
- html入口对js\css的应用

务必在进行打包前更新项目版本号，避免浏览器缓存。

	
**打包后项目结构：**

	test
	  | -- build
	  	 | -- assets
	  	 	| -- 880110af781e078951d0d0fda16353f4.png  # 项目图片，打包后js、css将自动使用此名称
	  	 	| -- app.js		# js入口，被打包后html引用
	  	 	| -- app.js.map	# source-map 便于调试
	  	 	| -- app.css	# css，被打包后html引用
	  	 	| -- app.css.map	
	  	 	| -- commmons.js	# 多入口公用部分，将打包后html引用
	  	 	| -- commons.js.map		
	  	 | -- index.html	# 打包后html入口
 	  | -- css
 	  	 | -- reset.css		# reset
 	  	 | -- whatever.css	# 项目级css
 	  | -- js
 	  	 | -- app.js	# js入口
 	  | -- images
 	  | -- index.html	# html入口
 	  | -- package.json		# 项目配置
 	  | -- webpack.config.js	# webpack配置文件
 	  | -- .gitignore

	
## 四，组件开发

### 1，概述

如你所知，zenbone开发以单个项目为单位，即在项目内无法依赖本地项目外的资源模块。

在实际项目中往往存在此种类型的模块，它被用到A、B、C多个项目，那么在zenbone（即webpack）开发模式中，如何管理这些模块就至关重要！
 
把公用模块发布到npm系统是个选择，但显然不合适。

- 模块含有业务逻辑代码，不够通用
- 不希望把业务代码开源

把所有公用模块存放在本地库，在项目中单独硬拷贝也可满足需求，但人肉操作实为繁琐，也会操作失误率。因此需要另辟蹊径，既能发布组件到业务服务器，又能很方便安装、使用。


### 2，实现原理

组件遵守npm开发规范，在开发完成后上传组件tar包到业务服务器。安装时从业务服务器下载tar包到项目node_modules目录，同时正确处理依赖关系，并下载相关依赖组件，为了避免和npm系统模块冲突，在组件名称前统一添加前缀'c-'，使用方式则可保持和npm系统一致。

### 3，创建组件

	mkdir test 
	cd ./test
	zenbone component init
	
创建项目结构如下：

	test
 	  | -- src
 	  	 | -- index.js		# 开发时, 组件入口
 	  | -- test.html	# 测试htlm
 	  | -- test.js		# 测试js入口
 	  | -- package.json		# 组件项目配置, 如依赖组件等
 	  | -- webpack.config.js	# webpack配置文件
 	  | -- .gitignore

### 4，启动环境

	zenbone start
	
### 5，开发组件

编写`src/js`内组件代码，打开`localhost/test.html`进行调试。若组件依赖于其他组件，则通过如下方式进行安装：

	zenbone install componentNameA
	
安装完成后，打开项目目录下`node_modules`，会发现增加了componentNameA目录，此时便可在组件内引用。

	import componentNameA from 'componentNameA';
	
同时，配置文件`package.json`中增加了`_depComponent`字段，形如：

	"_depComponent": [
    	"componentNameA"
  	]
  	
此字段用来标注该组件依赖的组件列表，以保证组件被安装时同时安装相关依赖。假若componentNameA又依赖于componentNameB，则`node_modules`中将增加componentNameA、componentNameB目录，`_depComponent`也会增加对componentNameB的依赖。

	"_depComponent": [
    	"componentNameA",
    	"componentNameB"
  	]
  	
当非原始开发者对组件进行维护时，在下载源代码（通常不包括node_modules）后，通过`zenbone install`便可一键安装所有组件依赖。

有关安装组件依赖操作，需要关注package.json中`componentDomain`字段，它决定安装组件源代码来源。路径中最后一个`/`不可省略，以保证zenbone可正确找到组件tar包。

	{
		"componentDomain": "http://h5widget.xingyunzhi.cn/"
	}

下面是一个完整的tar包地址，其中name是组件名称。
	
	// http://h5widget.xingyunzhi.cn/componentNameA/componentNameA.tar.gz
	var url = componentDomain + name + '/' + name + '.tar.gz';
	
	
### 6，打包组件

	zenbone component build
	
组件打包后在根目录将增加目录`dist`、`test.tat.gz`。
	
	test
 	  | -- src
 	  	 | -- index.js		# 开发时, 组件入口
 	  | -- dist
 	  	 | -- index.js		# 组件被安装后, 实际被引用的模块
 	  | -- test.html	# 测试htlm
 	  | -- test.js		# 测试js入口
 	  | -- package.json		# 组件项目配置, 如依赖组件等
 	  | -- webpack.config.js	# webpack配置文件
 	  | -- test.tar.gz		# 安装时下载的tar包
 	  | -- .gitignore

确定打包成功后，把test.tar.gz发布到`_depComponent`对应的服务器即可。

至此，一个完整组件开发、构建、发布的所有工作全部完成！

## FAQ

`zenbone(webpack)`把JS作为所有模块的入口，和传统开发方式相比有很大不同，初次接触，难免会有一点点不适应。这里列举一些常见问题及解决办法以供参考，后续持续补充。

### 1，css如何引用？

在js模块通过require、import方式依赖引入。

	import '../css/app.css';
	// require('../css/app.css');
	
经过webpack编译后，会把所有引入的css合并到入口js中，在开发环境不太关注性能，不需要额外处理。
在生产环境，则需要把css单独拆分出来用link在html单独载入，有两方面原因：

- link引用css非阻塞，可使用http并发特性
- js体积减少，将提高页面加载渲染速率

为了导出额外的assets文件，webpack提供了extract-text-webpack-plugin插件。

	var ExtractTextPlugin = require("extract-text-webpack-plugin")
	// 声明cssloader
	var cssLoader = {
    	test: /\.css$/,
    	loader: 'style!css'
	};
	// 为product环境打包时
	if (env == 'product') {
    	cssLoader.loader = ExtractTextPlugin.extract("style-loader", "css-loader");
	}
	// 插件
	plugins: [
    	new ExtractTextPlugin("[name].css"),
	]

如上配置，在开发环境仍然会将css合并至js，但在执行webpack -p后，在对应的输出目录将会生成独立的css文件，且在打包后js文件中将不在包含相应css代码。

另外有关css模块依赖，不能在css中使用import导入模块，会影响cssmode（m-base）的编译，推荐把css放到对应js模块中引入，也更方便于多人协作开发。

### 2，正确使用图片

#### css环境

正常使用相对路径引用，url-loader根据图片大小，决定是否生成base64或者临时性的图片放到内存中暂存，同时js中图片引用路径将会被编译成临时图片地址，确保图片正常显示！

#### js环境

使用require(path)方式载入，编译原理同上，若直接使用相对路径写到img-src，在开发环境可正常输出，但在打包时无法应用output规则输出在打包文件夹下。

引用示例：

	render() {
    	let png = require('../images/touch.png');
    	return (
        	<div>
            	<img src={png} />
            	<h1>Hello</h1>
        	</div>
    	);
	}
	
编译后：

	880110af781e078951d0d0fda16353f4.png
	
#### html环境

避免直接在html中使用图片，在css中使用background、js中使用require替代！

### 3，自定义字符串替换

在实际项目中，处理基本的编译任务使用webpack相关loader基本可以满足需求，若要定制项目中特殊的编译规则，则需要额外的字符串替换操作。比如在使用m-base（自适应各种分辨率，css长度单位使用动态rem）组件时，需要把css文件中长度单位px转换成rem，与之匹配的数字也要按算法做转换。

string-replace-webpack-plugin插件则为此而生，简单做如下配置。

	var StringReplacePlugin = require('string-replace-webpack-plugin');
	loaders: [
        cssLoader,
        {
            test: /\.css|jsx?$/,
            loader: StringReplacePlugin.replace({
                replacements: [
                    {
                        pattern: /\d+?px['"; ]/ig,
                        replacement: function (res) {
                            var res = res.replace(/(\d+?)px([; ',"])/ig, function($1 , $2 , $3, index , source) {
                                return ($2 * 2) / (cssmode / 10) + 'rem' + $3;
                            });
                            return res;
                        }
                    }
                ]
            })
        }
	],
	plugins: [
     	new StringReplacePlugin()
	]
	
要特别注意，插件的调用务必要在cssLoader之后，否则将无法生效。

### 待续...


	






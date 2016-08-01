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

zenbone对`css、js、images`文件夹没有要求，可以任意存放，JS模块无论引用CSS模块还是图片，均按照相对路径，只要保证路径正确即可。


### 2，启动本地环境

启动本地静态服务器

	zenbone start

执行上述命令，做了以下几件事情：

- 检测本机是否安装`webpack`及`webpack-dev-server`，若未安装，则自动安装;
- 检测是否已安装项目依赖，若未安装，则自动安装;
- 启动静态服务器

因此首次使用`zenbone start`启动环境，等待时间通常会比较长，其主要时间消耗安装工具依赖及项目依赖上，亦可逐次执行上述操作。

	npm install webpack webpack-dev-server -g
	npm install 
	zenbone start

在浏览器键入: `localhost`即可查看index.html相关内容。由于在webpack.config.js中配置了watch功能，当文件发生变化后，系统将自动刷新浏览器。

### 3，打包

	zenbone build --product		# 生产环境
	zenbone build --stage		# 预发布环境
	
开发调试完成后，可进行预发布、生产环境打包，生成可发布文件。两者相比，仅html中引用资源(css、js)路径不同，其它放则完全一致。

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

务必在进行打包前更新项目版本号，以避免浏览器缓存。

	
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
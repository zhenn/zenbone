/**
 * author : Ryan Liu braveoyster@gmail.com
 * date   : 29 Sep 2018
 * desc   : sprites feature
 **/
const fs = require('fs');
const path = require('path');
const Spritesmith = require('spritesmith');
const glob = require('glob');
const ora = require('ora');

const imagesDir = './images/';
const confFilePath = path.join(imagesDir, '.spriteconf');
const cssDir = './css';
const manifestPath = path.join(imagesDir, 'sprite-manifest.json');

let manifestContent = '';
let processDirsCount = 0;
let processedCount = 0;

/**
 * call sprite engine to start building
 * @param sources {string[]} images will sprite
 * @param dirName {string} the directory name sources blongs to
 **/
function execContact(sources, dirName) {
    return Spritesmith.run({
        src: sources,
        algorithm: 'left-right',
        padding: 2
    }, function handleResult (err, result) {
        const spriteName = `${ dirName }-sprite.png`;
        const spriteFile = path.join(imagesDir, spriteName);

        console.log(result);
        manifestContent += JSON.stringify(result);
        processedCount++;
        if (processDirsCount === processedCount) {
            fs.writeFile(manifestPath, manifestContent, 'utf-8', (err) {
                if (err) {
                    console.error('写入sprite-manifest.json文件失败，错误信息：' + err);
                }
            });
        }

        fs.writeFileSync(spriteFile, result.image);
        console.log(`\n成功生成${ spriteName }`.green);
        updateCssReference(spriteFile, result);
    });
}

/**
 * update image ref path in all style files
 * @param spriteFile {string} sprite img path
 * @param info {object} result(coords, width, height) which spritesmith engine processed
 **/
function updateCssReference(spriteFile, info) {
    // find all style files in css directory
    const styleFiles = glob.sync(path.join(cssDir, '/**/*.{css,less,scss,sass}'));

    styleFiles.forEach( styleFile => {
        let originContent = '';
        let result = '';

        try {
            originContent = result = fs.readFileSync(styleFile, 'utf8');
        } catch(err) {
            console.error('读取.css文件出错，请确认样式文件是否正确，错误信息：' + err);
            process.exit(1);
        }

        try {
            Object.keys(info.coordinates).forEach( key => {
                const coord = info.coordinates[key];

                // match all image reference path (e.g. background: url("**/*.png"))
                var reg = new RegExp(`(?:\(['"]?)(.*)${key}(['"]?\))(.+\n)`, 'gi');

                // replace sprite img path and add position inofo
                result = result.replace(reg, function(match, p1, p2, p3, p4) {
                    return `${ p2 }${spriteFile}${ p3 }${ p4 }    background-position: ${ coord.x }px ${ coord.y }px;\n`;
                });
            });

            if (originContent != result) {
                fs.writeFileSync(styleFile, result, 'utf8');
                console.log(`'${ styleFile }' 样式规则已更新`.green);
            }
        } catch(error) {
            console.error('更新样式文件时出现错误，错误信息：' + error);
            process.exit(1);
        }
    });
}

module.exports = function() {
    return {
        spinner: null,
        start: function(opts) {
            const self = this;
            let patten = path.join(imagesDir, '/*/**/*.{png,jpg,jpeg,gif}');
            let filter = null;

            self.spinner = ora('正在合并图片，请稍候');
            self.spinner.start();

            // '.spritesconf' file struct:
            /** {
             *    strategy: string | func // 'include' or 'exclude'
             *    dirs: string[] // e.g. ['dir1', 'dir2'],
             * }
             */
            if (fs.existsSync(confFilePath)) {
                try {
                    const confObj = JSON.parse(fs.readFileSync(confFilePath, 'utf-8'));

                    if (confObj.dirs && confObj.dirs.length) {
                        filter = f => {
                            const include = confObj.dirs.find(dir => f.startsWith(path.join(imagesDir, dir) + '/'));
                            return confObj.strategy === 'exclude' ? !include : include;
                        };
                    }
                } catch(err) {
                    console.error('读取.spriteconf配置文件出错，请确认文件格式是否正确，错误信息：' + err);
                    process.exit(1);
                }
            }

            let allImgs = glob.sync(patten);

            if (filter) {
                allImgs = allImgs.filter( f => filter(f));
            }

            if (!allImgs || !allImgs.length) {
                return console.error('没有可以合并的图片资源，请检查图片目录或.spriteconf规则是否有效！');
            }

            const dirs = new Set();
            const dirReg = /\/([^\/\s]+)\//;
            allImgs.forEach( img => {
                const matches = img.match(dirReg);
                dirs.add(matches[1]);
            });

            processDirsCount = dirs.size;
            dirs.forEach( dir => {
                const imgs = allImgs.filter(img => img.startsWith(path.join(imagesDir, dir)));
                execContact(imgs, dir);
            });

            self.spinner.succeed('精灵图构建完成。');
        }
    };
};

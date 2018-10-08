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

let manifestContent = [];
let processDirsCount = 0;
let processedCount = 0;

/**
 * call sprite engine to start building
 * @param sources {string[]} images will sprite
 * @param dirName {string} the directory name sources blongs to
 **/
function execContact(sources, dirName) {
    const self = this;
    return Spritesmith.run({
        src: sources,
        algorithm: 'left-right',
        padding: 2
    }, function handleResult(err, result) {
        const spriteName = `${ dirName }-sprite.png`;
        const spriteFile = path.join(imagesDir, spriteName);

        const sectionContent = {
            sprite: spriteName,
            properties: result.properties,
            coordinates: result.coordinates
        };

        manifestContent.push(sectionContent);
        processedCount++;
        if (processDirsCount === processedCount) {
            fs.writeFile(manifestPath, JSON.stringify(manifestContent, null, 4), 'utf-8', (err) => {
                if (err) {
                    self.spinner.fail('精灵图构建失败。');
                    return console.log(`\n写入${ imagesDir }/sprite-manifest.json文件失败，错误信息： ${ err }`.red);
                }

                console.log(`\n成功写入${ path.join(imagesDir, 'sprite-manifest.json') }文件`.green);
                return self.spinner.succeed('精灵图构建成功。'.green);
            });
        }

        fs.writeFileSync(spriteFile, result.image);
        console.log(`\n成功生成${ spriteFile }`.green);
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
            console.error(`\n读取.css文件出错，请确认样式文件是否正确，错误信息：${ err }`.red);
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
            console.error(`\n更新样式文件时出现错误，错误信息：${error}`.red);
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

            self.spinner = ora('正在处理，请稍候...');
            self.spinner.start();

            // '.spritesconf' file struct:
            /** {
             *      strategy: string // e.g. 'include' or 'exclude'
             *      dirs: string[] // e.g. ['dir1', 'dir2']
             *  }
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
                    self.spinner.fail(`读取.spriteconf配置文件出错，请确认文件格式是否正确，错误信息：${ err }`.red);
                }
            }

            let allImgs = glob.sync(patten);

            if (filter) {
                allImgs = allImgs.filter( f => filter(f));
            }

            if (!allImgs || !allImgs.length) {
                self.spinner.fail('没有可以合并的图片资源，请检查图片目录或.spriteconf规则是否有效！'.red);
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
                execContact.call(self, imgs, dir);
            });
        }
    };
};

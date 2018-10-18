/**
 * author : Ryan Liu braveoyster@gmail.com
 * date   : 17 Oct 2018
 * desc   : write file synchronous with check whether directory was exists,
 *          inspired by 'https://github.com/jkroso/writefile'
 **/

const fs = require('fs');
const dirname = require('path').dirname;
const mkdirp = require('mkdirp');

/**
 * fs.writeFileSync but makes parent directories if required
 *
 * @param {String} path
 * @param {String} content
 */
function writeFileSync(path, content) {
    const dir = dirname(path);
    if (!fs.existsSync(dir)) {
        mkdirp.sync(dir, 0777);
    }

    fs.writeFileSync(path, content);
    console.log(`\n -----------${path} 已成功写入-----------`);
}

module.exports = writeFileSync;

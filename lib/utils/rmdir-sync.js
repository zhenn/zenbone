const fs = require('fs');
const path = require('path');

function rmdirSync (dirpath) {

    if (fs.existsSync(dirpath) && fs.statSync(dirpath).isDirectory()) {
        const files = fs.readdirSync(dirpath);
        files.forEach(function (file, index) {
            const curPath = path.join(dirpath, file);
            if (fs.statSync(curPath).isDirectory()) {
                rmdirSync(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(dirpath);
    }
}

module.exports = rmdirSync;

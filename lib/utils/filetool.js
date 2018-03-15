/**
 * @fileoverview file系统的一些方法封装
 * @author zhenn
 */

const fs = require('fs');
const cpfile = require('cp-file');
const cpdir = require('copy-dir');
const mkdir = require('mkdir-p');
const writefile = require('writefile');
const rmdirSync = require('./rmdir-sync');

module.exports = {
    /**
     * 判断当前路径是否为文件夹
     * @param path {string} 本地路径
     * @return boolean
     */
    isDir: function (path) {
        if (typeof path !== 'string' || !fs.existsSync(path)) {
            return;
        }
        return fs.statSync(path).isDirectory();
    },

    /**
     * 判断当前路径是否为文件
     * @param path {string} 本地路径
     * @return boolean
     */
    isFile: function (path) {
        if (typeof path !== 'string' || !fs.existsSync(path)) {
            return;
        }
        return fs.statSync(path).isFile();
    },

    writefile: function (path, text) {
        writefile(path, text);
    },

    mkdir: function (path) {
        mkdir.sync(path);
    },

    /**
     * 获得当前文件下的目录结构信息
     * @param path {string} 本地路径
     * @return object
     */
    getContains: function (path) {
        const arr = fs.readdirSync(path);
        const that = this;
        return {
            list: arr.filter(function (item) {
                return !(/^\./.test(item));
            }).map(function (item) {
                return {
                    name: item,
                    type: that.isDir(path + '/' + item) ? 'dir' : 'file'
                };
            })
        };
    },

    /**
     * 拷贝文件
     * @return function
     */
    copyfile: function (path, targetPath) {
        cpfile.sync.apply(this, arguments);
    },

    /**
     * 拷贝文件夹
     * @return function
     */
    copydir: function (path, targetPath) {
        cpdir.sync.apply(this, arguments);
    },

    /**
     * 删除文件夹
     * @return void
     */
    rmdirSync: function (path) {
        rmdirSync(path);
    },

    /**
     * 获得某路径下所有文件的集合
     * @param path {string}
     * @return array 路径列表
     */
    walker: function (path) {
        const self = this,
            fileList = [];

        if (!fs.existsSync(path)) return fileList;

        function walk(_path) {
            const dirList = fs.readdirSync(_path);
            dirList.forEach(function (item) {
                if (self.isDir(_path + '/' + item)) {
                    walk(_path + '/' + item);
                } else {
                    fileList.push(_path + '/' + item);
                }
            });
        }

        walk(path);
        return fileList;
    }
};


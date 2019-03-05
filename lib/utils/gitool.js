module.exports = function (pathname) {
    const proc = require('child_process');
    const cwd = pathname;
    /**
     * 在当前的目录执行命令
     * @param command
     * @returns {string}
     */
    const exec = (command) => {
        return proc.execSync(`cd ${cwd} && ${command}`).toString().replace(/([\r\n])/g, '');
    };

    // 查看是不是git仓库
    const isGitRepos = () => exec('git status').indexOf('not a git repository') < 0;

    // 获取一下当前的分支
    const getGitBranch = () => {
        if (isGitRepos()) {
            return exec('git branch | grep "*"').match(/^\*\s*(\S*)$/)[1];
        }
        throw new Error(`当前路径不是一个git仓库，Path: ${cwd}`);
    };

    return {
        isGitRepos,
        getGitBranch
    };
};
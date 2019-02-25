module.exports = function () {
    const gitTool = require('./gitool')(process.cwd());
    const isMaster = () => gitTool.getGitBranch().trim() === 'master';
    const isDaily = () => gitTool.getGitBranch().trim().startsWith('daily/');
    const getDailyVersion = () => gitTool.getGitBranch().trim().replace('daily/', '');

    return {
        isMaster,
        isDaily,
        getDailyVersion
    };
};
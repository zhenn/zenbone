module.exports = {
    plugins: [
        // https://github.com/ai/browserslist
        require('autoprefixer')({
            browsers: ['last 100 versions']
        })
    ]
};

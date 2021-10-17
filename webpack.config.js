const path = require('path');

module.exports = {
    mode: 'development',
    entry: './src/main.js',
    output: {
        library: 'Nestled',
        filename: 'nestled.js',
        path: path.resolve(__dirname, 'dist')
    },
    devtool: 'cheap-module-source-map',
    devServer: {
        watchFiles: ['src/**/*.js']
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader'
                }
            },
        ]
    },
};

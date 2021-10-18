const path = require('path');

module.exports = {
    mode: 'development',
    entry: {
        core: {
            import: './core/src/main.js',
            library: {
                name: 'Nestled',
                type: 'var',
            },
        },
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
        clean: true
    },
    devtool: 'cheap-module-source-map',
    devServer: {
        watchFiles: ['core/src/**/*.js']
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

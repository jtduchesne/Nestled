const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
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
        app: {
            import: [
                './app/src/index.js',
                './app/src/style.css',
            ],
            dependOn: 'core',
        },
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
        clean: true
    },
    devtool: 'cheap-module-source-map',
    devServer: {
        watchFiles: ['core/src/**/*.js', 'app/src/**/*']
    },
    module: {
        rules: [
            {
                test: /\.html?$/,
                use: {
                    loader: "html-loader"
                }
            },
            {
                test: /\/fonts?\/?.*?\.(eot|svg|ttf|woff2?)$/,
                type: 'asset',
                generator: {
                    filename: 'fonts/[name][ext]'
                },
            },
            {
                test: /\/images?\/?.*?\.(gif|jpe?g|png|svg)$/,
                type: 'asset/resource',
                generator: {
                    filename: 'images/[name][ext]'
                },
            },
            {
                test: /\.s?css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    "css-loader",
                    "sass-loader",
                ],
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader'
                }
            },
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./app/public/index.html",
            favicon: "./app/public/favicon.ico",
        }),
        new MiniCssExtractPlugin({ filename: "stylesheets/[name].css" }),
    ],
};

const CopyPlugin = require("copy-webpack-plugin");
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
                './app/index.js',
                './app/images/LED.svg',
                './app/stylesheets/style.css',
                './app/stylesheets/groundwork-2.5.0.min.css',
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
        watchFiles: ['core/src/**/*.js', 'app/index.js']
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
            {
                test: /\.(gif|jpe?g|png|svg)$/,
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
        ]
    },
    plugins: [
        new CopyPlugin({
            patterns: [{
                from: "app/public/",
                globOptions: {
                    ignore: "**/app/public/index.html"
                },
            }]
        }),
        new HtmlWebpackPlugin({ template: "./app/public/index.html" }),
        new MiniCssExtractPlugin({ filename: "stylesheets/[name].css" }),
    ],
};

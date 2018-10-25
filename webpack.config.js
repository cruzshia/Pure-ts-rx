var path = require('path');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const SpritesmithPlugin = require('webpack-spritesmith');

module.exports = {
    /* if entry is not set, default is ./src/index.js */
    entry: {
        main: path.resolve(__dirname, 'src/index.ts'),
        // entry2: path.resolve(__dirname, 'src/entry2.js'),
    },
    output: {
        filename: '[name].js?v=[hash]'
    },
    resolve: {
        extensions: ['.js', '.ts'],
        modules: [
            path.resolve(__dirname, 'src/'),
            path.resolve(__dirname, 'node_modules/'),
        ]
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                loader: require.resolve('babel-loader'),
                options: {
                    presets: ['@babel/env'],
                    plugins: [
                        '@babel/proposal-object-rest-spread',
                        '@babel/proposal-class-properties']
                }
            },
            { enforce: "pre", test: /\.js$/, loader: require.resolve('source-map-loader') }, 
            { test: /\.tsx?$/, loader: "awesome-typescript-loader" },
            {
                test: /\.scss$/,
                use: [
                    process.env.NODE_ENV !== 'production' ? require.resolve('style-loader') : MiniCssExtractPlugin.loader,
                    require.resolve('css-loader'), // translates CSS into CommonJS
                    require.resolve('sass-loader') // compiles Sass to CSS, using Node Sass by default
                ]
            }, {
                test: /\.pug$/, 
                loader: require.resolve('pug-loader')
            }, {
                test: /\.(png|gif)$/, 
                loader: require.resolve('file-loader'),
                options: {
                    name: 'images/[name].[ext]'
                }
            }
        ]
    },
    devServer: {
        compress: true,
        port: 8686,
        proxy: {
            '/api': {
                target: 'https://api-dev.langlive.com',
                pathRewrite: {'^/api' : ''},
                secure: false,
                changeOrigin: true
            },
        }
    },
    plugins: [
        new HtmlWebPackPlugin({
            template: path.resolve(__dirname, 'src/index.html'),
            filename: './index.html'
        }),
        new MiniCssExtractPlugin({
            filename: '[name].css',
            chunkFilename: '[id].css'
        }),
        new SpritesmithPlugin({
            src: {
                cwd: path.resolve(__dirname, 'src/images/sprites'),
                glob: '*.png'
            },
            target: {
                image: path.resolve(__dirname, 'src/sprite/sprite.png'),
                css: path.resolve(__dirname, 'src/scss/sprite.scss')
            },
            apiOptions: {
                cssImageRef: "../sprite/sprite.png"
            },
            spritesmithOptions: {
                padding: 15
            }
        })
    ]
};
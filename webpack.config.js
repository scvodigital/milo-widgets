var webpack = require('webpack');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var WriteFilePlugin = require('write-file-webpack-plugin');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var CompressionPlugin = require("compression-webpack-plugin");

var path = require('path');

module.exports = {
    entry: {
        'organisations': './src/js/organisations-widget.ts',
        'opportunities': './src/js/opportunities-widget.ts',
        'opportunities-organisation': './src/js/opportunities-organisation-widget.ts',
        'opportunities-organisations': './src/js/opportunities-organisations-widget.ts',
        'goodhq': './src/js/goodhq-widget.ts'
    },
    output: {
        path: path.join(__dirname, "./compiled"),
        filename: '[name].bundle.js'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                enforce: 'pre',
                loader: 'source-map-loader'
            },
            {
                test: /\.tsx?$/,
                enforce: 'pre',
                use: 'ts-loader'
            },
            {
                test: /\.hbs$/,
                loader: 'handlebars-loader'
            },
            {
                test: /\.json$/,
                loader: 'json-loader'
            },
            {
                test: /\.js$/,
                loader: 'unlazy-loader'
            },
            {
                test: /\.(eot|svg|ttf|woff|woff2)$/,
                loader: 'file?name=compiled/fonts/[name].[ext]'
            },
            {
                test: /\.scss$/,
                use: [
                    'style-loader',
                    'css-loader',
                    {
                        loader: 'sass-loader',
                        options: {
                            includePaths: [path.resolve(__dirname, 'node_modules')],
                        },
                    },
                ],
            },
        ],
    },
    plugins: [
        new WriteFilePlugin(),
        new CopyWebpackPlugin([
            { from: './src/js/require.js', to: './lib/require.js' }
        ]),
        new CopyWebpackPlugin([
            { from: './src/fonts', to: './fonts' }
        ]),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': '"production"'
        }),
        new CompressionPlugin({
            asset: "[path].gz[query]",
            algorithm: "gzip",
            test: /\.js$|\.css$|\.html$/,
            threshold: 10240,
            minRatio: 0
        })
    ],
    resolve: {
        extensions: [".tsx", ".ts", ".js", ".html", ".hbs", ".scss"],
        alias: {
            "handlebars": "handlebars/dist/handlebars.js"
        }
    },
    resolveLoader: {
        alias: {
            "hbs": "handlebars-loader"
        }
    },
    devtool: 'cheap-module-source-map',
    devServer: {
        contentBase: path.join(__dirname, './dist'),
        compress: true,
        port: 9010
    },
    node: {
        fs: 'empty'
    }
};

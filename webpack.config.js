var webpack = require('webpack');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var WriteFilePlugin = require('write-file-webpack-plugin');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var CompressionPlugin = require("compression-webpack-plugin");

var path = require('path');

module.exports = {
    entry: {
        organisations: './src/js/organisations-widget.ts',
        opportunities: './src/js/opportunities-widget.ts',
    },
    output: {
        path: path.join(__dirname, "./dist"),
        filename: '[name].bundle.js',
    },
    module: {
        rules: [
            {
                enforce: 'pre',
                test: /\.js$/,
                loader: "source-map-loader"
            },
            {
                enforce: 'pre',
                test: /\.tsx?$/,
                use: "ts-loader"
            },
            {
                test: /\.hbs$/,
                loader: "handlebars-loader"
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
            { from: './src/index.html' }
        ]),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': '"production"'
        }),
        //new webpack.optimize.UglifyJsPlugin({
        //    mangle: true,
        //    compress: {
        //        warnings: false, // Suppress uglification warnings
        //        pure_getters: true,
        //        unsafe: true,
        //        unsafe_comps: true,
        //        screw_ie8: true
        //    },
        //    output: {
        //        comments: false,
        //    },
        //    exclude: [/\.min\.js$/gi] // skip pre-minified libs
        //}),
        new CompressionPlugin({
            asset: "[path].gz[query]",
            algorithm: "gzip",
            test: /\.js$|\.css$|\.html$/,
            threshold: 10240,
            minRatio: 0
        })
    ],
    resolve: {
        extensions: [".tsx", ".ts", ".js", ".html", ".hbs", ".scss"]
    },
    //devtool: 'inline-source-map',
    devtool: 'cheap-module-source-map',
    devServer: {
        contentBase: path.join(__dirname, './dist'),
        compress: true,
        port: 9000
    },
    node: {
        fs: 'empty'
    }
};
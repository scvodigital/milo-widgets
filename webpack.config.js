var CopyWebpackPlugin = require('copy-webpack-plugin');
var path = require('path');

module.exports = {
    entry: {
        organisations: './src/js/organisations-widget.ts',
        opportunities: './src/js/opportunities-widget.ts',
    },
    output: {
        filename: 'js/[name].bundle.js',
        path: path.join(__dirname, "dist"),
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
            }
        ],
    },
    plugins: [
        new CopyWebpackPlugin([
            { from: './src/index.html' }
        ]),
    ],
    resolve: {
        extensions: [".tsx", ".ts", ".js", ".html", ".hbs"]
    },
    devtool: 'inline-source-map',
    devServer: {
        contentBase: path.join(__dirname, 'dist'),
        compress: true,
        port: 9000
    },
};
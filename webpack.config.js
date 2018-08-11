module.exports = {
    mode: 'development',
    entry: './main.js',
    output: {
        path: __dirname + '/dist',
        filename: 'biu.min.js',
        publicPath: '../dist'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
                options: {
                    "presets": ["env"]
                }
            }
        ]
    },
    devServer: {
        contentBase: __dirname,
    }
}

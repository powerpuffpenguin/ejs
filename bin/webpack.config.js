const path = require('path')
module.exports = {
    target: ['node', 'es5'],
    mode: 'production',
    entry: {
        main: './src/main.ts',
    },
    output: {
        path: path.resolve(__dirname, './dst'),
        filename: "bundle.js",
        libraryTarget: "commonjs",
    },
    module: {
        rules: [
            { test: /\.ts$/, use: 'ts-loader' }
        ],
    },
    externals: [
        "ejs",
        /^ejs\//,
    ],
    resolve: {
        modules: [
            'node_modules/'
        ],
        descriptionFiles: ['package.json'],
        extensions: ['.ts'],
    },
}
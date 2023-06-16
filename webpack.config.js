const CopyPlugin = require('copy-webpack-plugin')
const Dotenv = require('dotenv-webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { nanoid } = require('nanoid')
const path = require('path')

module.exports = (env) => {
  let outputPath
  if (env?.production) {
    outputPath = path.resolve(__dirname, 'dist/prod')
    require('dotenv').config({ path: `.env.production` })
  } else {
    outputPath = path.resolve(__dirname, 'dist/dev')
    require('dotenv').config({ path: `.env.development` })
  }

  return {
    entry: './src/integration.js',
    output: {
      path: outputPath,
      library: 'DonmoRoundup',
      libraryExport: 'default',
      filename: 'integration.js',
    },
    plugins: [
      new Dotenv({
        path: env?.production ? './.env.production' : './.env.development',
      }),
      new HtmlWebpackPlugin({
        template: './src/static/integration.html',
        filename: 'integration.html',
        minify: {
          collapseWhitespace: true,
          keepClosingSlash: true,
          minifyCSS: true,
          ignoreCustomFragments: [/<[/br>]*>/, /<[/img>]*>/],
        },
      }),
      new HtmlWebpackPlugin({
        filename: 'testing/template.html',
        template: './testing/template.html',
        params: {
          publicKey: process.env.DONMO_PUBLIC_KEY,
          language: 'uk',
          orderId: nanoid(10),
        },
        inject: false,
      }),
      new CopyPlugin({
        patterns: [
          { from: './src/static/translations.json' },
          {
            from: './testing/*.js',
          },
        ],
      }),
    ],
  }
}

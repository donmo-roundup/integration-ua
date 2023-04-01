const { minify } = require('html-minifier')
const fs = require('fs')
const path = require('path')
let originalHtml = fs
  .readFileSync(path.join(__dirname, '../integration.html'))
  .toString()

const minifiedHtml = minify(originalHtml, {
  collapseWhitespace: true,
  removeComments: true,
  collapseBooleanAttributes: true,
  useShortDoctype: true,
  removeEmptyAttributes: true,
  removeOptionalTags: true,
  minifyJS: true,
  minifyCSS: true,
})

fs.writeFileSync(
  path.join(__dirname, '../../dist/integration.min.html'),
  minifiedHtml
)

const path = require('path')
const webpack = require('webpack')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')

const ROOT_DIR = path.resolve(__dirname, '..')
const ENV_PATH = path.resolve(__dirname, `../.env.${process.env.NODE_ENV}`)

require('dotenv').config({path: ENV_PATH, silent: true})

const config = require('./')

/** entry points (bundles) */
const entry = {
  app: [
    'babel-polyfill',
    './client'
  ]
}
if (config.app.hotReload) {
  entry.app.splice(1, 'webpack-hot-middleware/client')
}
if (config.app.minify) {
  entry.vendor = [
    'raven-js',
    'react',
    'react-dom',
    'react-redux',
    'react-router',
    'react-router-redux',
    'redux',
    'redux-auth-wrapper',
    'redux-thunk',
  ]
}

/** output paths */
const output = {
  filename: '[name].js',
  chunkFilename: 'app_[name]_[chunkhash].js',
  path: path.join(ROOT_DIR, 'dist'),
}

/** source maps */
const devtool = config.app.minify ?
  '#cheap-module-source-map' :
  '#cheap-module-eval-source-map'

/** resolving module paths */
const resolve = {
  extensions: ['', '.js', '.jsx', '.scss'],
  root: ROOT_DIR,
}

/** plugins */
const plugins = [
  new webpack.DefinePlugin({
    'process.env': {
      // useful to reduce the size of client-side libraries, e.g. react
      NODE_ENV: JSON.stringify(process.env.NODE_ENV),
      IDM_BASE_URL: JSON.stringify(config.idm.baseURL),
      ECHO_BASE_URL: JSON.stringify(config.echo.baseURL),
    },
    '__CLIENT__': true,
    '__SERVER__': false
  })
]
if (config.app.hotReload) {
  plugins.push(new webpack.HotModuleReplacementPlugin())
}
if (config.app.noErrors) {
  plugins.push(new webpack.NoErrorsPlugin())
}
if (config.app.minify) {
  plugins.push(
    new ExtractTextPlugin('[name].css'),
    new OptimizeCssAssetsPlugin({
      cssProcessorOptions: {discardComments: {removeAll: true}},
      canPrint: false,
    }),
    new webpack.optimize.CommonsChunkPlugin({
      names: ['vendor'],
      minChunks: Infinity
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
      },
      output: {
        comments: false,
      },
    })
  )
}

/** file loaders */
const loaderKey = config.app.minify ? 'loader' : 'loaders'
const loaders = [
  {
    test: /\.jsx?$/,
    loader: 'babel',
    exclude: /node_modules/,
    query: config.app.hotReload ? {
      plugins: [
        ['react-transform', {
          transforms: [{
            transform: 'react-transform-hmr',
            imports: ['react'],
            locals: ['module'],
          }]
        }]
      ],
    } : null,
  },

  // global styles that SHOULDN'T be converted into component-specific modules
  {
    test: /.s?css$/,
    [loaderKey]: config.app.minify ? ExtractTextPlugin.extract(
      'style',
      'css?sourceMap&importLoaders=2' +
      '!sass?sourceMap'
    ) : [
      'style',
      'css?sourceMap&importLoaders=2',
      'sass?sourceMap',
    ],
    include: [
      path.resolve(ROOT_DIR, 'common', 'containers', 'Root.scss'),
      path.resolve(ROOT_DIR, 'node_modules', 'graphiql', 'graphiql.css')
    ],
  },

  // component styles that SHOULD be converted into component-specific modules
  {
    test: /\.s?css$/,
    [loaderKey]: config.app.minify ? ExtractTextPlugin.extract(
      'style',
      'css?sourceMap&modules&localIdentName=[name]__[local]__[hash:base64:5]&importLoaders=3' +
      '!sass?sourceMap'
    ) : [
      'style',
      'css?sourceMap&modules&localIdentName=[name]__[local]__[hash:base64:5]&importLoaders=3',
      'sass?sourceMap',
    ],
    include: [
      path.resolve(ROOT_DIR, 'common'),
    ],
    exclude: [
      path.resolve(ROOT_DIR, 'common', 'containers', 'Root.scss'),
    ],
  },

  {
    test: /\.json$/,
    loader: 'json-loader'
  },

  {
    test: /\.(woff2?|ttf|eot|svg)$/,
    loaders: ['url?limit=10000'],
  },
]

module.exports = {
  entry,
  output,
  devtool,
  resolve,
  plugins,
  context: ROOT_DIR,
  module: {loaders},
  toolbox: {theme: './common/theme.scss'}
}

const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
	entry: './src/game.ts',
	output: {
		filename: 'game.bundle.js',
		path: path.resolve(__dirname, '../dist')
	},
	resolve: {
		alias: {
			'@src': path.resolve(__dirname, '../src/')
		},
		extensions: ['.ts', '.js']
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				loader: 'ts-loader',
				exclude: [
					/node_modules/,
					/src\/assets\/tilemaps\/.*\.tsx$/,  // Exclude tilemap tsx files
				],
				options: {
					// Tell ts-loader to continue compiling even with TypeScript errors
					transpileOnly: true
				}
			},
			{
				test: /\.js$/,
				include: path.resolve(__dirname, '../src'),
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['@babel/preset-env']
					}
				}
			},
			// Add a rule to handle .tsx files in assets as raw files
			{
				test: /src\/assets\/tilemaps\/.*\.tsx$/,
				use: 'raw-loader'  // Use raw-loader for these files
			}
		]
	},
	optimization: {
		splitChunks: {
			cacheGroups: {
				commons: {
					test: /[\\/]node_modules[\\/]|[\\/]src[\\/]plugins[\\/]/,
					name: 'vendors',
					chunks: 'all',
					filename: '[name].bundle.js'
				}
			}
		}
	},
	plugins: [
		new HtmlWebpackPlugin({
			options: {
				env: process.env.NODE_ENV
			},
			inject: true,
			template: 'src/index.ejs',
			minify: process.env.NODE_ENV === 'production' && {
				collapseWhitespace: true,
				removeComments: true,
				minifyCSS: true,
				minifyJS: true
			}
		}),
		new CopyWebpackPlugin([
			{ from: 'src/assets', to: 'assets' },
			{ from: 'src/pwa', to: '' },
			{ from: 'src/favicon.ico', to: '' }
		])
	]
};

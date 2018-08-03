const fs = require('fs-extra')
const path = require('path')
const chalk = require('chalk')
const { exec, spawn } = require('child_process')
const figlet = require('figlet')
const log = console.log
const error = console.error
const { existsSync } = require('fs')
const config = require('./config')

const findIndex = (arg, command) => { arg.findIndex((element) => element === command) }
const action = {
	copyTemplate: (_, options) => {
		const template = options.using ? options.using : 'default'
		const src = path.resolve(path.dirname(require.main.filename) + '/templates/' + template)
		const dest = path.resolve('./')
		const filter = (_, dest) => {
			log(`${chalk.blue.bold(config.install.generate)} ${dest}`)
			return true
		}
		const installModule = () => {
			log(chalk.green(config.install.progress))
			// install module
			exec('npm install', (err) => {
				if (err) return error(err)
				log(chalk.blue.bold(config.install.complete))
				log(chalk.blue.bold(config.install.completeInstruct))
				figlet(config.install.thanx, (err, data) => {
					if (err) return error(err)
					log(chalk.green(data))
				})
			})
		}
		// copy our template
		fs.copy(src, dest, { filter: filter }, err => {
			if (err) return error(err)
			const date = new Date()
			const now = `on ${date.getFullYear()}-${date.getMonth()}-${date.getDate()} at ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
			log(chalk.blue.bold(config.install.ready))
			if (options.gitInit) {
				// find for .git folder
				if (!existsSync(path.resolve('./.git'))) {
					// initialize git repo
					log(chalk.green(config.install.git))
					// exec git command
					exec(config.install.gitCommit(now), (err) => {
						if (err) return error(err)
						log(chalk.blue.bold(config.install.gitInitialized))
						installModule()
					})
				} else {
					installModule()
				}
			} else {
				installModule()
			}
		})
	},
	/**
	 * copy template into the dest folder
	 */
	copy: (arg, name, options) => {
		// find index of arg
		const findIndexNewCommand = findIndex(arg, 'new')
		if (findIndexNewCommand !== -1) {
			log(chalk.green(config.install.generateTpl))
			if (!name) {
				action.copyTemplate(name, options)
			} else {
				fs.ensureDir(name, () => {
					process.chdir(name)
					action.copyTemplate(name, options)
				})
			}
		} else {
			throw new Error(config.install.error)
		}
	},
	/**
	 * front serve [-p [--port] <port>, -h [--host] <host>]
	 * @param options
	 */
	serve: (arg, options) => {
		const findIndexServeCommand = findIndex(arg, 'serve')
		if (findIndexServeCommand !== -1) {
			// defined env var
			if (options.port) process.env.PORT = options.port
			if (options.host) process.env.HOST = options.host

			const webpackDevServerCommand = path.resolve('./node_modules/.bin/webpack-dev-server')
			const webpackDevServer = /^win/.test(process.platform) ? `${webpackDevServerCommand}.cmd` : webpackDevServerCommand
			// execute webpack-dev-server command
			const start = spawn(webpackDevServer, ['--mode', 'development', '--hot'])

			// add log
			log(chalk.green(config.install.start(options)))

			start.stdout.on('data', (data) => {
				console.log(data.toString('utf-8'))
			})
			start.stderr.on('data', (data) => {
				console.log(`stderr: ${data.toString('utf-8')}`);
			});
		}
	},
	/**
	 * front build [--absolute]
	 */
	build: (arg, options) => {
		const findIndexBuildCommand = findIndex(arg, 'build')
		if (findIndexBuildCommand !== -1) {
			const webpackCommand = path.resolve('./node_modules/.bin/webpack')
			const webpack = /^win/.test(process.platform) ? `${webpackCommand}.cmd` : webpackCommand
			// set MODE_ABS env
			console.log(options.wpTheme)
			if (options.absolute && options.wpTheme) {
				console.error('Cannot use both --absolute and --wp-theme');
			}

			if (options.absolute) {
				process.env.MODE_ABS = options.absolute
			}

			if (options.wpTheme) {
				process.env.MODE_WP = options.wpTheme
			}

			const execWebpackCommand = () => {
				// execute webpack command
				const webpackSpwaned = spawn(webpack, ['--mode', 'production', '--progress'])
				webpackSpwaned.stdout.on('data', (data) => {
					log(data.toString('utf-8'))
				})
				webpackSpwaned.stderr.on('data', (data) => {
					log(`stderr: ${data.toString('utf-8')}`)
				})
			}
			if (existsSync(path.resolve('./src/assets/dist'))) {
				exec('rm -rf src/assets/dist', (err, data) => {
					if (err) return error(err)
					execWebpackCommand()
				})
			} else {
				execWebpackCommand()
			}
		}
	}
}

module.exports = action
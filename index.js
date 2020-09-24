const getOptions = require('loader-utils').getOptions
const defaults = require('lodash.defaults')

const parseDependencies = require('./lib/parse_dependencies')
const addDependencies = require('./lib/add_dependencies')
const runner = require('./lib/runner')

module.exports = function railsViewLoader (source, map) {
  const loader = this

  // Mark loader cacheable. Must be called explicitly in webpack 1.
  // see: https://webpack.js.org/guides/migrating/#cacheable
  loader.cacheable()

  // Get options passed in the loader query, or use defaults.
  // Modifying the return value of `getOptions` is not permitted.
  const config = defaults({}, getOptions(loader), {
    dependenciesRoot: 'app',
    runner: './bin/rails runner',
    runnerOptions: {}
  })

  // Dependencies are only useful in development, so don't bother searching the
  // file for them otherwise.
  const dependencies = process.env.NODE_ENV === 'development'
    ? parseDependencies(loader, source, config.dependenciesRoot)
    : []

  const callback = loader.async()

  // Register watchers for any dependencies.
  addDependencies(loader, dependencies, (error) => {
    if (error) {
      callback(error)
    } else {
      runner(source, loader, config, map, callback)
    }
  })
}

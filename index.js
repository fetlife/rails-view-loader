var exec = require('child_process').exec
var path = require('path')
var uuid = require('node-uuid')
var loaderUtils = require('loader-utils')
var defaults = require('lodash.defaults')

function pushAll (dest, src) {
  Array.prototype.push.apply(dest, src)
}

/* Match any block comments that start with the string `rails-erb-loader-*`. */
var configCommentRegex = /\/\*\s*rails-erb-loader-([a-z-]*)\s*([\s\S]*?)\s*\*\//g

/* Match any path ending with a file extension */
var fileExtensionRegex = /\.\w*$/

/* Takes a path and attaches `.rb` if it does not already have an extension. */
function defaultFileExtension (dependency) {
  return fileExtensionRegex.test(dependency) ? dependency : dependency + '.rb'
}

function parseBool (string) {
  switch (string) {
    case '': return true
    case 'true': return true
    case 'false': return false
  }
  throw new TypeError('Expected either "true" or "false", got "' + string + '".')
}

// Get each space separated path, ignoring any empty strings.
function parseDependencies (root, string) {
  return string.split(/\s+/).reduce(function(accumulator, dependency) {
    if (dependency.length > 0) {
      var absolutePath = path.resolve(root, defaultFileExtension(dependency))
      accumulator.push(absolutePath)
    }
    return accumulator
  }, [])
}

/* Update config object in place with comments from file */
function parseComments (source, config) {
  var match = null
  while ((match = configCommentRegex.exec(source))) {
    var option = match[1]
    var value = match[2]
    switch (option) {
      case 'dependency':
      case 'dependencies':
        var dependencies = parseDependencies(config.dependenciesRoot, value)
        pushAll(config.dependencies, dependencies)
        break
      case 'cacheable':
        try {
          config.cacheable = parseBool(value)
        } catch (e) {
          console.warn('WARNING: `rails-erb-loader-cacheable`: ' + e.message)
        }
        break
      case 'dependencies-root':
        config.dependenciesRoot = value
        break
      default:
        console.warn(
          'WARNING: Unrecognized configuration command ' +
          '"rails-erb-loader-' + option + '". Comment ignored.'
        )
    }
  }
}

/* Launch Rails in a child process and run the `erb_transformer.rb` script to
 * output transformed source.
 */
function transformSource (source, map, callback) {
  var ioDelimiter = uuid.v4()
  var child = exec(
    './bin/rails runner ' + path.join(__dirname, 'erb_transformer.rb') + ' ' + ioDelimiter,
    function (error, stdout) {
      // Output is delimited to filter out unwanted warnings or other output
      // that we don't want in our files.
      var sourceRegex = new RegExp(ioDelimiter + '([\\s\\S]+)' + ioDelimiter)
      var matches = stdout.match(sourceRegex)
      var transformedSource = matches && matches[1]
      callback(error, transformedSource, map)
    }
  )
  child.stdin.write(source)
  child.stdin.end()
}

module.exports = function railsErbLoader (source, map) {
  var loader = this

  // Get options passed in the loader query, or use defaults.
  var config = defaults(loaderUtils.getLoaderConfig(loader, 'railsErbLoader'), {
    cacheable: true,
    dependencies: [],
    dependenciesRoot: 'app',
    parseComments: true
  })

  // loader-utils does not support parsing arrays, so we might have to do it
  // ourselves.
  if (typeof config.dependencies === 'string') {
    config.dependencies = parseDependencies(
      config.dependenciesRoot,
      config.dependencies
    )
  }

  // Update `config` object in place with any parsed comments.
  if (config.parseComments) {
    parseComments(source, config)
  }

  // Mark file as cacheable - it will not be rebuilt until it or any of its
  // dependencies are changed.
  if (config.cacheable) {
    loader.cacheable()
  }

  // Register watchers for any dependencies.
  config.dependencies.forEach(function (dependency) {
    loader.addDependency(dependency)
  })

  // Now actually transform the source.
  var callback = loader.async()
  transformSource(source, map, callback)
}

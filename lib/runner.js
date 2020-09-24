const path = require('path')
const execFile = require('child_process').execFile
const retry = require('retry')

/* Create a delimeter that is unlikely to appear in parsed code. I've split this
 * string deliberately in case this file accidentally ends up being transpiled
 */
const delimiter = `${'_'}_RAILS_VIEW_LOADER_DELIMETER__`
const sourceRegex = new RegExp(`${delimiter}([\\s\\S]+)${delimiter}`)

class EmptyResultError extends Error {}

/* Launch Rails in a child process and run the `view_render.rb` script to
 * output transformed source.
 */
const run = (source, loader, config, map, callback) => {
  const runner = parseRunner(config.runner)
  const child = execFile(
    runner.file,
    runner.arguments.concat(path.join(__dirname, 'view_render.rb')),
    config.runnerOptions,
    (error, stdout) => {
      // Output is delimited to filter out unwanted warnings or other output
      // that we don't want in our files.
      const matches = stdout.match(sourceRegex)
      const transformedSource = matches && matches[1]
      if (transformedSource) {
        callback(error, transformedSource, map)
      } else if (error) {
        callback(error, stdout, map)
      } else {
        // Runner sometimes raises no error but returns empty result.
        // Retry 3 times to confirm.
        const warning = new EmptyResultError(
          `rails-view-loader gets an empty result from rails. resource: "${
            loader.resource}".`
        )
        callback(warning, '', map)
      }
    }
  )
  const input = {
    delimiter,
    resource: loader.resource,
    layout: config.layout,
    variant: config.variant,
    source: source,
  }
  child.stdin.on('error', (error) => {
    const message = new Error(
      'rails-view-loader encountered an unexpected error while writing to stdin. Please report this to the maintainers.'
    )
    loader.emitError(error)
    loader.emitError(message)
  })
  child.stdin.write(JSON.stringify(input))
  child.stdin.end()
}

const retryRun = (source, loader, config, map, callback) => {
  const operation = retry.operation({ retries: 3, minTimeout: 0, maxTimeout: 10 })
  operation.attempt((currentAttempt) => {
    run(source, loader, config, map, (error, output, map) => {
      if (operation.retry(error)) {
        return
      }
      if (error instanceof EmptyResultError) {
        loader.emitWarning(error)
        callback(null, '', map)
      } else {
        callback(error ? operation.mainError() : null, output, map)
      }
    })
  })
}

/* Split the `runner` string into a `.file` and its `.arguments` */
const parseRunner = (runner) => {
  const runnerArguments = runner.split(' ')
  const runnerFile = runnerArguments.shift()

  return { file: runnerFile, arguments: runnerArguments }
}

module.exports = (source, loader, config, map, callback) => {
  retryRun(source, loader, config, map, callback)
}

const axios = require('axios')
const retry = require('retry')

const MAX_TIMEOUT = 20000
const RETRIES = 5
class ServerNotRunningError extends Error {}
class ServerError extends Error {}

// send request to server and get the response
const run = (source, loader, config, map, callback) => {
  const url = `http://${config.host}:${config.port}`
  const input = {
    resource: loader.resource,
    layout: config.layout,
    variant: config.variant,
    source: source,
  }
  axios.post(url, input).then((response) => {
    if (response.status === 200) {
      callback(null, response.data, map)
    } else {
      callback(response.statusText, response.data, map)
    }
  }).catch((error) => {
    if (error.response) {
      callback(new ServerError(`Error from the server #${error.response.status}: ${JSON.stringify(error.response.data)}`), null, map)
    } else {
      callback(new ServerNotRunningError(error.message), null, map)
    }
  })
}

const retryRun = (source, loader, config, map, callback) => {
  const operation = retry.operation({ retries: RETRIES, minTimeout: 500, maxTimeout: MAX_TIMEOUT })
  operation.attempt((currentAttempt) => {
    if (currentAttempt > 1) {
      console.log("Retrying connection to the rails-view-loader server")
    }
    run(source, loader, config, map, (error, output, map) => {
      if (error instanceof ServerError) {
        loader.emitError(error)
        callback(error, output, map)
        return // no point retrying
      }
      if (operation.retry(error)) {
        return
      }
      if (error instanceof ServerNotRunningError) {
        loader.emitError(error)
        callback(error, '', map)
      } else {
        callback(error ? operation.mainError() : null, output, map)
      }
    })
  })
}

module.exports = (source, loader, config, map, callback) => {
  retryRun(source, loader, config, map, callback)
}

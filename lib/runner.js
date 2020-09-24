const axios = require('axios')
const retry = require('retry')

class ServerNotRunningError extends Error {}

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
      callback("Error from the server: "+error.response.status, null, map)
    } else {
      callback(new ServerNotRunningError(error.message), null, map)
    }
  })
}

const retryRun = (source, loader, config, map, callback) => {
  const operation = retry.operation({ retries: 5, minTimeout: 500, maxTimeout: 10000 })
  operation.attempt((currentAttempt) => {
    if (currentAttempt > 1) {
      console.log("Retryring to connect to the server")
    }
    run(source, loader, config, map, (error, output, map) => {
      if (operation.retry(error)) {
        return
      }
      if (error instanceof ServerNotRunningError) {
        loader.emitWarning(error)
        callback(null, '', map)
      } else {
        callback(error ? operation.mainError() : null, output, map)
      }
    })
  })
}

module.exports = (source, loader, config, map, callback) => {
  retryRun(source, loader, config, map, callback)
}

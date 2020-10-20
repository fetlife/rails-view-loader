const spawn = require('child_process').spawn
const path = require('path')

let instance = null

/* Launch Rails in a child process and run the `server.rb` script to
 * output transformed source.
 */

const start = (loader, config, onError) => {
  if (instance) {
    return
  }
  console.log(`Starting rails-view-loader server on http://${config.host}:${config.port} ${process.env.NODE_ENV}`)

  instance = spawn(
    config.runner,
    config.runnerArgs.concat([path.join(__dirname, 'server.rb'), config.port, config.host]),
    { stdio: 'inherit', detached: true },
    (error) => {
      if (error) {
        onError(error)
      }
    }
  )
  instance.unref()
  instance.addListener('exit', (code) => {
    instance = null
    onError(code)
  })

  process.on('exit', () => {
    if (instance) {
      console.log("Killing rails-view-server server")
      instance.kill("SIGINT")
      instance = null
    }
  })

  return instance
}

module.exports = (loader, config, onError) => {
  return start(loader, config, onError)
}

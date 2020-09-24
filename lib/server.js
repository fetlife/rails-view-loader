const execFile = require('child_process').execFile
const path = require('path')

let instance = null

/* Launch Rails in a child process and run the `server.rb` script to
 * output transformed source.
 */

const start = (config, onError) => {
  if (instance) {
    return
  }
  console.log("Starting server")

  instance = execFile(
    config.runner,
    ["runner", path.join(__dirname, 'server.rb')],
    { stdio: 'inherit' },
    (error, _stdout) => {
      if (error) {
        onError(error)
      }
    }
  )
  instance.addListener('exit', (code) => {
    instance = null
    onError(code)
  })
}

module.exports = (config, onError) => {
  start(config, onError)
}

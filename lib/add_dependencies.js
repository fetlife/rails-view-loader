const fs = require('fs')

module.exports = (loader, paths, callback) => {
  let remaining = paths.length

  if (remaining === 0) callback(null)

  paths.forEach((path) => {
    fs.stat(path, (error, stats) => {
      if (error) {
        if (error.code === 'ENOENT') {
          callback(new Error(`Could not find dependency "${path}"`))
        } else {
          callback(error)
        }
      } else {
        if (stats.isFile()) {
          loader.addDependency(path)
        } else if (stats.isDirectory()) {
          loader.addContextDependency(path)
        } else {
          const warning = new Error(
            'rails-view-loader ignored dependency that was neither a file nor a directory'
          )
          loader.emitWarning(warning)
        }
        remaining--
        if (remaining === 0) callback(null)
      }
    })
  })
}

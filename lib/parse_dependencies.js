const path = require('path')

/* Match any block comments that start with the string `rails-view-loader-*`. */
// const configCommentRegex = /\s*rails-view-loader-([a-z-]*)\s*([\s\S]*?)\s*/g
const configCommentRegex = /\/\*\s*rails-view-loader-([a-z-]*)\s*([\s\S]*?)\s*\*\//g

/* Takes a path and attaches `.rb` if it has no extension nor trailing slash. */
const defaultFileExtension = (dependency) => {
  return /((\.\w*)|\/)$/.test(dependency) ? dependency : `${dependency}.rb`
}

const pushAll = (dest, src) => {
  Array.prototype.push.apply(dest, src)
}

/* Get each space separated path, ignoring any empty strings. */
const parseDependenciesList = (root, string) => {
  return string.split(/\s+/).reduce((accumulator, dependency) => {
    if (dependency.length > 0) {
      const absolutePath = path.resolve(root, defaultFileExtension(dependency))
      accumulator.push(absolutePath)
    }
    return accumulator
  }, [])
}

/* Update config object in place with comments from file */
module.exports = (loader, source, root) => {
  const dependencies = []
  let match = null
  while ((match = configCommentRegex.exec(source))) {
    const option = match[1]
    const value = match[2]
    switch (option) {
      case 'dependency':
      case 'dependencies':
        pushAll(dependencies, parseDependenciesList(root, value))
        break
      default:
        const warning = new Error(
          `WARNING: Unrecognized configuration command "rails-view-loader-${
            option}". Comment ignored.`
        )
        loader.emitWarning(warning)
    }
  }
  return dependencies
}

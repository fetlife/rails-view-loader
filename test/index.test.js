/* global test expect describe */

const MemoryFS = require('memory-fs')
const path = require('path')
const webpack = require('webpack')

const fs = new MemoryFS()
const compile = (config, callback) => {
  config.runner = config.runner || 'bin/rails runner'
  config.variant = config.variant
  config.layout = config.layout
  config.runnerOptions = config.runnerOptions || { cwd: path.join(__dirname) }
  const extension = config.extension
  const entry = config.entry || `./test/app/views/${extension}/${config.file}.${extension}`
  const compiler = webpack({
    entry,
    module: {
      loaders: [
        {
          test: /\.(erb|slim|haml)$/,
          use: [
            'html-loader',
            {
              loader: './index',
              options: {
                runner: config.runner,
                runnerOptions: config.runnerOptions,
                dependenciesRoot: './test/app'
              }
            }
          ]
        }
      ]
    },
    output: {
      filename: './output.js'
    }
  })
  compiler.outputFileSystem = fs
  compiler.run(callback)
}

const compile2 = (config, done, successCallback) => {
  compile(config, (err, stats) => {
    if (err) {
      /* global fail error */
      fail(error)
      done()
      return
    }
    successCallback(stats)
  })
}

const readOutput = () => {
  const fileContent = fs.readFileSync(path.resolve(__dirname, '../output.js'))
  return fileContent.toString()
}

const expectInOutput = (str) => {
  expect(readOutput()).toEqual(expect.stringMatching(str))
}

'erb slim haml'.split(' ').forEach((extension) => {
  describe(`Render ${extension}`, () => {
    test(`loads a simple .${extension} file`, (done) => {
      compile2({ file: 'simple.html', extension }, done, ({ compilation }) => {
        expect(compilation.errors).toEqual([])
        expectInOutput(/<div class=\\?["']helloWorld\\?["']>Hello World<\/div>/)
        done()
      })
    })

    describe('in development', () => {
      /* global beforeEach afterEach */
      beforeEach(() => {
        this.prevEnv = process.env.NODE_ENV
        process.env.NODE_ENV = 'development'
      })

      afterEach(() => {
        process.env.NODE_ENV = this.prevEnv
      })

      test('loads single file dependencies', (done) => {
        compile2({ file: 'dependencies.html', extension }, done, ({ compilation }) => {
          expect(compilation.errors).toEqual([])
          const fileDependencies = compilation.fileDependencies
          expect(fileDependencies).toHaveLength(3)

          const dependency = fileDependencies.find((x) => x.match(/\/app\/models\/dependency.rb/))
          const version = fileDependencies.find((x) => x.match(/\/app\/models\/dependency\/version.rb/))
          expect(dependency).toBeDefined()
          expect(version).toBeDefined()

          done()
        })
      })

      test('loads directory dependencies', (done) => {
        compile2({ file: 'dependencies-all.html', extension }, done, ({ compilation }) => {
          expect(compilation.errors).toEqual([])
          const dependency = compilation.fileDependencies.find((x) => x.match(/\/app\/models\/dependency.rb/))
          expect(compilation.fileDependencies).toHaveLength(2) // dependency and the template file itself
          expect(dependency).toBeDefined()
          expect(compilation.contextDependencies).toHaveLength(1)
          expect(compilation.contextDependencies[0]).toMatch(/\/app\/models\/dependency/)

          done()
        })
      })

      test('ignores symbol links', (done) => {
        compile2({ file: 'symbol-link-dependency.html', extension }, done, ({ compilation: { warnings } }) => {
          expect(warnings).toHaveLength(1)
          expect(warnings[0].message).toMatch(/ignored dependency/)
          done()
        })
      })

      test('reports missing dependencies', (done) => {
        compile2({ file: 'missing-dependency.html', extension }, done, ({ compilation: { errors } }) => {
          expect(errors).toHaveLength(1)
          expect(errors[0].message).toMatch(/Could not find dependency/)
          done()
        })
      })
    })
  })
})

test('reports empty file', (done) => {
  compile2({ file: 'empty.html', extension: 'slim' }, done, ({ compilation: { warnings } }) => {
    expect(warnings).toHaveLength(1)
    expect(warnings[0].message).toMatch(/gets an empty result from rails/)
    done()
  })
})

test('reports bad runner', (done) => {
  compile2({ file: 'simple.html', runner: './bin/runner', extension: 'slim' }, done, ({ compilation: { errors } }) => {
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toMatch(/spawn .\/bin\/runner ENOENT/)
    done()
  })
})

test('reports bad file', (done) => {
  compile2({ file: 'bad_file.html', extension: 'slim' }, done, ({ compilation: { errors } }) => {
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toMatch(
      /undefined local variable or method `helpers_not_exist'/
    )
    done()
  })
})

describe('in development', () => {
  beforeEach(() => {
    this.prevEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
  })

  afterEach(() => {
    process.env.NODE_ENV = this.prevEnv
  })

  test('reports unknown magic comment', (done) => {
    compile2({ file: 'unknow_command.html', extension: 'slim' }, done, ({ compilation: { warnings } }) => {
      expect(warnings).toHaveLength(1)
      expect(warnings[0].message).toMatch(
        /Unrecognized configuration command/
      )
      done()
    })
  })
})

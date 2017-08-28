# rails-view-loader

[![npm
version](https://img.shields.io/npm/v/rails-view-loader.svg?style=flat-square)](https://www.npmjs.com/package/rails-view-loader)
[![npm
downloads](https://img.shields.io/npm/dm/rails-view-loader.svg?style=flat-square)](https://npm-stat.com/charts.html?package=rails-view-loader&from=2017-8-28)
[![Standard - JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](http://standardjs.com/)
[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)
[![Build Status: Linux](https://travis-ci.org/aptx4869/rails-view-loader.svg?branch=master)](https://travis-ci.org/aptx4869/rails-view-loader)
[![Coverage Status](https://coveralls.io/repos/github/aptx4869/rails-view-loader/badge.svg?branch=master)](https://coveralls.io/github/aptx4869/rails-view-loader?branch=master)
[![License](http://img.shields.io/badge/license-MIT-brightgreen.svg)](http://opensource.org/licenses/MIT)

> View (`.html.slim` , `.html.erb`, `.html.haml`) `webpack` loader for Rails projects.

Transform Rails view template files to html.
Files are render using `ApplicationController.render`

## Table of Contents

- [Install](#install)
- [Usage](#usage)
- [Configuration](#configuration)
  - [Options](#options)
  - [Dependencies](#dependencies)
  - [ActionPack Variants](#actionpack-variants)
  - [Layout](#layout)
- [Contribute](#contribute)
- [License](#license)

## Install

### npm

```
npm install rails-view-loader --save-dev
```

### yarn

```
yarn add -D rails-view-loader
```

## Usage

Add `rails-view-loader` to your rules.

```js
// webpack.config.js

module.exports = {
    module: {
      rules: [
        {
          test: /\.html\.(erb|slim|haml)$/,
          enforce: 'pre',
          loader: 'rails-view-loader'
        },
      ]
    }
  }
};
```

Now you can import your view files in your project, for example:

`app/view/registration/new.html.erb`

```erb
<%# /* rails-view-loader-dependencies models/user */ %>
<h2>Sign up</h2>

<%= angular_form_for(User.new, url: registration_path(:user)) do |f| %>
  <div class="form-inputs">
    <%= f.input :email, required: true, autofocus: true %>
    <%= f.input :password, required: true %>
    <%= f.input :password_confirmation, required: true %>
  </div>

  <div class="form-actions">
    <%= f.button :submit, "Sign up" %>
  </div>
<% end %>
```

## Configuration

### Options

Can be configured with [UseEntry#options](https://webpack.js.org/configuration/module/#useentry).

| Option | Type | Default | Description |
| ------ |----- | ------- | ----------- |
| `dependenciesRoot` | `String` | `"app"` | The root of your Rails project, relative to webpack's working directory. |
| `runner` | `String` |  `"./bin/rails runner"` | Command to run Ruby scripts, relative to webpack's working directory. |
| `runnerOptions` | `Object` | `{}` | Command to run Ruby scripts, relative to webpack's working directory. |
| `variant` | `String` | `null` | ActionPack Variants |

For example, if your webpack process is running in a subdirectory of your Rails project:

```js
{
  loader: 'rails-view-loader',
  options: {
    runner: '../bin/rails runner',
    dependenciesRoot: '../app',
  }
}
```

### Dependencies

If your view files depend on files in your Ruby project, you can list them explicitly.
Inclusion of the `rails-view-loader-dependency` (or `-dependencies`) comment
wrapped in `/* */` will tell webpack to watch these files -
causing webpack-dev-server to rebuild when they are changed.

#### Watch individual files

List dependencies in the comment. `.rb` extension is optional for ruby files.

```slim
/* rails-view-loader-dependencies ../config/config.yml models/user */
```

#### Watch a whole directory

To watch all files in a directory, end the path in a `/`.

```erb
<%# /* rails-view-loader-dependencies ../config/locales/ */ %>
```

### ActionPack Variants

ActionPack Variants

## Contribute

Questions, bug reports and pull requests welcome. See [GitHub issues](https://github.com/usabilityhub/rails-view-loader/issues).

## License

MIT

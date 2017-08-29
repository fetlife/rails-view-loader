# rails-view-loader

[![npm version](https://img.shields.io/npm/v/rails-view-loader.svg)](https://www.npmjs.com/package/rails-view-loader)
[![npm downloads](https://img.shields.io/npm/dm/rails-view-loader.svg)](https://npm-stat.com/charts.html?package=rails-view-loader&from=2017-8-28)
[![Standard - JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg)](https://github.com/RichardLitt/standard-readme)
[![Build Status: Linux](https://img.shields.io/travis/aptx4869/rails-view-loader.svg)](https://travis-ci.org/aptx4869/rails-view-loader)
[![Coverage Status](https://img.shields.io/coveralls/aptx4869/rails-view-loader.svg)](https://coveralls.io/github/aptx4869/rails-view-loader)
[![License](http://img.shields.io/badge/license-MIT-brightgreen.svg)](http://opensource.org/licenses/MIT)

> Rails view files (`.html.slim` , `.html.erb`, `.html.haml`) `webpack` loader.

Transform Rails view template files to html.
Files are render using [`ApplicationController.render`](https://github.com/aptx4869/rails-view-loader/blob/master/lib/view_render.rb)

## Table of Contents

- [Install](#install)
- [Usage](#usage)
- [Configuration](#configuration)
  - [Options](#options)
  - [Dependencies](#dependencies)
  - [ActionPack Variants](#actionpack-variants)
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

Add `rails-view-loader` with your favourite html loaders (`html-loader`, `vue-html-loader`, etc) to your rules.

```js
// webpack.config.js

module.exports = {
  resolve: {
    modules: [ resolve('app/views'), ... ],
  },
  module: {
    rules: [
      {
        test: /\.html\.(erb|slim|haml)$/,
        use: [
          'html-loader',
          {
            loader: 'rails-view-loader',
          }
        ]
      },
    ]
  }
};
```

Now you can import your view files in your project, for example:

`app/view/session/new.html.erb`

```erb
<%# /* rails-view-loader-dependencies models/user */ %>
<h2>Login</h2>

<%= angular_form_for(User.new, url: login_path(:user)) do |f| %>
  <%= f.input :login, required: true, autofocus: true %>
  <%= f.input :password, required: true %>

  <%= f.button :submit, "Login" %>
<% end %>
```

```js
import { Component } from '@angular/core'
import template from 'session/new.html.erb'

@Component({ selector: 'login', template: template })
export class LoginComponent {
}
```

## Configuration

### Options

Can be configured with [UseEntry#options](https://webpack.js.org/configuration/module/#useentry).

| Option | Default | Description |
| ------ | ------- | ----------- |
| `dependenciesRoot` | `"app"` | The root of your Rails project, relative to webpack's working directory. |
| `runner` | `"./bin/rails runner"` | Command to run Ruby scripts, relative to webpack's working directory. |
| `runnerOptions` | `{}` | [options](http://bit.ly/2wEBQnh) for child_process.execFile to call runner |
| `variant` | `null` | ActionPack Variants |

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

If your view files depend on files in your Rails project, you can list them explicitly.
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

You can set the [Action Pack Variants](http://guides.rubyonrails.org/4_1_release_notes.html#action-pack-variants) and layout with global config:

```js
{
  loader: 'rails-view-loader',
  options: {
    runner: '../bin/rails runner',
    dependenciesRoot: '../app',
    variant: 'desktop',
    layout: 'some-layout',
  }
}
```

or with query string:

```js
import template from 'registration/new.html.erb?variant=desktop&layout=some-layout'
```

ActionPack Variants

## Contribute

Questions, bug reports and pull requests welcome. See [GitHub issues](https://github.com/aptx4869/rails-view-loader/issues).

## License

MIT

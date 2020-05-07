---
layout: post
title: By grunt, uglify js & minify css on MacOSX.
date: 2015-11-09
tags:
- JavaScript
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20151109/20151109114223.jpg
---

## environment

- MacOSX 10.11
- grunt-cli v0.1.13
- grunt v0.4.5

## Install npm, Initilize npm

```
cd ~              # depending on your preference.
brew install npm
npm init
```

- Result

```js
About to write to /Users/kenzo/go/src/github.com/flag/public/package.json:

{
  "name": "public",
  "version": "1.0.0",
  "description": "gruntfile",
  "main": "Gruntfile.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "xxxxxxxx@gmail.com",
  "license": "ISC",
  "devDependencies": {
  },
  "dependencies": {
  }
}
```

## Install grunt-cli

```
npm install -g grunt-cli
```

With `--save-dev` option, add install module infomation to package.json.

## Install grunt modules

```
npm install -g grunt --save-dev
npm install grunt-contrib-watch   --save-dev
npm install grunt-contrib-copy    --save-dev
npm install grunt-contrib-clean   --save-dev
npm install grunt-contrib-cssmin  --save-dev
npm install grunt-contrib-uglify  --save-dev
npm install grunt-image           --save-dev
npm install grunt-contrib-htmlmin --save-dev
npm install load-grunt-tasks      --save-dev
npm install grunt-jsbeautifier    --save-dev
npm install grunt-cssbeautifier   --save-dev

```

#### Module map.

| Module                | Detail                                                   |
| --------------------- | -------------------------------------------------------- |
| grunt-contrib-watch   | Monitoring update files.                                 |
| grunt-contrib-copy    | Copy file or directory.                                  |
| grunt-contrib-clean   | Clean file or directory.                                 |
| grunt-contrib-cssmin  | Minify CSS files.                                        |
| grunt-contrib-uglify  | Uglify & Compress Javascript files.                      |
| grunt-contrib-image   | Optimize image files (jpeg, jpg, gif, png, swf, etc...). |
| grunt-contrib-htmlmin | Minify HTML files.                                       |
| grunt-jsbeautifier    | beautify Javascript files.                               |
| grunt-cssbeautifier   | beautify Javascript files.                               |


## Confirm package.json

```js
cat package.json

{
  "name": "public",
  "version": "1.0.0",
  "description": "grunt",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "*********@gmail.com",
  "license": "ISC",
  "devDependencies": {
    "grunt": "^0.4.5",
    "grunt-contrib-clean": "^0.6.0",
    "grunt-contrib-copy": "^0.8.2",
    "grunt-contrib-cssmin": "^0.14.0",
    "grunt-contrib-htmlmin": "^0.6.0",
    "grunt-contrib-uglify": "^0.10.0",
    "grunt-contrib-watch": "^0.6.1",
    "grunt-cssbeautifier": "^0.1.2",
    "grunt-image": "^1.1.1",
    "grunt-jsbeautifier": "^0.2.10",
    "load-grunt-tasks": "^3.3.0"
  }
}
```

- Add dependencies of grunt modules to package.json !


## move to parent directory of css, js folder

```
cd /path/to/project/public/
```

```
tree

/public/
│
├─Gruntfile.coffee      # make `Gruntfile.coffee` at next step.
│
├── css
│	├── bootstrap.css
│	├── img.css
│	├── style.css
│	└── reset.css
│
└── js
	├── jquery-1.9.1.js
	├── img.js
	├── login.js
	└── signup.js
```


### Create Gruntfile.coffee or Gruntfile.json

- Today, I create a Gruntfile.coffee.
- For example, Only Uglify js, Minify css, Beautify js, css.

```
vim Gruntfile.coffee
```

```js
module.exports = (grunt) ->

  # current path.
  path = require('path')
  current = path.resolve('.')

  # load npm task.
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-jsbeautifier');
  grunt.loadNpmTasks('grunt-cssbeautifier');

  grunt.initConfig

    # define directory.
    dir:
      js:      'js'
      css:     'css'
      img:     'img'

    # minify CSS.
    cssmin:
      all:
        expand: true
        cwd:  current + '/<%= dir.css %>/'
        src:  '*.css'
        dest: current + '/<%= dir.css %>/'

    # uglify js.
    uglify:
      options:
        mangle: true
        compress: true
      all:
        expand: true
        cwd:  current + '/<%= dir.js %>/'
        src:  '*.js'
        dest: current + '/<%= dir.js %>/'

    # beautify js.
    jsbeautifier:
      files: '**/*.js'
      options: []

    # beautify css.
    cssbeautifier:
      files: '**/*.css'
      options: []

  grunt.registerTask 'default', ['cssmin', 'uglify']
```

## Make symbolilc Link of 'node_modules'

```
cd <path where Gruntfile.coffee exist>
ln -s ~/node_modules .
tree

/public/
├─Gruntfile.coffee
├─node_modules -> /Users/kenzo/node_modules
│
├── css
│ ├── bootstrap.css
│ ├── img.css
│ ├── style.css
│ └── reset.css
│
└── js
  ├── jquery-1.9.1.js
  ├── img.js
  ├── login.js
  └── signup.js

```

## Execute grunt command.

```
cd <path where Gruntfile.coffee exist>
grunt   # By no parameter, execute default task.
```

- If You want to execute only cssmin, excute command `grunt cssmin`

Thakns.

## webpack 2.2.1 学习小记

----------

### Code Splitting

1. 第三方库资源的打包.
利用浏览器的缓存机制去缓存这些不会轻易改变的第三方库,提高应用的加载时间.
CommonsChunkPlugin 可以用来分离第三方库<a href="https://webpack.js.org/guides/code-splitting-libraries">split vendor/library code</a>

```js
entry: {
	main: './src/index.js',
},

output: {
	filename: '[name].[chunkhash:5].js',
	path: path.resolve(__dirname, 'dist')
},

plugins: [
    new webpack.optimize.CommonsChunkPlugin({
        name: 'vendor', // Specify the common bundle's name.
        minChunks: function (module) {
           // this assumes your vendor imports exist in the node_modules directory
           return module.context && module.context.indexOf('node_modules') !== -1;
        }
    }),
    //CommonChunksPlugin will now extract all the common modules from vendor and main bundles
    new webpack.optimize.CommonsChunkPlugin({ 
        name: 'manifest' //But since there are no more common modules between them we end up with just the runtime code included in the manifest file
    })
],
```


2. css 分离打包
由于正常情况下,css是通过js动态插入的,因此页面的样式必须等待js资源加载完成之后才能够插入到页面中,导致页面闪烁
可以缓存css代码,另外可以避免FOUC(样式未加载时导致页面的闪烁)
ExtractTextWebpackPlugin插件可以用来分离css代码

```js
var ExtractTextPlugin = require('extract-text-webpack-plugin');
module.exports = {
    module: {
         rules: [{
             test: /\.css$/,
            use: ExtractTextPlugin.extract({
                use: 'css-loader'
            })
         }]
     },
    plugins: [
        new ExtractTextPlugin('styles.css'),
    ]
}
```

3. 项目需要打包
可以将用来进行路由或者事件导致的代码分离打包,提高页面首屏的加载速度.
允许用户在需要的时候加载对应的需要的代码.

>import命令会被 JavaScript 引擎静态分析，先于模块内的其他模块执行（叫做”连接“更合适）。
也就是说，import和export命令只能在模块的顶层，不能在代码块之中（比如，在if代码块之中，或在函数之中）。
如果import命令要取代 Node 的require方法，这就形成了一个障碍。因为require是运行时加载模块，import命令无法取代require的动态加载功能。

### 方案一:  import()
>目前是一个提案 
import命令能够接受什么参数，import()函数就能接受什么参数，两者区别主要是后者为动态加载。
import()类似于 Node 的require方法，区别主要是前者是异步加载，后者是同步加载。

>下面是import()的一些适用场合。

#### （1）按需加载。
import()可以在需要的时候，再加载某个模块。
```js
button.addEventListener('click', event => {
  import('./dialogBox.js')
  .then(dialogBox => {
    dialogBox.open();
  })
  .catch(error => {
    /* Error handling */
  })
});
```
上面代码中，import()方法放在click事件的监听函数之中，只有用户点击了按钮，才会加载这个模块。

#### （2）条件加载
import()可以放在if代码块，根据不同的情况，加载不同的模块。

```js
if (condition) {
  import('moduleA').then(...);
} else {
  import('moduleB').then(...);
}
```
上面代码中，如果满足条件，就加载模块 A，否则加载模块 B。

#### （3）动态的模块路径
import()允许模块路径动态生成。

```js
import(f())
.then(...);
```
上面代码中，根据函数f的返回结果，加载不同的模块。


#### (4) 多个帐号同时加载
```js
Promise.all([
  import('./module1.js'),
  import('./module2.js'),
  import('./module3.js'),
])
.then(([module1, module2, module3]) => {
   ···
});
```

现在用webpack 就可以提前用import()实现上述的一些功能.
webpack将import()命令实现为一个代码分离的点,然后将其需要的模块单独进行一个打包.
由于import()返回的是一个promise,因此需要promise polyfill.

```js
import Es6Promise from 'es6-promise';
Es6Promise.polyfill();
// or
import 'es6-promise/auto';
// or
import Promise from 'promise-polyfill';
if (!window.Promise) {
  window.Promise = Promise;
}

```

### 方案二:  require.ensure();

```js
require.ensure(dependencies: String[], callback: function(require), chunkName: String)
```
> 任何写在依赖(dependencies)中,依赖列表中的模块不会被执行,或者回调函数中用require()加载的,都会被webpack视为一个模块单独打包.
> dependencies为依赖列表,callback是依赖加载完成之后的回调函数,chunkName为打包的文件名,如果有多个require.ensure()方法使用相同的chunkName,则这些文件都会被打包到同一个文件中.

----------
### build for production 

**Minification the code**

running (**webpack -p**) equivalently (**webpack --optimize-minimize --define process.env.NODE_ENV="'production'"**);

- 自动使用uglifyPlugin压缩代码,使用 devtool: cheap-module-source-map 为压缩的代码加上sourceMap,便于生产环境debug,
- 使用DefinePlugin设置Node环境变量process.env.NODE\_ENV为'production',这样所有在代码中出现process.env.NODE_ENV的地方都会被替换为'production',但不包括
在webpack.conf.js脚本文件中出现的环境变量.
- 因此使用webpack的时候建议写多个配置文件来区分不同的环境,或者使用webpack.base.config.js来配置所有的基本信息,
使用webpack-merge在开发和生产环境的配置文件中来集成所有的基础配置信息,避免重复代码.

----------

### Caching

1. Use [chunkhash] to add a content-dependent cache-buster to each file.

=> 注意[hash]会为所有的包都打上一个相同的hash值,而[chunkhash]为每个包是不同的hash值.

=> 添加hash值会增加打包时间，建议只在生产环境使用．

2. Extract the webpack manifest into a separate file.
3. Ensure that the entry point chunk containing the bootstrapping code doesn’t change hash over time for the same set of dependencies.

For even more optimized setup:

4. Use compiler stats to get the file names when requiring resources in HTML.
5. Generate the chunk manifest JSON and inline it into the HTML page before loading resources.

### Development

1. 利用devtool: "cheap-eval-source-map"来开启sourceMap,方便debug.
2. 利用webpack-dev-server或者webpack-dev-middleware来快速搭建一个服务，实现webpack的live reloading等feature.
webpack-dem-middleware可以让webpack在内存中进行打包，
利用hot-reload-module可以实现reload without page reloading.
3. 利用serve快速搭建一个简单的服务器

----
### Shimming

#### **resolve config**
有时候一些第三方库是以全局变量的方式来导出的，
```js
// webpack.config.js
module.exports = {
    ...
    resolve: {
        alias: {
            jquery: "jquery/src/jquery"
        }
    }
};
```

#### **ProvidePlugin**
利用这个插件我们可以定义一些可以在所有模块中自由使用的"全局变量",这些模块只会在你用到它们的时候才会被引入．

```js
module.exports = {
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      merge: ['redux', 'merge'], // 还可以从一个模块中指定某个你需要使用的方法来导出
    })
  ]
};
```

#### **import-loader　& export-loader**

利用import-loader让define置为false,这可以让一些采用umd写法的模块使用commonJS的方式被webpack识别和打包．
```js
module.exports = {
  module: {
    rules: [{
      test: require.resolve("some-module"),
      use: 'imports-loader?define=>false'
    }]
  }
};
```

#### **script-loader**
这个loader可以让你将一些代码插入全局环境中,就如同你使用script标签一样.
(该loader不会压缩代码,因此你最好使用一个压缩后的版本.)
```js
require('script-loader!legacy.js');
```

### 打包框架或库的代码

webpack不仅可以帮助你打包一个应用的代码,也可以帮助你打包一个库．

考虑几点需求:

1. 能够在我们的库中依赖的第三方库打包，并在我们的代码执行之前执行．
2. 能够打包到一个文件中，并能够自定义打包出去的变量．
3. 能够通过import, require引用,或者script标签直接引入的时候成为一个全局变量．


#### add externals

如果你不想你的第三方依赖和你的代码打包在一起,则可以指定externals.

```js
module.exports = {
    ...
    externals: {
        "lodash": {
            commonjs: "lodash",
            commonjs2: "lodash",
            amd: "lodash",
            root: "_"
        }
    }
    ...
};
```
这意味着用户在使用你的代码之前,必须配置lodash的第三方环境.

#### add libraryTarget

```js
module.exports = {
    ...
    output: {
        ...
        library: 'webpackNumbers',
        libraryTarget: 'umd' // Possible value - amd, commonjs, commonjs2, commonjs-module, this, var
    }
    ...
};
```

如果你不设置libraryTarget, libraryTarget则自动会默认为var,这意味着你的代码将会以一个全局变量的方式被输出.

=> tips: commonjs2: commonjs模块规范只定义了exports等关键字,而nodejs和其他很多commonjs实现使用了module.exports,
所以commonjs意味着纯粹的commjs语法,
commonjs2包括了module.exports等一些其他的第三方实现的语法规则.

#### add npm script

```js
{
    "main": "dist/webpack-numbers.js",
    "module": "src/index.js", // To add as standard module as per https://github.com/dherman/defense-of-dot-js/blob/master/proposal.md#typical-usage
}
```

main是一个模块id,是你的项目的主要入口,如果一个用户下载你的包,并require它,那么你的main模块里面的代码
的module's exports对象会被返回.

module字段是一个提案,它鼓励用户直接通过es2015 module 来引用模块.

现在,您可以发布它作为npm包并找到它在unpkg.com上分发给用户。
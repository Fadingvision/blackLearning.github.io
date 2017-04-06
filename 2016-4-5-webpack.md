## webpack 


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

### 方案一:  require.ensure();

```js
require.ensure(dependencies: String[], callback: function(require), chunkName: String)
```
> 任何写在依赖(dependencies)中,依赖列表中的模块不会被执行,或者回调函数中用require()加载的,都会被webpack视为一个模块单独打包.
> dependencies为依赖列表,callback是依赖加载完成之后的回调函数,chunkName为打包的文件名,如果有多个require.ensure()方法使用相同的chunkName,则这些文件都会被打包到同一个文件中.


## webpack 


### Code Splitting

1. 第三方库资源的打包.
利用浏览器的缓存机制去缓存这些不会轻易改变的第三方库,提高应用的加载时间.
CommonsChunkPlugin 可以用来分离第三方库<a href="https://webpack.js.org/guides/code-splitting-libraries">split vendor/library code</a>

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
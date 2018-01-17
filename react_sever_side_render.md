## react服务端渲染小记

### 优势：

1. seo
2. 性能

### 实现

#### development（webpack功能的服务端代替：）

1. handle javascript

```js
require('babel-core/register')({
  presets: ['es2015', 'react', 'stage-3'],
  plugins: [
    'add-module-exports',
    'transform-runtime',
    'transform-class-properties',
    'transform-decorators-legacy',
    'syntax-dynamic-import',
    [
      'import',
      {
        style: 'css',
        libraryName: 'antd'
      }
    ]
  ]
});
```

2. handle less, css-modules等样式文件

```js
// Css require hook
require('css-modules-require-hook')({
  extensions: '.less',
  processorOpts: { parser: lessParser },
  camelCase: true,
  generateScopedName: '[name]__[local]__[hash:base64:8]'
});

```

3. handle　img, svg等静态资源

```js
require('asset-require-hook')({
  extensions: ['jpg', 'png', 'woff2', 'eot', 'ttf', 'otf', 'svg', 'css'],
  name: '[hash].[ext]'
});
```

4. webpack-dev-middleware

```js
// set webpack dev middleware, allow us to build webpack bundles in-memory
app.use(
  webpackDevMiddleWare(compiler, {
    overlay: true,
    publicPath: '/assets/',
    stats: {
      colors: true
    }
  })
);
```

利用webpack-dev-middleware来配合express实现开发服务器，文件无需打包到硬盘上，在内存中处理打包过程，提高打包速度。


5. webpack-hot-middleware

```js
// set webpack hot middleware, allow us to enable hot-reload without webpack-dev-server
app.use(webpackHotMiddleWare(compiler));
```

这个中间件让你在没有`webpack-dev-server`的情况下，配合webpack-dev-middleware实现代码的热更新。


6. http-proxy-middleware

这个中间件用来启用服务端接口代理，配合后端接口进行调试。


```js
const proxyConfig = {
  '/api/**': {
    // target: 'http://rapapi.org/mockjs/18762',
    // target: 'creditproduct.test.cdecube.com',
    // target: 'http://data.cheyunxin.com',
    // target: 'http://10.0.0.181:8080',
    target: 'http://data.cheyunxin.com',
    changeOrigin: true
  },
  '/verifycode': {
    // target: 'http://rapapi.org/mockjs/18762',
    // target: 'http://10.0.0.181:8080',
    target: 'http://data.cheyunxin.com',
    // target: 'http://data.cheyunxin.com',
    changeOrigin: true
  }
};

// set api proxy
Object.keys(proxyConfig).forEach(proxyUrl => {
  app.use(proxyUrl, proxy(proxyConfig[proxyUrl]));
});
```

#### 处理路由

利用ReactDomServer.renderToString方法和react-router的StaticRouter组件将react组件渲染成字符串，配合express的render方法和ejs模板在服务端将组件渲染成html输出到页面中。

```js
<!-- clientRoute.js -->
module.exports = (req, res, next) => {
  const context = {};
  const html = ReactDOMServer.renderToString(
    React.createElement(
      StaticRouter,
      { location: req.path, context },
      React.createElement(App, null, null)
    )
  )

  if (req.path.indexOf('assets') !== -1) {
    console.log(req.path)
    return next();
  }

  if (context.url) {
    res.redirect(context.url)
  } else {
    res.render('index', {
      html,
    })
  }
}


<!-- app.js -->
app.set('views', path.resolve(__dirname, '../dist/client'));

app.use('/assets', express.static(path.resolve(__dirname, '../dist/client/assets')));
app.use(require('./routes/clientRoute'));
```


### Client Side

1. ReactDOM.hydrate

用来代替React.render, ReactDOM.hydrate会处理你的事件，让你的静态网页变成响应的。

2. 在clientSide的加载代码中，不要使用浏览器特有的环境变量(例如window, document等等).
另外: componentWillMount会在服务端执行，componentDidMount不会。而客户端js执行后，完整的生命周期函数会依次执行。react会要求客户端生成的html和服务端生成的html代码必须保持一致。


now: 启动页面，就可以看到服务端直出html

code: https://github.com/blackLearning/react-starter-kit







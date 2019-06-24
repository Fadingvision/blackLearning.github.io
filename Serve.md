## Serve

Static file serving and directory listing.

__Links:__

[github](https://github.com/zeit/serve)
[npm](https://npmjs.com/serve)

通过学习serve的源码，我们可以了解到：

1. 如何编写一个Command-line tool（包括命令行设置，help文档，命令参数的读取，命令执行后的输出界面的编写）。
2. 如何用nodejs 来静态文件服务（包括spa的设置：所有的路由都跳到index.html，如何让浏览器缓存静态文件）
3. 如何使用nodejs 设置header;(例如CORS跨域header的设置)
5. 如何通过服务端开启gzip压缩静态文件。


## 一、如何编写一个Command-line tool

1. help文档设置，

[args](https://github.com/leo/args)

使用args来构建帮助文档，默认会有help和version两个选项，
使用options或者command方法可以增加其他的command和option.


```
#!/usr/bin/env node

import args from 'args'

args
  .option('port', 'The port on which the app will be running', 3000)
  .option('reload', 'Enable/disable livereloading')
  .command('serve', 'Serve your static site', ['s'])

const flags = args.parse(process.argv)
```

2. 命令参数的读取

```
const flags = args.parse(process.argv, { minimist })
const directory = args.sub[0]

```
将命令行的参数选项进行读取，并赋对象，并获取到命令中的文件参数。


3. 命令行设置

npm package.json bin字段。

3. 命令行执行输出

在执行完监听事件后，可以利用回调函数在terminal tool上给用户一定的反馈信息。

```js
const shutdown = () => {
    server.close()
    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
```
执行输出之前，可以监听process进程，当ctrl+c退出的时候关闭服务。

输出主要是利用console.log, 同时利用chalk工具来美化输出。

## 二、如何使用http(s)Server创建一个静态文件服务器

1. 使用mirco来启用http(s)服务，使用micro-compress来gzip压缩静态资源。


2. 开启CORS in server

```
// 如果参数中有cors，则开启access-control-allow-origin的header
if (flags.cors) {
  headers['Access-Control-Allow-Origin'] = '*'
  headers['Access-Control-Allow-Headers'] =
    'Origin, X-Requested-With, Content-Type, Accept, Range'
}

for (const header in headers) {
  if (!{}.hasOwnProperty.call(headers, header)) {
    continue
  }

  res.setHeader(header, headers[header])
}
```

3. 验权


```js
const credentials = auth(req)

if (!process.env.SERVE_USER || !process.env.SERVE_PASSWORD) {
  const error =
    'The environment variables "SERVE_USER" ' +
    'and/or "SERVE_PASSWORD" are missing!'
  console.error(red(error))

  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(1)
}

if (
  !credentials ||
  credentials.name !== process.env.SERVE_USER ||
  credentials.pass !== process.env.SERVE_PASSWORD
) {
  res.statusCode = 401
  res.setHeader('WWW-Authenticate', 'Basic realm="User Visible Realm"')
  return micro.send(res, 401, 'Access Denied')
```

4. 缓存

利用maxAge来缓存静态资源。

```js
if (flags.cache) {
    streamOptions.maxAge = flags.cache
  } else if (flags.cache === 0) {
    // Disable the cache control by `send`, as there's no support for `no-cache`.
    // Set header manually.
    streamOptions.cacheControl = false
    res.setHeader('Cache-Control', 'no-cache')
  } else if (flags.single) {
    // Cache assets of single page applications for a day.
    // Later in the code, we'll define that `index.html` never
    // gets cached!
    streamOptions.maxAge = 86400000
  }
```

5. server的设置

首先对req.url和当前serve的静态资源文件夹进行分析，确定两者关系。

```
// 从url解析出pathname
  const { pathname } = parse(req.url)
  /*
    parse(req.url) => ({
      protocol: null,
      slashes: null,
      auth: null,
      host: null,
      port: null,
      hostname: null,
      hash: null,
      search: null,
      query: null,
      pathname: '/server.js',
      path: '/server.js',
      href: '/server.js'
    })
  */
  const assetDir = path.normalize(process.env.ASSET_DIR)
  // assetDir => /rqs61bsqob
  let related = path.parse(path.join(current, pathname))
  // current: /home/cxy/other_stuff/Node/serve/lib
  /*
    => /home/cxy/other_stuff/Node/serve/lib/server.js
    => related = {
      root: '/',
      dir: '/home/cxy/other_stuff/Node/serve/lib',
      base: 'server.js',
      ext: '.js',
      name: 'server'
    }
   */
  let assetRequest = false

  // 如果是静态资源请求
  if (related.dir.indexOf(assetDir) > -1) {
    assetRequest = true
    const relative = path.relative(assetDir, pathname)
    /*
      path.relative('/data/orandea/test/aaa', '/data/orandea/impl/bbb');
      // Returns: '../../impl/bbb'
     */
    related = path.parse(path.join(__dirname, '/../assets', relative))
  }

  related = decodeURIComponent(path.format(related))
  // => "/home/cxy/other_stuff/Node/serve/lib/server.js"
  let notFoundResponse = 'Not Found'

  // 尝试在当前文件夹下找到404页面
  try {
    const custom404Path = path.join(current, '/404.html')
    // 指定了encoding的readFile返回的是字符串，否则是buffer
    notFoundResponse = yield fs.readFile(custom404Path, 'utf-8')
  } catch (err) {}

  // 检测请求的文件是否被忽略
  const ignored = !ignoredFiles.every(item => {
    return !pathname.includes(item)
  })
  // 如果要请求的文件没有在忽略列表中　=> ignored === false

  // 如果已经被忽略或者（不是静态资源　）=> 则返回404
  if (ignored || (!assetRequest && related.indexOf(current) !== 0)) {
    return micro.send(res, 404, notFoundResponse)
  }

  const relatedExists = yield fs.exists(related)

  // 如果请求的该文件或文件夹不存在　且　不是单页应用　=> 则返回404
  if (!relatedExists && !flags.single) {
    return micro.send(res, 404, notFoundResponse)
  }


```

如果serve的是一个文件夹，直接将整个文件价的文件作为列表渲染出来供选择

```js
// 如果是文件夹（例如/home/cxy/other_stuff/Node/serve/lib/）
if (relatedExists && (yield pathType.dir(related))) {
  // req.url === '/';
  const url = parse(req.url)

  if (url.pathname.substr(-1) !== '/') {
    url.pathname += '/'
    const newPath = format(url)

    res.writeHead(302, {
      Location: newPath
    })

    res.end()
    return
  }

  // 首先尝试在该文件夹下找到index.html
  let indexPath = path.join(related, '/index.html')
  // 根据返回文件的后缀来确定content-Type的值
  res.setHeader('Content-Type', mime.contentType(path.extname(indexPath)))

  // 如果没有找到index.html，　
  // => 提供一个默认的选择页面，直接将整个文件价的文件作为列表渲染出来供选择
  if (!(yield fs.exists(indexPath))) {
    const port = flags.port || req.socket.localPort

    // 得到渲染页面的Html
    const renderedDir = yield renderDirectory(
      port,
      current,
      related,
      ignoredFiles
    )

    // 如果参数中没有指明不要树形文件夹展示，返回200和树形文件夹
    if (renderedDir && !flags.treeless) {
      return micro.send(res, 200, renderedDir)
    }

    
    if (!flags.single) {
      return micro.send(res, 404, notFoundResponse)
    }

    // /home/cxy/other_stuff/Node/serve/lib/index.html
    indexPath = path.join(current, '/index.html')
  }

  // 如果是不要文件夹显示而且又是单页，强行将index.html输出为响应
  if (flags.single && indexPath === path.join(current, '/index.html')) {
    streamOptions.maxAge = 0
  }

  return stream(req, indexPath, streamOptions).pipe(res)
}
```

# serve-handler

1. 如果是single, 需要将**重定向到/index.html
2. 处理symlink，软链接
3. 处理error, 以及process退出的情况
4. 如果是压缩，使用compress中间件来处理
5. 如果是copy
 - macos: bpcopy
 - linux: xsel
 - windows: clipboard_i686.exe || clipboard_x86_64.exe

6. 利用public结合cwd来处理path
----

### serve-handler

handler: {
  lstat: 获取文件属性（如果是软连接这是软连接自身）
  realpath: 获取文件的绝对路径
  createReadStream: ositl.readFile, 获取文件流
  readdir: 获取文件夹属性
  sendError: 发送错误信息
  `
    如果支持json, 则将code,message转为json格式的错误信息发送.
    尝试去找statusCode.html文件, 如果找到则将其发送
    否则使用定制的errorTemplate模板发送错误信息
  `
}

- 将req.url.pathname进行decodeURIComponent得到relativePath,然后和cwd结合得到绝对路径, 同时处理可能产生的错误
- 检测绝对地址是否在cwd中, 否则抛错
- 根据配置决定是否去除url中的.html和.htm后缀
- 根据trailingSlash来决定是否在url上加上/
- 根据redirects数组来对source和dest路径进行对应的处理(glob 用minmatch, regex用path-to-regex)

- 如果存在重定向,直接301返回

- 如果是个文件夹, 则渲染文件夹页面

- 处理symlink
- 处理range
- 处理单个文件, 并加上对应的content-range, content-length, etag, 等header
```js
{
  'Last-Modified': stats.mtime.toUTCString(),
  'Content-Length': stats.size,
  // Default to "inline", which always tries to render in the browser,
  // if that's not working, it will save the file. But to be clear: This
  // only happens if it cannot find a appropiate value.
  'Content-Disposition': contentDisposition(base, {
    type: 'inline'
  }),
  'Accept-Ranges': 'bytes'
}
```



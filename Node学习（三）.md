## Serve

Static file serving and directory listing.

__Links:__

[github](https://github.com/zeit/serve)
[npm](https://npmjs.com/serve)

通过学习serve的源码，我们可以了解到：

1. 如何编写一个Command-line tool（包括命令行设置，help文档，命令参数的读取，命令执行后的输出界面的编写）。
2. 如何用nodejs 来静态文件服务（包括spa的设置：所有的路由都跳到index.html，如何让浏览器缓存静态文件）
3. 如何使用nodejs 设置header;(例如CORS跨域header的设置)
4. 如何在指定端口开启一个简易的web服务器。
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

1. 使用mirco来启用http(s)服务，使用micro-compress来压缩静态资源。


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









# Egg.js

### 基础

#### 1. extend, router, controller, service, middlewares 扩展收集

- 如何将koa的context, app, request, response挂在this上?

- 如何将各种扩展收集在app或者ctx上?

- 怎么控制middlewares的顺序?

- 怎么挂载多个app.js和agent.js? 框架的启动顺序，生命周期？

 egg.Appliation => EggApplication => EggCore => Koa.Application

 EggCore => LifeCycle

#### 2. config & app.js & agent.js

#### 3. view

egg-view

#### 4. static

egg-static

#### 5. schedule


定时任务：

```js
module.exports = agent => {
  // don't redirect scheduleLogger
  agent.loggers.scheduleLogger.unredirect('error');

  // register built-in strategy
  agent.schedule.use('worker', WorkerStrategy);
  agent.schedule.use('all', AllStrategy);

  // wait for other plugin to register custom strategy
  agent.beforeStart(() => {
    agent.schedule.init();
  });

  agent.messenger.once('egg-ready', () => {
    // start schedule after worker ready
    agent.schedule.start();
  });
};
```

#### 6. middleware

框架自带的middleware: 

- multipart

用于接受用户上传的文件，可以通过`ctx.getFileStream()`和`ctx.request.files`来获取文件。

- meta
- siteFile
- notfound
- static
- bodyParser

对这json和formData两类格式的请求 body 解析成 object 挂载到 ctx.request.body 上.

一个常见的错误是把 ctx.request.body 和 ctx.body 混淆，后者其实是 ctx.response.body 的简写。

- overrideMethod
- session

框架内置了 Session 插件，给我们提供了 ctx.session 来访问或者修改当前用户 Session 

- securities
- i18n
- eggLoaderTrac

#### 7. plugins

框架默认内置了企业级应用常用的插件：

- `i18n`  多语言
- `logrotator`  日志切分

- `onerror`  统一异常处理

监听异常，并将错误信息及时的友好的展示出来的页面，方便debug, 如果是在生产环境，就可以配置定制的500页面，并重定向该页面，如果该页面没有配置，则会生成一个简单的服务器错误的500页面。

- `Session`  Session 实现

统一通过设置cookie的方式来保存临时的用户信息，默认一天的过期时间。

- `watcher`  文件和文件夹监控

利用fs.watch(file)和wt.watch(files)来监听文件的改变，当controller, service等文件改变的时候，重启app-worker来重启服务。

- `multipart`  文件流式上传

利用`co-busboy`来解析带有content-type为`mulitipart`的header， 从而解析文件到stream中，可以利用getFileStream方法来获取该stream.

- `development`  开发环境配置

1. 统计服务启动时加载`config`, `plguin`, `agent`的时间，并可以通过`http://localhost:7001/__loader_trace__`来访问g2生成的统计图表。

2. 利用watcher来监听文件的改变，从而及时的重启服务。

- `security`  安全
- `schedule`  定时任务
- `static`  静态服务器
- `jsonp`  jsonp 支持
- `view`  模板引擎


### 进阶

#### cluster & worker

egg-bin, egg-scripts, egg-cluster

#### logger

egg-logger的日志一般分为以下几种类型：

debug, info, warn, error;
在实现上为这几种不同类型的日志提供了相对应的方法。

根据输出日志的地方，可以将日志划分为：

- 输出在控制台上

```js
/**
  * output log, see {@link Transport#log}
  * if stderrLevel presents, will output log to stderr
  * @param  {String} level - log level, in upper case
  * @param  {Array} args - all arguments
  * @param  {Object} meta - meta infomations
  */
 log(level, args, meta) {
   const msg = super.log(level, args, meta);
   if (levels[level] >= this.options.stderrLevel && levels[level] < levels['NONE']) {
     process.stderr.write(msg);
   } else {
     process.stdout.write(msg);
   }
 }
```

- 输出到对应的日志文件中

```js
// 首先基于options.file来新建一个可写入的文件流
_createStream() {
  mkdirp.sync(path.dirname(this.options.file));
  const stream = fs.createWriteStream(this.options.file, { flags: 'a' });

  const onError = err => {
    console.error('%s ERROR %s [egg-logger] [%s] %s',
      utility.logDate(','), process.pid, this.options.file, err.stack);
    this.reload();
    console.warn('%s WARN %s [egg-logger] [%s] reloaded', utility.logDate(','), process.pid, this.options.file);
  };
  // only listen error once because stream will reload after error
  stream.once('error', onError);
  stream._onError = onError;
  return stream;
}

log(level, args, meta) {
  if (!this.writable) {
    const err = new Error(`${this.options.file} log stream had been closed`);
    console.error(err.stack);
    return;
  }
  const buf = super.log(level, args, meta);
  // 将二进制日志信息写入到对应的文件流中
  if (buf.length) {
    this._write(buf);
  }
}
```

#### error-handling

```js
module.exports = () => {
  return async function errorHandler(ctx, next) {
    try {
      await next();
    } catch (err) {
      // 所有的异常都在 app 上触发一个 error 事件，框架会记录一条错误日志
      ctx.app.emit('error', err, ctx);

      const status = err.status || 500;
      // 生产环境时 500 错误的详细错误内容不返回给客户端，因为可能包含敏感信息
      const error = status === 500 && ctx.app.config.env === 'prod'
        ? 'Internal Server Error'
        : err.message;

      // 从 error 对象上读出各个属性，设置到响应中
      ctx.body = { error };
      if (status === 422) {
        ctx.body.detail = err.errors;
      }
      ctx.status = status;
    }
  };
};
```

#### security

常见的安全漏洞如下：

- XSS 攻击：对 Web 页面注入脚本，使用 JavaScript 窃取用户信息，诱导用户操作。

XSS 攻击一般分为两类：

Reflected XSS（反射型的 XSS 攻击）

反射型的 XSS 攻击，主要是由于服务端接收到客户端的不安全输入，在客户端触发执行从而发起 Web 攻击, 主要通过`escape-html`来过滤html提交，`helper.sjs()`来过滤js 代码

Stored XSS（存储型的 XSS 攻击）

是通过提交带有恶意脚本的内容存储在服务器上，当其他人看到这些内容时发起 Web 攻击。一般提交的内容都是通过一些富文本编辑器编辑的，很容易插入危险代码。


其他 XSS 的防范方式

通过浏览器实现的`CSP`来防御xss攻击: 

CSP 的实质就是白名单制度，开发者明确告诉客户端，哪些外部资源可以加载和执行，等同于提供白名单。

两种方法可以启用 CSP。一种是通过 HTTP 头信息的Content-Security-Policy的字段。

```
Content-Security-Policy: script-src 'self'; object-src 'none'; 
style-src cdn.example.org third-party.org; child-src https:
```

- 脚本：只信任当前域名
- <object>标签：不信任任何URL，即不加载任何资源
- 样式表：只信任http://cdn.example.org和http://third-party.org
- 框架（frame）：必须使用HTTPS协议加载
- 其他资源：没有限制

另一种是通过网页的<meta>标签。

```html
<meta http-equiv="Content-Security-Policy" content="script-src 'self'; object-src 'none'; style-src cdn.example.org third-party.org; child-src https:">
```

其他一些安全相关的功能，也放在了 CSP 里面。block-all-mixed-content：HTTPS 网页不得加载 HTTP 资源（浏览器已经默认开启）upgrade-insecure-requests：自动将网页上所有加载外部资源的 HTTP 链接换成 HTTPS 协议plugin-types：限制可以使用的插件格式sandbox：浏览器行为的限制，比如不能有弹出窗口等。

在egg中可以通过`config.security.csp = {enable: true}`来开启`content-security-policy`header.

- CSRF 攻击：伪造用户请求向网站发起恶意请求。

通常来说，对于 CSRF 攻击有一些通用的防范方案，简单的介绍几种常用的防范方案：

- Synchronizer Tokens：通过响应页面时将 token 渲染到页面上，在 form 表单提交的时候通过隐藏域提交上来。

如果页面采用服务端渲染的方式可以利用`ctx.csrf`来将csrfToken插入到表单域中，表单提交的时候就会自动带上csrfToken，可以进行
校验对比。


Double Cookie Defense：将 token 设置在 Cookie 中，在提交 post 请求的时候提交 Cookie，并通过 header 或者 body 带上 Cookie 中的 token，服务端进行对比校验。

如果是通过ajax提交的方式，客户端可以在cookie中取到crsfToken来传给服务端，同时进行同站的校验。


Custom Header：信任带有特定的 header（例如 X-Requested-With: XMLHttpRequest）的请求。这个方案可以被绕过，所以 rails 和 django 等框架都放弃了该防范方式。


- XST (Cross-Site Tracing)

  eGG框架已经禁止了 trace，track，options 三种危险类型请求，避免通过js脚本通过这几种请求来获取获取某些敏感的header, 例如httpOnly的Cookie信息。

- 钓鱼攻击：利用网站的跳转链接或者图片制造钓鱼陷阱。

  egg对所有通过`redirect`跳转的地址都会进行白名单(`domainWhiteList`)验证，防止跳转到钓鱼网站。

  开启`X-Frame-Options： SAMEORIGIN`, 防止恶意的第三方网站将本网站作为iframe嵌入。



- HTTP参数污染：利用对参数格式验证的不完善，对服务器进行参数注入攻击。

  eGG框架本身会在客户端传输 key 相同而 value 不同的参数时，强制使用第一个参数，因此不会导致 hpp 攻击。

- 中间人攻击与 HTTP / HTTPS


  HTTP 是网络应用广泛使用的协议，负责 Web 内容的请求和获取。然而，内容请求和获取时会经过许多中间人，主要是网络环节，充当内容入口的浏览器、路由器厂商、WIFI提供商、通信运营商，如果使用了代理、翻墙软件则会引入更多中间人。
  HTTPS 做的就是给请求加密，让其对用户更加安全。
  
  HTTP Strict Transport Security（通常简称为HSTS）是一个安全功能，它告诉浏览器只能通过HTTPS访问当前资源，而不是HTTP。服务器响应Strict-Transport-Security 头，浏览器记录下这些信息，然后后面尝试访问这个网站的请求都会自动把HTTP替换为HTTPS。当HSTS头设置的过期时间到了，后面通过HTTP的访问恢复到正常模式，不会再自动跳转到HTTPS。每次浏览器接收到Strict-Transport-Security头，它都会更新这个网站的过期时间，所以网站可以刷新这些信息，防止过期发生。

  : max-age=<expire-time>
  设置在浏览器收到这个请求后的<expire-time>秒的时间内凡是访问这个域名下的请求都使用HTTPS请求。

  : includeSubDomains 可选
  如果这个可选的参数被指定，那么说明此规则也适用于该网站的所有子域名。

---------

#### ORM & datasbase
#### validation & passport
#### microservices
#### websocket
#### graphql
#### 部署(pm2, docker, nginx)
#### 扩展: loader & plugin & framework


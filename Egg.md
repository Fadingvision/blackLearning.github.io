# Egg.js 学习

### 基础

#### 1. extend, router, controller, service, middlewares 扩展收集

- 如何将koa的context, app, request, response挂在this上?

- 如何将各种扩展收集在app或者ctx上?

- 怎么控制middlewares的顺序?

#### 2. config & app.js & agent.js

#### 3. view

egg-view

#### 4. static

egg-static


#### 5. `middlewares`

框架自带的middleware: 

- siteFile

用于匹配一些常用的文件请求,例如 `favicon`
- notfound

用于未匹配的路由请求时, 返回默认的`not found`页面

- bodyParser

对这json和formData两类格式的请求 body 解析成 object 挂载到 ctx.request.body 上.
一个常见的错误是把 ctx.request.body 和 ctx.body 混淆，后者其实是 ctx.response.body 的简写。

- overrideMethod

Let you use HTTP verbs such as PUT or DELETE in places where the client doesn't support it.

#### 6. plugins

框架默认内置了企业级应用常用的插件：

- `onerror`  统一异常处理
- `Session`  Session 实现
- `i18n`  多语言
- `watcher`  文件和文件夹监控
- `multipart`  文件流式上传
  
用于接受用户上传的文件，可以通过`ctx.getFileStream()`和`ctx.request.files`来获取文件。

- `security`  安全
- `development`  开发环境配置
- `logrotator`  日志切分
- `schedule`  定时任务
- `jsonp`  jsonp 支持
- `static`  静态服务器
- `view`  模板引擎


#### 7. schedule & model


### 进阶

#### Restful API
#### cluster & worker

egg-bin, egg-scripts, egg-cluster

#### logger

egg-logger

#### cookie & session
#### error-handling
#### security
#### ORM & datasbase
#### validation & passport
#### microservices
#### websocket
#### graphql
#### Static Assets

egg-view-assets

#### 部署(pm2, docker, nginx)
#### 扩展: loader & plugin & framework


# Egg.js 学习

### 基础

#### 1. extend (egg对于koa的扩展)

#### 2. router & View

#### 3. controller

#### 4. service

#### 5. public

#### 6. controller

#### 7. middleware

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

#### 8. app.js & agent.js

- 怎么挂载多个app.js和agent.js? 框架的启动顺序，生命周期？

 egg.Appliation => EggApplication => EggCore => Koa.Application

 EggCore => LifeCycle

- 怎么挂载各种controller, service, middlewares? 

#### 9. schedule & model

#### 10. plugins

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

#### Restful API
#### cluster & worker

egg-scripts, egg-cluster

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
egg-static

#### 部署(pm2, docker, nginx)
#### 扩展: plugin & framework


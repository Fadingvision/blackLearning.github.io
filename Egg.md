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

#### 9. schedule & model

#### 10. plugins

框架默认内置了企业级应用常用的插件：

- `onerror`  统一异常处理
- `Session`  Session 实现
- `i18n`  多语言
- `watcher`  文件和文件夹监控
- `multipart`  文件流式上传
- `security`  安全
- `development`  开发环境配置
- `logrotator`  日志切分
- `schedule`  定时任务
- `static`  静态服务器
- `jsonp`  jsonp 支持
- `view`  模板引擎


### 进阶

#### Restful API
#### cluster & worker

egg-scripts, egg-cluster

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


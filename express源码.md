## express


## Application

1. 用this.setting来缓存整个应用通用的一些常用的常量，可以避免硬编码和保持信息同步。

2. process: 

```
app.use => router.use => new Layer(middlewareFunction or express App) =>  stack.push(middleware)(保存middleware)
=> emit mount event => app.handle(接受到请求的时候) => Router.handle
=> 创建next => （循环stack，依次执行middleWare函数）　=> layer.handle_request　=> middleware(req, res, next);


```

__router.handle__:

对OPTIONS请求做特殊处理：（OPTIONS请求通常是CORS跨域前浏览器主动发出的一个假请求）

```js
// for options requests, respond with a default if nothing else responds
if (req.method === 'OPTIONS') {
  done = wrap(done, function(old, err) {
    if (err || options.length === 0) return old(err);
    sendOptionsResponse(res, options, old);
  });
}
```


















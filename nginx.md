## NGINX

### Nginx配置文件结构


```nginx
Core Contexts:
  Global/Main Context
    Events Context
    HTTP Context
      Upstream Context
      Server Context
        Location Context
    Mail Context
```

#### 全局变量：

- $host: 请信息中的Host，如果请求中没有Host行，则等于设置的服务器名
- $request_method: 客户端请求类型，如GET、POST
- $remote_addr: 客户端的IP地址
- $args: 请求中的参数
- $content_length: 请求头中的Content-length字段
- $http_user_agen: 客户端agent信息
- $http_cookie: 客户端cookie信息
- $remote_port: 客户端的端口
- $server_protocol: 请求使用的协议，如HTTP/1.0、·HTTP/1.1`
- $server_addr服务器地址
- $server_name: 服务器名称
- $server_port: 服务器的端口号

#### main: nginx的全局配置，对全局生效。

常用指令：

- include: 用于引入其他的配置文件
- error_log file [level]: 用于指定日志打印的文件位置和日志级别

```conf
error_log /var/log/nginx/error.log warn;
```
- worker_processes auto: 用于指定日志打印的文件位置和日志级别;
- pid file: 用于指定存储主进程的进程id的文件;

```conf
# shell命令也可以用于查看nginx进程 ps -ax | grep nginx
pid /var/run/nginx.pid;
```

- worker_processes number | auto: 用于指定子进程的数量，auto默认为CPU核心的数量;


#### events: 配置影响nginx服务器或与用户的网络连接。

常用指令：

- worker_connections 8000: 指定一个子进程能够打开的最大的并发连接数量。


#### http: 可以嵌套多个server，配置代理，缓存，日志定义等绝大多数功能和第三方模块的配置。
#### server：配置虚拟主机的相关参数，一个http中可以有多个server。

常用指令：

```js
server {
  listen      80 default_server;
  server_name example.net www.example.net;
}
```

**listen**:
  - IP地址端口连写
  - 单独的IP地址，端口默认80
  - 单独的端口, 默认为0.0.0.0
  - none, 默认为0.0.0.0:80

**server_name**:

常见的几种server_name的写法：
```js
server {
    listen 80;
    server_name example.com;
    ...
}
server {
    listen 80;
    server_name ~^(www|host1).*\.example\.com$;
    ...
}
server {
    listen 80;
    server_name ~^(subdomain|set|www|host1).*\.example\.com$;
    ...
}
server {
    listen 80;
    server_name  ~^(?<user>.+)\.example\.net$;
    ...
}
```

nginx将会按照下面的原则顺序来查找到对应的server模块:

- 首先尝试找到请求头部中的`Host`字段的值与server_name完全匹配的server block;
- 匹配以首通配符开头的server_name
- 匹配以尾通配符结尾的server_name
- 第一个匹配到的用正则表达式描述的server_name(在名字前用~符号表示)
- 如果上述都没有匹配到, nginx选择default_server标识 或者第一个server block作为请求匹配block.










































#### location：配置请求的路由，以及各种页面的处理情况。


```js
location optional_modifier location_match {
	...directives
}
```

optional_modifier: 

- `=`: 完全匹配
- `~`大小写敏感的正则匹配
- `~*`: 大小写不敏感的正则匹配
- `^~`: 非正则匹配
- `none`: 用request url来进行普通的前缀匹配

directives: 

- index

```js
index index.$geo.html index.0.html /index.html;
autoindex on | off;
```

- try_files

```
root /var/www/main;
try_files $uri $uri.html $uri/ /fallback/index.html;
```


- rewrite

```
rewrite ^/rewriteme/(.*)$ /$1 last;
```

一个以`/rewriteme/hello`的请求会被重定向为`/hello`的请求，此时location会被重新搜索


- error_page

```
error_page 404             /404.html;
error_page 500 502 503 504 /50x.html;
```

#### upstream：配置后端服务器具体地址，负载均衡配置不可或缺的部分。

```conf
http {
    upstream myapp1 {
        server srv1.example.com;
        server srv2.example.com;
        server srv3.example.com;
    }

    server {
        listen 80;

        location / {
            proxy_pass http://myapp1;
        }
    }
}
```









































### 解析请求的原理

### HTTPS/HTTP2

```conf
server {
    listen              443 ssl;
    server_name         www.example.com;
    ssl_certificate     www.example.com.crt;
    ssl_certificate_key www.example.com.key;
    ssl_protocols       TLSv1 TLSv1.1 TLSv1.2;
    ssl_ciphers         HIGH:!aNULL:!MD5;
    ...
}
```

ssl_certificate是加密用的公匙，会被发送到每个与该服务的客户端，

ssl_certificate_key是私匙，应该被存在一个读写权限控制的文件之中，同时可以被nginx master进程读取。

ssl_protocols 和 ssl_ciphers 用于限制TLS(传输层安全协议)指定版本和指定加密算法的链接。















### 安全

### 跨域

### 代理

### 缓存

### 负载均衡

### 日志


```conf
# Default main log format from nginx repository:
log_format main
                '$remote_addr - $remote_user [$time_local] "$request" '
                '$status $body_bytes_sent "$http_referer" '
                '"$http_user_agent" "$http_x_forwarded_for"';

# Extended main log format:
log_format main-level-0
                '$remote_addr - $remote_user [$time_local] '
                '"$request_method $scheme://$host$request_uri '
                '$server_protocol" $status $body_bytes_sent '
                '"$http_referer" "$http_user_agent" '
                '$request_time';

# Debug log formats:
log_format debug-level-0
                '$remote_addr - $remote_user [$time_local] '
                '"$request_method $scheme://$host$request_uri '
                '$server_protocol" $status $body_bytes_sent '
                '$request_id $pid $msec $request_time '
                '$upstream_connect_time $upstream_header_time '
                '$upstream_response_time "$request_filename" '
                '$request_completion';

log_format debug-level-1
                '$remote_addr - $remote_user [$time_local] '
                '"$request_method $scheme://$host$request_uri '
                '$server_protocol" $status $body_bytes_sent '
                '$request_id $pid $msec $request_time '
                '$upstream_connect_time $upstream_header_time '
                '$upstream_response_time "$request_filename" $request_length '
                '$request_completion $connection $connection_requests';

log_format debug-level-2
                '$remote_addr - $remote_user [$time_local] '
                '"$request_method $scheme://$host$request_uri '
                '$server_protocol" $status $body_bytes_sent '
                '$request_id $pid $msec $request_time '
                '$upstream_connect_time $upstream_header_time '
                '$upstream_response_time "$request_filename" $request_length '
                '$request_completion $connection $connection_requests '
                '$server_addr $server_port $remote_addr $remote_port';

```

### 工具

[nginx config 生成器](https://nginxconfig.io/)
[nginx 配置分析](https://nginxconfig.io/)
[nginx 日志分析](https://nginxconfig.io/)
[nginx 性能分析](https://nginxconfig.io/)

### 最佳实践

# Parcel

> Version: 1.4.1

# Classes

### Bundler
> 打包主程序

### Assets

> 文件资源类，负责记录所有的原始资源，包含资源的下列信息：

- ast: 抽象语法树
- basename: 名称
- type: 类型
- bundles(`Set`): 打包资源，Bundle的实例
- depAssets(`Map`): 记录该资源的其他依赖资源，Asset实例
- dependencies(`Map`): 记录该资源的其他依赖资源名称等信息
- generated(`Object`): 记录该资源打包后生成的文件内容
- hash(`Object`): 记录该资源hash值
- options, package: 来自bundler的信息
- processed: 记录该资源是否已经被打包过的标识


### Bundle
> 打包文件结果类，负责记录所有的打包结果信息，包含下列信息：

- name: 包含名称的完整生成路径
- type: 类型
- assets(`Set`): 原始资源，Asset实例
- entryAsset(`Map`): 记录该打包资源的入口资源，Asset实例
- childBundles(`Map`): 记录该打包资源的子打包资源
- siblingBundles(`Object`): 记录该打包资源的兄弟打包资源

### Parser
> 资源解析类，规定了如何对各种资源进行解析

### Resolver

### Packager
> 打包组合类，用于将各个打包结果组合，并生成最后的输出文件。

> 在 Parcel 中，一个 Packager 将多个 资源合并到一个最终生成的文件束中。此过程发生在主进程中，且在所有资源被处理及文件束树被创建之后。Packager 的注册是基于输出文件类型，并且用于生成这种文件类型的资源会被送到 packager 中去生成最后生成的输出文件。

---------

### FSCache
> 缓存

### Logger
> 日志输出

### Server , HMRServer
> 为打包结果生成web服务



```


```











































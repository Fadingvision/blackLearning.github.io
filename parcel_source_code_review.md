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
> 资源打包解析类，规定了如何对各种资源进行解析

### Resolver
> 资源路径解析类，如何对代码中引入的各种相对路径的资源路径进行解析，从而找到该模块的绝对路径。

#### Example: 

```
./app.js  =>  /home/cxy/other_stuff/demos/parcel_demo/app.js
react => /home/cxy/other_stuff/demos/parcel_demo/node_modules/react/index.js
```

#### node的模块路径解析规则

当 Node 遇到 require(X) 时，按下面的顺序处理：

（1）如果 X 是内置模块（比如 require('http'）) 

　　a. 返回该模块。 

　　b. 不再继续执行。

（2）如果 X 以 "./" 或者 "/" 或者 "../" 开头 

　　a. 根据 X 所在的父模块，确定 X 的绝对路径。 

　　b. 将 X 当成文件，依次查找下面文件，只要其中有一个存在，就返回该文件，不再继续执行。
	```shell
	X
	X.js
	X.json
	X.node
	```
　　c. 将 X 当成目录，依次查找下面文件，只要其中有一个存在，就返回该文件，不再继续执行。
	```shell
	X/package.json（main字段）
	X/index.js
	X/index.json
	X/index.node
	```
（3）如果 X 不带路径 

　　a. 根据 X 所在的父模块，确定 X 可能的安装目录。 

　　b. 依次在每个目录中，将 X 当成文件名或目录名加载。

（4） 抛出 "not found"


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

----

# Flows (打包流程)

1. 利用Bundle　cli或者node api得到打包的配置选项
2. 根据配置选项来加载插件，启动监控，启动hot module reload模式
3. 如果是初次打包，需要递归创建dist目录
4. 根据入口文件得到主资源（Asset实例） （`resolveAsset`）(Bundle.js #258)
	- 通过Resolver类的resolve方法解析入口文件的绝对路径

	```js
	let {path, pkg} = await this.resolver.resolve(name, parent);
	```

	- 有了模块的绝对路径，就可以加载该模块了。

	```js
	this.parser.getAsset(path, pkg, this.options);
	```

	- 根据对应的后缀名来区分不同的资源类型，通过Parser类来找到对应的Asset类对该资源生成Asset实例。

	- 将对应的Asset实例与资源绝对路径通过`loadedAssets`(Set结构)一一对应起来，并在watcher添加该路径，观察该文件变化。
        
5. 将主入口Asset加入队列`buildQueue`，遍历`buildQueue`，　然后通过`loadAsset`将每个资源进行加载。（`buildQueuedAssets`）

	__loadAsset:__
	- 首先尝试从缓存中读取该资源，如果有该资源，直接从缓存中读取，缓存文件被存在`.cache`文件夹中，这也是parcel打包速度很快的秘诀之一。
	- 如果缓存中不存在该资源，通过Asset实例的process方法新生成Assets的打包串
	- 分析出该asset的所有依赖和隐式依赖。
		```js
		// Call the delegate to get implicit dependencies
		let dependencies = processed.dependencies;
		console.log(dependencies)
		if (this.delegate.getImplicitDependencies) {
		  let implicitDeps = await this.delegate.getImplicitDependencies(asset);
		  if (implicitDeps) {
		    dependencies = dependencies.concat(implicitDeps);
		  }
		}
		```
	- 对所有依赖进行循环，然后再次对每个依赖执行`loadAsset`方法，依次递归的对每个依赖进行LoadAsset处理，形成Assets树，
	即每个Asset实例中都有它自己的depAssets.

	- 完成上述步骤后，从`buildQueue`队列中删除该资源。


6. 如果开启了hmr模式，则一次对这些更新的模块执行热更新。
	```js
	if (this.hmr && !isInitialBundle) {
	  this.hmr.emitUpdate([...this.findOrphanAssets(), ...loadedAssets]);
	}
	```

7. 完成Assets树的建立之后，需要根据入口资源Asset实例构建BundleTree。（`createBundleTree`）

8. 完成所有资源的分析、解析、处理之后，需要把他们按照一定的顺序和结构将其组成最终的打包文件，并生成到最后的dist目录中.

9. 记录整个过程的打包时间，并输出打包的成功或失败的消息，
并触发`buildEnd`事件，重置pending状态，整个打包至此结束。










































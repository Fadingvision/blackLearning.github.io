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

# Flows

##  初始打包流程

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
	- 如果缓存中不存在该资源，在farm中通过Asset实例的process方法进行资源的加载和处理。

		__process():__

		`load`: 从原始文件中读取文件内容。

		`pretransform`: 预处理，比如js资源会用babel()进行转换

		`getDependencies`:　这里主要对资源字符串进行解析，例如html字符串用`posthtml-parser`, js资源用`babylon.parse`来解析。然后收集依赖`collectDependencies`，具体操作稍后分析。

		`transform`: 资源处理, 具体操作稍后分析。

		`generate`: 处理转换完毕之后，生成最后的打包代码字符串。
		格式一般为{`[type]`: `code`}

		`generateHash`: 为该资源生成hash字符串。

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

	- 创建根bundle实例，并将实例的入口资源设为打包的资源。
	- 将bundle实例加入到`asset`实例的bundles集合中，将`asset`实例
	加入到bundle实例的`assets`资源中，这样形成两者相互引用。
	－　循环该资源的所有依赖，并对这些依赖构建bundleTree, 这样递归形成一个`Bundle Tree`.

	- 构建子bundle的时候，将`dep`加入到asset的parentDeps中

	- 判断重复打包：　
		```
		if (asset.parentBundle) {
		  // If the asset is already in a bundle, it is shared. Move it to the lowest common ancestor.
		  if (asset.parentBundle !== bundle) {
		    let commonBundle = bundle.findCommonAncestor(asset.parentBundle);
		    if (
		      asset.parentBundle !== commonBundle &&
		      asset.parentBundle.type === commonBundle.type
		    ) {
		      this.moveAssetToBundle(asset, commonBundle);
		      return;
		    }
		  } else return;
		}
		```

		如果一个资源的`parentBundle`已经存在并且等于此次正在对它进行打包的`bundle` => 同样是父资源，那么说明他已经被打包过了，则直接跳过接下来的打包程序。

		@TODO: `if (asset.parentBundle !== bundle)`
		如果一个资源的打包出口不一样，则需要将其提取出来放到公共的父bundle中去，从而避免一份代码重复的打包到了两份输出中。

8. 完成所有资源的分析、解析、处理之后，需要把他们按照一定的顺序和结构将其组成最终的打包文件，并生成到最后的dist目录中.

```js
this.bundleHashes = await bundle.package(this, this.bundleHashes);
```

完成整个资源树的建立后，就用`主打包`bundle实例来生成最终的打包文件。

	- 首先生成新的hash值，只有在旧的hash值不存在或者新的hash值不等于旧的hash值的时候，才进行`package`操作。

	- 然后循环该bundle的所有childBundle,依次进行打包操作。
	- 每个bundle实例都会生成一个最终的打包文件。

	- `Packager`实例：根据bundle的类型找到对应的打包资源处理类。

	- `packager.addAsset(asset);`
	以JsPackager类为例，看看如何通过asset实例来生成最后的打包文件。

	- 文件写入流

	首先创建一个写入的文件流`fs.createWriteStream`

	将模块加载开头代码插入，

	然后插入打包代码`asset.generated.js,`

	最后插入hot module reload所需的客户端代码(如果开启了hmr),

	最后结束文件流的写入。

	最终的js打包代码：


```js
require = (function(modules, cache, entry) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof require === 'function' && require;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        var err = new Error("Cannot find module '" + name + "'");
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;

      var module = (cache[name] = new newRequire.Module());

      modules[name][0].call(module.exports, localRequire, module, module.exports);
    }

    return cache[name].exports;

    function localRequire(x) {
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x) {
      return modules[name][1][x] || x;
    }
  }

  function Module() {
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  // Override the current require with this new one
  return newRequire;
})(
	// modules
	{
		1: [
			     function(require, module, exports) {
			       /**
			* Copyright (c) 2013-present, Facebook, Inc.
			*
			* This source code is licensed under the MIT license found in the
			* LICENSE file in the root directory of this source tree.
			*
			*/

		       'use strict';

		       var emptyObject = {};

		       if ('development' !== 'production') {
		         Object.freeze(emptyObject);
		       }

		       module.exports = emptyObject;
		     },
		     {}
		],
	
		// 模块0通常用来当作hmr的代码插入，其他业务代码的模块id
		一般以1开始

		0: [
      function(require, module, exports) {
        var global = (1, eval)('this');
        var OldModule = module.bundle.Module;
        function Module() {
          OldModule.call(this);
          this.hot = {
            accept: function(fn) {
              this._acceptCallback = fn || function() {};
            },
            dispose: function(fn) {
              this._disposeCallback = fn;
            }
          };
        }

        module.bundle.Module = Module;

        if (!module.bundle.parent && typeof WebSocket !== 'undefined') {
          var ws = new WebSocket('ws://' + window.location.hostname + ':45564/');
          ws.onmessage = function(event) {
            var data = JSON.parse(event.data);

            if (data.type === 'update') {
              data.assets.forEach(function(asset) {
                hmrApply(global.require, asset);
              });

              data.assets.forEach(function(asset) {
                if (!asset.isNew) {
                  hmrAccept(global.require, asset.id);
                }
              });
            }

            if (data.type === 'reload') {
              ws.close();
              ws.onclose = function() {
                window.location.reload();
              };
            }

            if (data.type === 'error-resolved') {
              console.log('[parcel] ✨ Error resolved');
            }

            if (data.type === 'error') {
              console.error('[parcel] 🚨  ' + data.error.message + '\n' + 'data.error.stack');
            }
          };
        }

        function getParents(bundle, id) {
          var modules = bundle.modules;
          if (!modules) {
            return [];
          }

          var parents = [];
          var k, d, dep;

          for (k in modules) {
            for (d in modules[k][1]) {
              dep = modules[k][1][d];
              if (dep === id || (Array.isArray(dep) && dep[dep.length - 1] === id)) {
                parents.push(+k);
              }
            }
          }

          if (bundle.parent) {
            parents = parents.concat(getParents(bundle.parent, id));
          }

          return parents;
        }

        function hmrApply(bundle, asset) {
          var modules = bundle.modules;
          if (!modules) {
            return;
          }

          if (modules[asset.id] || !bundle.parent) {
            var fn = new Function('require', 'module', 'exports', asset.generated.js);
            asset.isNew = !modules[asset.id];
            modules[asset.id] = [fn, asset.deps];
          } else if (bundle.parent) {
            hmrApply(bundle.parent, asset);
          }
        }

        function hmrAccept(bundle, id) {
          var modules = bundle.modules;
          if (!modules) {
            return;
          }

          if (!modules[id] && bundle.parent) {
            return hmrAccept(bundle.parent, id);
          }

          var cached = bundle.cache[id];
          if (cached && cached.hot._disposeCallback) {
            cached.hot._disposeCallback();
          }

          delete bundle.cache[id];
          bundle(id);

          cached = bundle.cache[id];
          if (cached && cached.hot && cached.hot._acceptCallback) {
            cached.hot._acceptCallback();
            return true;
          }

          return getParents(global.require, id).some(function(id) {
            return hmrAccept(global.require, id);
          });
        }
      },
      {}
    ]
	},

	// cache
	// 初始一般为一个空对象
	{},
	
	// module entry
	// 整个应用的入口，也是整个业务代码中最先执行的部分
	[0, 2]
)
```	

9. 记录整个过程的打包时间，并输出打包的成功或失败的消息，
并触发`buildEnd`事件，重置pending状态，整个打包至此结束。


------------


##  更新流程


## Q&A


-　如何收集各个资源中的依赖？

-　不同类型的资源怎么做不同的处理和转换？

-　如何处理重复资源打包的问题？

- 如何处理各种非Js资源?

- 如何利用webSocket 实现HMR功能？

- 如何利用缓存提高打包速度？

- 如何处理不同模块系统的代码，并生成统一的模块依赖方式？

- 如何自定义一个Parcel-plugin,或者新增一个资源类型处理的类？










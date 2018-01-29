# Parcel

> Version: 1.4.1

# Classes

### Bundler
> 打包主程序


### Assets

文件资源类，负责记录所有的原始资源，资源打包的结果信息；
负责自身资源的处理，资源依赖的收集，包含资源的下列信息：

> offical comments: 一个资源代表了依赖树中的一个文件，
该资源可以有很多父资源去依赖它，并且能够被加入到多个输出的bundles中，基类Asset自身并不做太多工作，只是设置一个接口给子类去实现，例如JsAsset, HTMLAsset, LessAssets等等。

__properties:__

- id: 简单的id生成方法：从1开始自加
- ast: 抽象语法树
- basename: 资源名称(e: index.html)
- name: 带有绝对路径的资源名称
- type: 资源类型(取资源名称后缀)
- bundles(`Set`): 该资源被打包进去的包，Bundle的实例
- depAssets(`Map`): 记录该资源的其他依赖资源，Asset实例
- dependencies(`Map`): 记录该资源的其他依赖资源名称等信息
- generated(`Object`): 记录该资源打包后生成的文件内容
- hash(`Object`): 记录该资源hash值
- options, package: 来自bundler的信息
- processed: 记录该资源是否已经被打包过的标识
- parentDeps(`Set`): 记录父资源（即依赖该资源的资源）的dependencies

- parentBundle: 记录父资源（即依赖该资源的资源）的bundle

__methods:__

- `load`: 从原始文件中读取文件内容。
- `collectDependencies`:　收集依赖`collectDependencies`，留给子类实现
- `parse`: 资源解析，不同类型的资源解析处理方式不同，例如html字符串用`posthtml-parser`, js资源用`babylon.parse`来解析，因此一般留给子类实现
- `pretransform`: 资源预转换，比如js资源会用babel()进行转换，留给子类实现
- `transform`: 资源转换，留给子类实现
- `generate`: 资源生成，生成最后的打包代码字符串。格式一般为`{　[type]: code　}`，如果子类没有实现此方法，默认为原始的字符串，
- `generateHash`: 为该资源生成hash字符串。

- `invalidate`: 重置asset的状态
- `invalidateBundle`:　重置asset的bundles状态

- `addURLDependency`:
- `generateBundleName`:

### Bundle
打包文件结果类，负责记录所有的打包结果信息，包含下列信息：

> comments: 一个bundle实例代表了一个打包输出的文件，它由多个资源组成，bundle可以有子bundle，当动态从该bundle导入文件的时候，或者导入一个其他类型资源的文件的时候（例如从JS中引入一个css文件，就会在这个js文件的bundle产生一个childBundle为css），会产生childBundles.

__properties:__

- name: 包含名称的完整生成路径
- type: 类型
- assets(`Set`): 所有组成该bundle的资源数组
- entryAsset(`Map`): 记录该打包资源的入口资源，Asset实例
- childBundles(`Map`): 记录该打包资源的子打包资源
- parentBundle: 记录父级bundle
- siblingBundles(`Object`): 记录该打包资源的兄弟打包资源

__methods:__

- addAsset: 添加资源到assets的Set中，由于Set结构的天然去重特性，这里不用担心资源重复的问题。
- removeAsset: 从assets的Set中移除资源
- getSiblingBundle: 获取兄弟资源的打包，这里分为几种情况：

```js
bundle.getSiblingBundle(asset.type).addAsset(asset);　// Bundler.js (#404)

getSiblingBundle(type) {
  // 1. 如果获取的asset的类型与已经打包的bundle类的类型一致，则直接将this返回
  然后将asset加入assets队列中，无需新增bundle实例。

  if (!type || type === this.type) {
    return this;
  }
  
  // 2.　检测已经存在的siblingBundles是否存在该类型的bundle,如果存在，那么直接取该bundle，否则新增一个chileBundle(新的bundle实例)

  if (!this.siblingBundles.has(type)) {
    let bundle = this.createChildBundle(
      type,
      Path.join(
        Path.dirname(this.name),
        Path.basename(this.name, Path.extname(this.name)) + '.' + type
      )
    );
    this.siblingBundles.set(type, bundle);
  }

  return this.siblingBundles.get(type);
}
```

- createChildBundle: 新增一个bundle实例，将其放入childBundles中。

- package: 将自身bundle树遍历，根据每个bundle然后组合打包的代码，生成最终的打包文件。


### Parser
> 资源打包解析类，规定了如何对各种资源进行解析


__properties:__

- `extensions`: 资源处理对象，记录各种后缀的资源应该用哪种对应的Asset类来进行实例化

__methods:__

- `findParser`: 通过文件的后缀名来从`extensions`中找到对应的Asset类
- `getAsset`: 将找到的与文件吻合的Asset类进行实例化。

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


__methods:__

`resolveInternal`:

```js
resolveInternal(filename, parent, resolver) {

  // 优先从缓存中取，这对一些常用的模块，
  // 例如react app，基本上每个模块中都有对react的依赖，
  // 这时可以加快读取模块位置的速度

  let key = this.getCacheKey(filename, parent);
  if (this.cache.has(key)) {
    return this.cache.get(key);
  }

  if (glob.hasMagic(filename)) {
    return {path: path.resolve(path.dirname(parent), filename)};
  }

  // 将引用该模块的模块的后缀名放到优先级最高,
  // 因为多数情况下是同类模块互相引用的

  let extensions = Object.keys(this.options.extensions);
  if (parent) {
    const parentExt = path.extname(parent);
    // parent's extension given high priority
    extensions = [parentExt, ...extensions.filter(ext => ext !== parentExt)];
  }

  return resolver(filename, {
    filename: parent, // require()调用源自哪里
    paths: this.options.paths, // 当在node_modules没找到时额外的查找路径

    // modules定义了一些特殊的模块查找规则,
    // 例如node-libs-browser(https://github.com/webpack/node-libs-browser)
    // 以及动态导入的模块,和热更新时用的css模块的loader路径

    modules: builtins, 
    extensions: extensions, // 按顺序搜索的文件扩展名数组

    // 在向package.json中查找main字段之前转换package.json内容

    packageFilter(pkg, pkgfile) {
      // Expose the path to the package.json file
      pkg.pkgfile = pkgfile;

      // 由于一些库(例如d3.js)没有把库的入口文件放在main字段中, 
      // 因此这里将module, jsnext:main的优先级提高
      // 如果定义了这两个字段,则优先以这两个字段为准

      const main = [pkg.module, pkg['jsnext:main']].find(
        entry => typeof entry === 'string'
      );

      if (main) {
        pkg.main = main;
      }

      return pkg;
    }
  });
}
```


### Packager
> 打包组合类，用于将各个打包结果组合，并生成最后的输出文件。

> 在 Parcel 中，一个 Packager 将多个资源(`assets`)合并到一个最终生成的文件束(`bundle`)中。此过程发生在主进程中，且在所有资源被处理及文件束树(`createBundleTree`)被创建之后。Packager 的注册是基于输出文件类型，并且用于生成这种文件类型的资源会被送到 packager 中去生成最后生成的输出文件。


__properties:__

- `bundle`: 此次用于输出的bundle实例,一个bundle实例输出一个文件.
- `options`: bunlder的配置选项.

__methods:__

以JSPackager为例:

- `setup`: 创建一个可持续写入文件的node stream
- `start`: 开始写入一个文件之前的预处理, 例如js包插入模块定义代码(`builtins/prelude.js`)
- `addAsset`: 将一个asset的代码写入到打包文件中,即将asset中之前generate的代码`asset.generated.js`按照之前模块的定义规则组合后,插入文件流中.
- `end`: 后处理,例如js包中插入hmr代码(`builtins/hmr-runtime.js`), 关闭文件流等

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

		`transform`: 资源转换步骤接收 AST并对其进行遍历，在此过程中对节点进行添加、更新及移除等操作。 

		`generate`: 代码生成步骤把最终（经过一系列转换之后）的 AST 转换成字符串形式的代码，同时还会创建源码映射（source maps）。代码生成其实很简单：深度优先遍历整个 AST，然后构建可以表示转换后代码的字符串。
		生成最后的代码格式一般为{`[type]`: `code`}

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
// module prelude
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


- 如何收集各个资源中的依赖？(asset.collectDependencies)


__JSAsset__: 

1. 利用`babylon.parse`将代码字符串转换为抽象语法树。

[babylon](https://github.com/babel/babylon)

2. collectDependencies

由于收集依赖时的遍历并不需要对代码进行转换，所以这里使用[Babel-travserse](https://github.com/babel/babel/tree/master/packages/babel-traverse)的轻量版本
[babylon-walk](https://github.com/pugjs/babylon-walk)对js代码进行遍历。

```js
traverseFast(visitor) {
  return walk.simple(this.ast, visitor, this);
}

collectDependencies() {
  this.traverseFast(collectDependencies);
}
```

Visitors（访问者）
[Babel-handlebook](https://github.com/thejameskyle/babel-handbook/blob/master/translations/zh-Hans/plugin-handbook.md)

当我们谈及“进入”一个节点，实际上是说我们在访问它们， 之所以使用这样的术语是因为有一个访问者模式（visitor）的概念。.

访问者是一个用于 AST 遍历的跨语言的模式。 简单的说它们就是一个对象，定义了用于在一个树状结构中获取具体节点的方法。 














































- 不同类型的资源怎么做不同的处理和转换？(asset.parse, asset.transform)

js: babel

- 什么是动态导入, 如何实现动态导入？(dep.dynamic)

- 如何处理重复资源打包的问题？(findCommonAncestor)

- 如何处理不同模块系统的代码，并生成统一的模块依赖方式？(babel, prelude.js)

- 如何处理各种非Js资源? (Asset的各种子类实现)

- 如何监听打包资源的变化？(FSWatcher, onChange)

- 如何利用webSocket 实现HMR功能？ (HMRServer, hmr-runtime.js)

- 如何利用缓存提高打包速度？(Cache)

- 如何自定义一个Parcel-plugin,或者新增一个资源类型处理的类？




## The good things you can learn through the code-review 

### 业务层面：

1. 熟悉工具或框架的使用，API.
2. 对使用过程中出现的问题能够快速的debug.
3. 对于工具深度的性能优化有更深的了解。


###　技术层面：

1. 代码的风格，命名，注释，设计模式，编程范式，小技巧的使用
2. 平时不容易用到的技术的了解和熟悉（比如parcel的websocket, hmr, 缓存）
3. 平时不容易用到的深层次的语言特性的熟悉(原型，继承，async, generator, iterator等等)




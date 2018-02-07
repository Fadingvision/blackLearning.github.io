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
    // 以及动态导入的模块(bundle-loader),和热更新时用的css模块的loader路径

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

9. 记录整个过程的打包时间，并输出打包的成功或失败的消息，
并触发`buildEnd`事件，重置pending状态，整个打包至此结束。


------------


##  更新流程


## Q&A


### 如何收集各个资源中的依赖？(asset.collectDependencies)


__JSAsset__: 

1. 利用`babylon.parse`将代码字符串转换为抽象语法树。

[babylon](https://github.com/babel/babylon)
[Ast树形可视化](http://astexplorer.net/)

2. collectDependencies

由于收集依赖时的遍历并不需要对代码进行转换，所以这里使用[Babel-travserse](https://github.com/babel/babel/tree/master/packages/babel-traverse)的轻量快速版本
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

> 当我们谈及“进入”一个节点，实际上是说我们在访问它们， 之所以使用这样的术语是因为有一个访问者模式（visitor）的概念。.

> 访问者是一个用于 AST 遍历的跨语言的模式。 简单的说它们就是一个对象，定义了用于在一个树状结构中获取具体节点的方法。 


```js
const MyVisitor = {
  Identifier() {
    console.log("Called!");
  }
};
```

> 这是一个简单的访问者，把它用于遍历中时，每当在树中遇见一个 Identifier 的时候会调用 Identifier() 方法，这些调用都发生在进入节点时，不过有时候我们也可以在退出时调用访问者方法。


在看用于收集依赖的visitor之前，先了解下ES6 module和nodejs的模块系统的几种导入导出方式以及对应在抽象语法树中代表的declaration类型：

```js
// ImportDeclaration
import { stat, exists, readFile } from 'fs';

// ExportNamedDeclaration with node.source = null;
export var year = 1958;

// ExportNamedDeclaration with node.source = null;
export default function () {
  console.log('foo');
}

// ExportNamedDeclaration with node.source.value = 'my_module';
export { foo, bar } from 'my_module';

// CallExpression with node.Callee.name is require;
// CallExpression with node.Callee.arguments[0] is the 'react';
import('react').then(...)

// CallExpression with node.Callee.name is require;
// CallExpression with node.Callee.arguments[0] is the 'react';
var react = require('react');
```

除了上述这些依赖引入方式之外，还有两种比较特殊的方式：

```js
// web Worker
new Worker('sw.js')

// service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw-test/sw.js', { scope: '/sw-test/' }).then(function(reg) {
    // registration worked
    console.log('Registration succeeded. Scope is ' + reg.scope);
  }).catch(function(error) {
    // registration failed
    console.log('Registration failed with ' + error);
  });
}
```


访问JS资源时的Visitor，具体的依赖收集方法就会在遍历到相应的依赖引入的时候执行。

```js
module.exports = {
  ImportDeclaration(node, asset) {
    asset.isES6Module = true;
    addDependency(asset, node.source);
  },

  ExportNamedDeclaration(node, asset) {
    asset.isES6Module = true;
    if (node.source) {
      addDependency(asset, node.source);
    }
  },

  ExportAllDeclaration(node, asset) {
    asset.isES6Module = true;
    addDependency(asset, node.source);
  },

  ExportDefaultDeclaration(node, asset) {
    asset.isES6Module = true;
  },

  CallExpression(node, asset) {
    let {callee, arguments: args} = node;

    let isRequire =
      types.isIdentifier(callee) &&
      callee.name === 'require' &&
      args.length === 1 &&
      types.isStringLiteral(args[0]);

    if (isRequire) {
      addDependency(asset, args[0]);
      return;
    }

    let isDynamicImport =
      callee.type === 'Import' &&
      args.length === 1 &&
      types.isStringLiteral(args[0]);

    if (isDynamicImport) {
      asset.addDependency('_bundle_loader');
      addDependency(asset, args[0], {dynamic: true});

      node.callee = requireTemplate().expression;
      node.arguments[0] = argTemplate({MODULE: args[0]}).expression;
      asset.isAstDirty = true;
      return;
    }

    const isRegisterServiceWorker =
      types.isStringLiteral(args[0]) &&
      matchesPattern(callee, serviceWorkerPattern);

    if (isRegisterServiceWorker) {
      addURLDependency(asset, args[0]);
      return;
    }
  },

  NewExpression(node, asset) {
    const {callee, arguments: args} = node;

    const isWebWorker =
      callee.type === 'Identifier' &&
      callee.name === 'Worker' &&
      args.length === 1 &&
      types.isStringLiteral(args[0]);

    if (isWebWorker) {
      addURLDependency(asset, args[0]);
      return;
    }
  }
};
```

__CSSAsset__:

css中的依赖一般为其他css（关键字：@import）, 以及引入的图片(关键字： url)。

首先是`@import`规则：

@import url list-of-media-queries; 

>url
>
>是一个表示要引入资源位置的 <string> 或者 <uri> 。 这个 URL 可以是绝对路径或者相对路径。 要注意的是这个 URL 不需要指明一个文件； 可以只指明包名，然后合适的文件会被自动选择 (e.g. chrome://communicator/skin/).
>
>list-of-media-queriers
>
>是一个逗号分隔的 媒体查询 条件列表，决定通过URL引入的 CSS 规则 在什么条件下应用。如果浏览器不支持列表中的任何一条媒体查询条件，就不会引入URL指明的CSS文件。

其次是`url(..asset)`

```js

// 同JS类似， 首先利用postcss.parse方法构建css的AST树
let root = postcss.parse(code, {from: this.name, to: this.name});

然后主要利用[postcss-value-parser](https://github.com/TrySound/postcss-value-parser)去解析所有的属性值。

collectDependencies() {
  // 遍历树上的每条规则
  // 例如 width: 30px 为一条rule，这里过滤出所有import类型的rule
  this.ast.root.walkAtRules('import', rule => {
	// 用postcss-value-parser解析成节点树
    let params = valueParser(rule.params).nodes;
    let [name, ...media] = params;
    let dep;

    // 如果是import xxx.css
    if (name.type === 'string') {
      dep = name.value;
    // 如果是import url(xxx.css)
    } else if (
      name.type === 'function' &&
      name.value === 'url' &&
      name.nodes.length
    ) {
      dep = name.nodes[0].value;
    }

    if (!dep) {
      throw new Error('Could not find import name for ' + rule);
    }
	
	  // 如果是网络资源，则不计入依赖
    if (PROTOCOL_RE.test(dep)) {
      return;
    }

    media = valueParser.stringify(media).trim();
    // 记录这条依赖的行数，media规则，
    this.addDependency(dep, {media, loc: rule.source.start});
	
	  // 移除这条规则
    rule.remove();
    // ast已经被改动过，将dirty flag置为true
    this.ast.dirty = true;
  });

  // 遍历所有的属性值
  this.ast.root.walkDecls(decl => {
  	// 过滤掉网络资源（类似http(s)之类开头的资源）
    if (URL_RE.test(decl.value)) {
      let parsed = valueParser(decl.value);
      let dirty = false;

      parsed.walk(node => {
        if (
          node.type === 'function' &&
          node.value === 'url' &&
          node.nodes.length
        ) {
          let url = this.addURLDependency(node.nodes[0].value, {
            loc: decl.source.start
          });
          // 经过处理后的资源url是否变化
          dirty = node.nodes[0].value !== url;

          // 将本地的相对资源经过处理后替换掉原url
          node.nodes[0].value = url;
        }
      });

      if (dirty) {
        // 如果变化了，说明ast被改动了
        decl.value = parsed.toString();
        this.ast.dirty = true;
      }
    }
  });
}
```


__HTMLAsset__:


利用`posthtml-parser`来生成AST


```js

const ATTRS = {
  src: [
    'script',
    'img',
    'audio',
    'video',
    'source',
    'track',
    'iframe',
    'embed'
  ],
  href: ['link', 'a'],
  poster: ['video']
};

collectDependencies() {
  this.ast.walk(node => {
    if (node.attrs) {
      for (let attr in node.attrs) {
        let elements = ATTRS[attr];

        // 如果Html中有src, href或者post属性
        // 并且这个节点属于上述节点之一, 则说明有依赖存在

        if (elements && elements.includes(node.tag)) {

          // 加入依赖列表, 生成该资源最后的打包路径
          let assetPath = this.addURLDependency(node.attrs[attr]);

          // 如果生成的资源路径不是http资源, 则用publicURL(默认为/dist)将其拼接起来,
          // 以便在server中的静态资源中可以访问到

          if (!isURL(assetPath)) {
            assetPath = urlJoin(this.options.publicURL, assetPath);
          }

          // 替换源码
          node.attrs[attr] = assetPath;
          this.isAstDirty = true;
        }
      }
    }

    return node;
  });
}

// Asset.js #64
addURLDependency(url, from = this.name, opts) {
    // 如果该资源路径是一个网络资源,则直接返回该资源
    if (!url || isURL(url)) {
      return url;
    }

    if (typeof from === 'object') {
      opts = from;
      from = this.name;
    }

    // 从该资源的相对路径以及引用该资源的资源的绝对路径推算出该资源的绝对路径

    let resolved = path.resolve(path.dirname(from), url).replace(/[?#].*$/, '');

    // 转为根据当前目录的相对路径之后, 存入依赖数组中.
    // 通过以下方式引入的资源:
    // (html中引入的相对路径资源, css中url()引入的相对路径资源, js中的web Worker, service worker, import()引入的相对路径资源)
    // 都设为dynamic: true

    this.addDependency(
      './' + path.relative(path.dirname(this.name), resolved),
      Object.assign({dynamic: true}, opts)
    );
    
    // 返回hash之后的资源名称, 也是打包之后的资源名称, 从而在源代码中进行替换
    return this.options.parser
      .getAsset(resolved, this.package, this.options)
      .generateBundleName();
  }
```

__注意:__ 依赖收集的过程中,是不会判断是否是重复资源的问题的, 资源去重的功能会在createBundleTree的时候, 也就是生成最终的bundle树的时候进行判断.


### 什么是动态导入, 如何实现动态导入？(dep.dynamic)

一个动态导入的资源, 也就是说会在代码执行的过程中按需通过http的方式动态的被加载, 而不是一开始编译的时候就被加载到了源码中.

在parcel中,html中引入的相对路径资源, css中url()引入的相对路径资源, js中的web Worker, service worker, import()引入的相对路径资源,
这些资源依赖都被设为`dynamic: true`;

纵观源码, 一个依赖是否是dynamic的, 决定了它是否会创建一个新的bundle束,
从而决定了最终是否会被生成一个新的文件.

所以只需要将动态导入的资源新生成一个bundle束, 从而打包出新的文件, 再从源码中替换掉对应的资源, 这样代码执行的时候就可以加载到对应的打包过后的动态资源. 


### 如何处理Web Worker, Service Worker, import()引入的依赖？ (assset.addURLDependency)

Web Worker, Service Worker的处理比较简单, 只需要将原来的资源路径替换成打包后的资源路径.

__Import()__: 

如果碰到Import()导入的资源, 直接将_bundle_loader加入其依赖列表,
根据前面resolver的模块路径解析中对特殊模块的处理, 遇到_bundle_loader的时候会解析成`builtins/bundle-loader.js`这个资源, 这个资源也是专门用来处理动态js, css的引入.

```js
if (isDynamicImport) {
  asset.addDependency('_bundle_loader');

  addDependency(asset, args[0], {dynamic: true});

  node.callee = requireTemplate().expression;
  node.arguments[0] = argTemplate({MODULE: args[0]}).expression;
  asset.isAstDirty = true;
  return;
}
```

根据上面的代码, 在ast中如果遇到 `import('./dialog.js').then(module => ...)`这段动态引入的代码, 会被直接替换为`require('_bundle_loader')(require.resolve('./dialog.js').then(module => ...)`;

通过`prelude.js(#51)`可以知道`require.resolve('./dialog.js')`实际上得到的是资源`./dialog.js`的资源id. 这种id的格式一般为数字, 

而这种动态资源由于设置了`dynamic: true`, 一般会在打包的时候单独生成一个文件, 所以处理资源的时候做了单独处理.

`JSPackager.js(#42-#55)`

```js
// 对于动态资源, 会将动态资源的打包文件名插入资源数组中.
if (dep.dynamic && this.bundle.childBundles.has(mod.parentBundle)) {
  let bundles = [path.basename(mod.parentBundle.name)];

  // 如果该动态资源引入了其他类型的资源, 例如js中引入了css文件.
  // 需要将这些其他的subilingBundles生成的文件名一起加入依赖数组中,在引入该动态js的同时, 需要把这些例如css样式文件也跟随动态资源一起加载进来.

  for (let child of mod.parentBundle.siblingBundles.values()) {
    if (!child.isEmpty) {
      bundles.push(path.basename(child.name));
    }
  }
  
  // 保障最后一个元素一定是该动态资源的id
  bundles.push(mod.id);
  deps[dep.name] = bundles;
} else {
  deps[dep.name] = this.dedupe.get(mod.generated.js) || mod.id;
}
```

最后得到的打包资源数组为:
`[md5(dynamicAsset).js, md5(cssWithDynamicAsset).css, ..., assetId]`, 由打包之后的文件名和该模块的id所组成.



```js

// bundle-loader.js

var getBundleURL = require('./bundle-url').getBundleURL;


// bundles: `[md5(dynamicAsset).js, md5(cssWithDynamicAsset).css, ..., assetId]`

function loadBundles(bundles) {

  var id = Array.isArray(bundles) ? bundles[bundles.length - 1] : bundles;
  
  // 因为可能存在某个资源也通过普通的方式多次引入, 或者已经被引入过了, 所以有可能已经加载完毕了.
  // 因此首先尝试在自身打包束中去查找该模块,

  try {
    return Promise.resolve(require(id));
  } catch (err) {

    // 如果没有找到该模块, 则尝试通过模块打包后的文件名新建script标签动态的引入该模块,

    if (err.code === 'MODULE_NOT_FOUND') {
      // 这里在promise上包装一个一层,保障在执行import()的then方法的时候才会真正的去网络加载对应的资源.

      return new LazyPromise(function (resolve, reject) {
        // 在模块加载完之后再次去尝试require该模块。
        Promise.all(bundles.slice(0, -1).map(loadBundle)).then(function () {
          return require(id);
        }).then(resolve, reject);
      });
    }

    throw err;
  }
}

module.exports = exports = loadBundles;

var bundles = {};
var bundleLoaders = {
  js: loadJSBundle,
  css: loadCSSBundle
};

function loadBundle(bundle) {
  if (bundles[bundle]) {
    return bundles[bundle];
  }
  
  // TODO: 如何根据文件名找到该文件准确的网络路径?

  var type = bundle.match(/\.(.+)$/)[1].toLowerCase();
  var bundleLoader = bundleLoaders[type];
  if (bundleLoader) {
    return bundles[bundle] = bundleLoader(getBundleURL() + bundle);
  }
}

// 通过网络加载对应的Js , css资源

function loadJSBundle(bundle) {
  return new Promise(function (resolve, reject) {
    var script = document.createElement('script');
    script.async = true;
    script.type = 'text/javascript';
    script.charset = 'utf-8';
    script.src = bundle;
    script.onerror = function (e) {
      script.onerror = script.onload = null;
      reject(e);
    };

    script.onload = function () {
      script.onerror = script.onload = null;
      resolve();
    };

    document.getElementsByTagName('head')[0].appendChild(script);
  });
}

function loadCSSBundle(bundle) {
  return new Promise(function (resolve, reject) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = bundle;
    link.onerror = function (e) {
      link.onerror = link.onload = null;
      reject(e);
    };

    link.onload = function () {
      link.onerror = link.onload = null;
      resolve();
    };

    document.getElementsByTagName('head')[0].appendChild(link);
  });
}

// LazyPromise保障executor在then方法调用之后才会执行, 而并不是新建promise实例的时候执行.

function LazyPromise(executor) {
  this.executor = executor;
  this.promise = null;
}

LazyPromise.prototype.then = function (onSuccess, onError) {
  return this.promise || (this.promise = new Promise(this.executor).then(onSuccess, onError));
};

LazyPromise.prototype.catch = function (onError) {
  return this.promise || (this.promise = new Promise(this.executor).catch(onError));
};

```

###  如何实现一个前端模块加载器, 如何处理不同模块系统的代码，并将其混入这个自有的模块机制？(babel, prelude.js)

CommonJS规范的主要内容：

模块必须通过 module.exports 导出对外的变量或接口，通过 require() 来导入其他模块的输出到当前模块作用域中。

CommonJS模块的特点：

（1）所有代码运行在当前模块作用域中，不会污染全局作用域

（2）模块同步加载，根据代码中出现的顺序依次加载

（3）模块可以多次加载，但是只会在第一次加载时运行一次，然后运行结果就被缓存了，以后再加载，就直接读取缓存结果。要想让模块再次运行，必须清除缓存。


es6的模块通通被转成commonJs模块处理,
下面是经过babel的插件`babel-plugin-transform-es2015-modules-commonjs`转换的结果.


```js
// input
import a from './b.js';
export default a;

export const b = 3;

// output
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.b = undefined;

var _b = require('./b.js');

var _b2 = _interopRequireDefault(_b);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _b2.default;

var b = exports.b = 3;
```

可以看到每个需要导入导出的模块中都有`require`, `exports`等关键字存在.


__require__
每个模块中有一个自由变量require，它是一个方法，这个方法接受一个参数，即模块的路径.

__exports__
每个模块中还有一个自由变量exports，它是一个对象，模块对外输出的API就绑定在这个对象上。而且exports是模块对外输出API的唯一途径。

首先，exports和module.exports都是引用类型的变量，而且这两个对象指向同一块内存地址。在node中，二者一开始都是指向一个空对象的.

其次，exports对象是通过形参的方式传入的，直接赋值形参会改变形参的引用，但是并不能改变作用域外的值。

__module__
根据CommonJS规范，每一个文件就是一个模块，在每个模块中，都会有一个module对象，这个对象就指向当前的模块。module对象具有以下属性：

- （1）id：当前模块的bi
- （2）exports：表示当前模块暴露给外部的值
- （3）parent： 是一个对象，表示调用当前模块的模块
- （4）children：是一个对象，表示当前模块调用的模块
- （5）filename：模块的绝对路径
- （6）paths：从当前文件目录开始查找`node_modules`目录；然后依次进入父目录，查找父目录下的node_modules目录；依次迭代，直到根目录下的`node_modules`目录
- （7）loaded：一个布尔值，表示当前模块是否已经被完全加载


下面看一看如何实现这些关键字:

首先在源码中的一个个以文件区分的模块, 经过我们的编译之后
被保存在了modules这个对象中. 

modules的大体结构是这样的. 

```js
{
  moduleId: [
    // 模块
    function (require, module, module.exports) {

      // module source code after transformed by babel...

      'use strict';

      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.b = undefined;

      var _b = require('./b.js');

      var _b2 = _interopRequireDefault(_b);

      function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

      exports.default = _b2.default;

      var b = exports.b = 3;
    },
    // 依赖模块对象, 标明了我们计算过的模块路径对应的模块id
    {"./b.js":16}
  ],

  ...
},
```

`cache`是一个对象, 每当一个模块被执行之后, 它的执行结果就会被保存在这个缓存中, 当再次需到需要这个模块的时候, 就会直接从缓存中去取对应的结果，这样也可以确保每个模块只会被执行一次。


`entry`是一个数组, 保存了入口模块的id, 这个数组中的入口模块将会被最先执行.

```js

<!-- prelude.js -->

// 定义一个全局的require函数
require = (function (modules, cache, entry) {

  // 每个require被新的覆盖之前, 保存之前的require函数, 形成一个require链 
  var previousRequire = typeof require === "function" && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        
        // 如果没有在缓存中或者当前模块列表中找到该模块, 则到最新覆盖的require中去找，
        // 这样如果最新当中没有找到，就会到之前的require中去找，以此类推， 这样确保能遍历到整个require链。

        var currentRequire = typeof require === "function" && require;
        if (!jumped && currentRequire) {
          // 到了最新的require中，需要跳过currentRequire这一步, 不然会陷入死循环
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.

        // 如果在这个require之前页面上已经有了其他的打包文件, 则尝试在之前的require上去找, 
        以此类推, 直到模块被找到, 或者require链被查找完为止.
        if (previousRequire) {
          return previousRequire(name, true);
        }
      
        // 如果通过上述所有的办法都没能找到该模块，直接抛出错误
        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }
      
      localRequire.resolve = resolve;

      // 如果在本模块列表中，但是没在缓存中，执行该模块，
      // 模块被执行之后，在模块内部，实际上就是在修改exports对象或者是module.exports对象
      // 这样同时就会更新缓存
      
      // 针对每个模块，实例化一个新的module变量，这个变量通常是用来包含该模块的导出信息。
      var module = cache[name] = new newRequire.Module;
      
      // 这里会注入3个关键字， require, module, exports.
      // 该模块的内部的顶级this会指向module.exports, 而不是浏览器的window等对象
      modules[name][0].call(module.exports, localRequire, module, module.exports);
    }
    
    // 如果已经在缓存中，直接返回该模块的导出对象，避免模块被多次执行。
    return cache[name].exports;
    
    // 传入模块内部的require是LocalRequire而不是全局的require？
    // 第一： 因为内部的require根据模块路径来查找，newRequire是根据模块id来查找
    // 第二： 确保内部require调用的是当前的require, 而不是被覆盖过的require
    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }
    
    // 将模块的路径通过模块中计算好的依赖对象，找到对应的模块id
    function resolve(x){
      return modules[name][1][x] || x;
    }
  }
  
  // Module类
  function Module() {
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  
  // 执行入口文件
  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  // 将新的require对象覆盖全局变量中的require
  return newRequire;
})(modules, cache, entry)

```

可以看到，在经过Babel的commonjs转换，packager的打包处理之后，一个简单的模块加载器就形成了。

利用函数我们把一个个模块封装起来，并给其提供 __引入和导出__ 的接口和一套模块规范，并把这些实现这些模块规范模块之间的依赖关系计算清楚，使得模块之间能够相互依赖和引用，这样在不支持模块机制的浏览器环境中，我们也能够不去污染全局变量，提前体验到模块化带来的好处。

### 如何处理重复资源打包的问题？(findCommonAncestor)


### 如何监听打包资源的变化？(FSWatcher, onChange)

### 如何利用webSocket 实现HMR功能？ (HMRServer, hmr-runtime.js)

```js
if (cached && cached.hot && cached.hot._acceptCallback) {
  cached.hot._acceptCallback();

  // 为什么在执行accept函数之后，就返回true，而不是继续更新所有依赖这个资源的资源？
  return true;
}
```

客户端和服务端是通过端口连接的吗？

为什么热更新时需要`findOrphanAssets`？

### 如何利用缓存提高打包速度？(Cache)

### 如何自定义一个Parcel-plugin,或者新增一个资源类型处理的类？




## The good things you can learn through the code-review 

### 业务层面：

1. 熟悉工具或框架的使用，API.
2. 对使用过程中出现的问题能够快速的debug.
3. 对于工具深度的性能优化有更深的了解。


### 技术层面：

1. 代码的风格，命名，注释，设计模式，编程范式，小技巧的使用
2. 平时不容易用到的技术的了解和熟悉（比如parcel的websocket, hmr, 缓存）
3. 平时不容易用到的深层次的语言特性的熟悉(原型，继承，async, generator, iterator等等)




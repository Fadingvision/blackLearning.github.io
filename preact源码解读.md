## Preact

### Component

1. 执行setState, forceUpdate =>  render函数

#### setState

和react的setState的机制不一样, setState这里是同步的，执行setState之后，state立即更新，
但是渲染的逻辑被加入到了js线程栈尾执行，并且当上一次setState之后的
component._dirty被置为true,此时如果继续执行setState将不会触发重新渲染，只有当组件重绘完毕之后，才能再次触发渲染．　


```js
setState(state, cb) {
	let s = this.state;
	if(!this.prevState) this.prevState = extend({}, s);

	extend (s, typeof state === 'function' ? state(s, this.props) : state);
	// 加入队列,异步渲染
	if(cb) (this._renderCallbacks = (this._renderCallbacks || [])).push(callback);
	
	<!-- 队列渲染 -->
	enqueueRender(this);
}

// 强制直接同步更新渲染
forceUpdate(callback) {
	if (callback) (this._renderCallbacks = (this._renderCallbacks || [])).push(callback);

	<!-- 直接渲染 -->
	renderComponent(this, FORCE_RENDER);
},
```

## h (关于如何创建虚拟节点)

- nodeName为一个元素的属性，如果该元素是dom存在的则会被转为一个tag字符串，　或者一个构造函数（自定义元素，组件）
- attributes为一个元素的属性（props）,如果没有props,　该值将被babel等插件转为Null , 原封不动的放入vNode中．
- args为一个元素的子类，

```js
function VNode() {};

function h(nodeName, attributes, ...args) {
	let stack = args.length ? [].concat(...args) : null;
	let children = [];

	// 循环stack数组，对所有child的类型进行处理,然后放入children数组中，最后生成为vNode的children属性．
	
	/*
	处理逻辑：
		1. child为数组，将其分解后放入stack循环中，依次处理．
		2. child为布尔值，child设为null,
		3. child为null时，child设为空字符串，此时不渲染
		4. child为number类型，child转为字符串渲染
		5. child 为plain object时，转为对象，render函数不会渲染对象值
		6.　当child有两个连续的simple值（字符串，数字）的时候，将两个值组合成一个值．
		7. 将child加入children数组中处理．
	*/

	while (stack.length) {
		if ((child = stack.pop()) && child.pop!==undefined) {
			for (i=child.length; i--; ) stack.push(child[i]);
		}
		else {
			if (typeof child==='boolean') child = null;

			if ((simple = typeof nodeName!=='function')) {
				if (child==null) child = '';
				else if (typeof child==='number') child = String(child);
				else if (typeof child!=='string') simple = false;
			}

			if (simple && lastSimple) {
				children[children.length-1] += child;
			}
			else if (children===EMPTY_CHILDREN) {
				children = [child];
			}
			else {
				children.push(child);
			}

			lastSimple = simple;
		}
	}

	// let v = new VNode();
	let v = Object.create(null);
	v.nodeName = nodeName;
	v.children = chilren;
	v.attributes = attributes;
	// key用来标识一个vNode的唯一性
	v.key = attributes == null ? undefined : attributes.key;

	return v;
}
```

现在有了h方法，babel等插件会自动将我们的jsx代码转化为由h函数生成的vnode tree.

现在有了这个vnode Tree我们就可以将它传入render函数，从而渲染出真实的dom节点．

虚拟DOM的好处是,它非常轻。小对象包含其他小对象,有容易优化的应用逻辑组成的结构．

这也意味着它并不依赖于任何呈现逻辑或缓慢的DOM方法。





## Component

在分解diff算法之前，我们通过是如何通过将vnode虚拟节点转化为自定义组件的真实dom，并且管理相应的组件的生命周期的．


| Lifecycle method            | When it gets called                              |
|-----------------------------|--------------------------------------------------|
| `componentWillMount`        | before the component gets mounted to the DOM     |
| `componentDidMount`         | after the component gets mounted to the DOM      |
| `componentWillUnmount`      | prior to removal from the DOM                    |
| `componentWillReceiveProps` | before new props get accepted                    |
| `shouldComponentUpdate`     | before `render()`. Return `false` to skip render |
| `componentWillUpdate`       | before `render()`                                |
| `componentDidUpdate`        | after `render()`                                 |


> 在components中存在四个与组件相关的函数:

### buildComponentFromVNode

负责将组件的虚拟vNode转为真实的dom节点（这一过程基本囊括
createComponent => setComponentProps）．．


```js
如果一个虚拟节点为自定义组件，需要从中建立compoennet组建的实例，并对其生命周期进行管理．然后在渲染其原生的子组件（div, span ...）

let vnodeName = vnode.nodeName;
if (typeof vnodeName==='function') {
	return buildComponentFromVNode(dom, vnode, context, mountAll);
}
```

当组件第一次渲染的时候(dom为undefined)，需要创建组建的实例，

```js
c = createComponent(vnode.nodeName, props, context);
// 将dom 付给nextBase, 方便回收机制复用
if (dom && !c.nextBase) {
	c.nextBase = dom;
	// passing dom/oldDom as nextBase will recycle it if unused, so bypass recycling on L229:
	oldDom = null;
}

// ...

// 然后以同步的方式初始化组件：
setComponentProps(c, props, SYNC_RENDER, context, mountAll);
```

当组件更新的时候（老的dom传入函数．）
```js
<!-- 检测是否新的节点是否与老的节点是否是同一个构造函数-->

<!--如果不是，则需要立即卸载老的组件，清空oldDom, 重新按照初次渲染组件的逻辑走(需要重新实例化组件) -->
isDirectOwner = c && dom._componentConstructor===vnode.nodeName,

if (originalComponent && !isDirectOwner) {
	unmountComponent(originalComponent);
	dom = oldDom = null;
}

// build new Component from VNode
// ...

<!-- 如果是，则直接走更新组建的逻辑 -->
if (c && isOwner && (!mountAll || c._component)) {
	setComponentProps(c, props, ASYNC_RENDER, context, mountAll);
	dom = c.base;
}
```


### createComponent

createComponent用来实例化组件．
```js
export function createComponent(Ctor, props, context) {
	let list = components[Ctor.name],
		inst;

	// 如果是以类classful形式声明的组件，则已经继承Component
	// 直接对该类进行实例化，并且声明props和context
	if (Ctor.prototype && Ctor.prototype.render) {
		inst = new Ctor(props, context);
		Component.call(inst, props, context);
	}
	// 如果是以纯函数方式声明的组件
	// 则需要直接实例化Component基类，
	// 并且将实例的render方法设为该纯函数．．
	else {
		inst = new Component(props, context);
		inst.constructor = Ctor;
		inst.render = doRender;
	}

	// 由于每个组件实例化在销毁之前，
	都会将构造函数名称作为key被放入components对象之中，
	如果检测新的组件名字和回收列表中的组件属于同一个实例．
	则将原来组件的dom结构复制给新的组件，
	删除之前创建的那个组件，以达到组件dom结构复用目的．
	if (list) {
		for (let i=list.length; i--; ) {
			if (list[i].constructor===Ctor) {
				inst.nextBase = list[i].nextBase;
				list.splice(i, 1);
				break;
			}
		}
	}
	console.log(inst)
	return inst;
}
```


### setComponentProps

初始化组件或者是在组件更新的时候负责调用组件的一系列的生命周期的方法．__componentWillMount, componentWillReceiveProps__


```js
function setComponentProps(component, props, opts, context, mountAll) {
	if (component._disable) return;
	component._disable = true;

	if ((component.__ref = props.ref)) delete props.ref;
	if ((component.__key = props.key)) delete props.key;
	
	// 如果该组件没有dom值，则认为是第一次渲染，
	执行componentWillMount方法．
	if (!component.base || mountAll) {
		if (component.componentWillMount) component.componentWillMount();
	}
	// 否则是更新组件的操作，执行componentWillReceiveProps
	else if (component.componentWillReceiveProps) {
		component.componentWillReceiveProps(props, context);
	}
	
	<!-- 更新component的context属性 -->
	if (context && context!==component.context) {
		if (!component.prevContext) component.prevContext = component.context;
		component.context = context;
	}
	
	<!-- 更新component的props属性 -->
	if (!component.prevProps) component.prevProps = component.props;
	component.props = props;

	component._disable = false;

	<!-- 执行渲染挂载的逻辑 -->
	
	if (opts!==NO_RENDER) {
		if (opts===SYNC_RENDER || options.syncComponentUpdates!==false || !component.base) {
			<!-- 同步渲染 -->
			renderComponent(component, SYNC_RENDER, mountAll);
		}
		else {
			<!-- 异步队列渲染 -->
			enqueueRender(component);
		}
	}

	<!-- 将component实例作为参数执行ref函数，
	preact中ref参数只接受函数 -->
	if (component.__ref) component.__ref(component);
}

```
#### 所谓的enqueueRender（异步队列渲染）

在组件初始化的时候，组件是_dirty默认是true,
在组件渲染之后（renderComponent之后）,_dirty变为false,
即组件在次更新的时候，就会异步渲染．

用Promise.resolve().then(rerender)来将渲染逻辑放在js线程的末尾
执行，并且更新组件的时候队列中只能存在一个组件．


```js
let items = [];

export function enqueueRender(component) {
	if (!component._dirty && (component._dirty = true) && items.push(component)==1) {
		(options.debounceRendering || defer)(rerender);
	}
}

export function rerender() {
	let p, list = items;
	items = [];
	while ( (p = list.pop()) ) {
		if (p._dirty) renderComponent(p);
	}
}
```



### renderComponent

负责渲染组件的逻辑处理(调用diff方法),　并负责执行
__componentDidMount, shouldComponentUpdate, componentWillUpdate, componentDidUpdate__生命周期方法．


```js

<!-- 如果不是强制更新，首先应该检查shouldComponentUpdate钩子，
如果返回了false, 则跳过此次更新，　否则按流程执行componentWillUpdate钩子，然后更新组件　-->
if (isUpdate) {
	component.props = previousProps;
	component.state = previousState;
	component.context = previousContext;
	if (opts!==FORCE_RENDER
		&& component.shouldComponentUpdate
		&& component.shouldComponentUpdate(props, state, context) === false) {
		skip = true;
	}
	else if (component.componentWillUpdate) {
		component.componentWillUpdate(props, state, context);
	}
	component.props = props;
	component.state = state;
	component.context = context;

	<!-- 更新之后将之前的垃圾属性进行回收 -->
	component.prevProps = component.prevState = component.prevContext = component.nextBase = null;
}

```


```js
export function renderComponent(component, opts, mountAll, isChild) {

	component.prevProps = component.prevState = component.prevContext = component.nextBase = null;
	component._dirty = false;

	// 如果正在更新中.并且不是强制的更新, 并且shouldComponentUpdate不允许更新.则跳过本次更新
	// 否则进行更新
	if (!skip) {

		// 返回需要被渲染的vNode
		rendered = component.render(props, state, context);

		// 如果定义了context,　需要将其与之间的context结合之后传入子节点
		if (component.getChildContext) {
			context = extend(extend({}, context), component.getChildContext());
		}


		let childComponent = rendered && rendered.nodeName,
			toUnmount, base;
		console.log(rendered)
		// 如果render函数返回的顶层组件为自定义的组件
		if (typeof childComponent==='function') {
			// set up high order component link

			let childProps = getNodeProps(rendered);
			inst = initialChildComponent;

			// 如果组件实例存在，且两次key相同，则为更新组件
			if (inst && inst.constructor===childComponent && childProps.key==inst.__key) {
				setComponentProps(inst, childProps, SYNC_RENDER, context, false);
			}
			// 否则直接递归创建新的子组件，然后又走流程，只到碰到原生组件为止
			else {
				toUnmount = inst;

				component._component = inst = createComponent(childComponent, childProps, context);
				inst.nextBase = inst.nextBase || nextBase;
				inst._parentComponent = component;
				setComponentProps(inst, childProps, NO_RENDER, context, false);
				renderComponent(inst, SYNC_RENDER, mountAll, true);
			}
			// 递归渲染实际上是最底层的组件最先渲染.
			// 之后，顶层组件能够拿到渲染之后的dom节点．
			base = inst.base;
		}
		// 如果为原生组件（div, span, p...）
		else {
			cbase = initialBase;
			if(cbase) console.log(cbase.innerHTML)
			// destroy high order component link
			toUnmount = initialChildComponent;
			console.log(initialChildComponent)
			if (toUnmount) {
				cbase = component._component = null;
			}

			// 如果已经渲染过了，将渲染的dom节点传入diff算法中，
			// 经过diff算法的计算，从而经过最小的替换得到新的dom节点
			if (initialBase || opts===SYNC_RENDER) {
				if (cbase) cbase._component = null;
				base = diff(cbase, rendered, context, mountAll || !isUpdate, initialBase && initialBase.parentNode, true);
			}
			console.log(base.innerHTML)
			console.log(base　=== cbase)
		}

		// 如果发现计算后的Dom节点和初始节点不是同一个引用
		// 并且组件的实例和初始的组件不是同一个对象，
		// 则直接将这个节点用新的节点完全替换掉，

		if (initialBase && base!==initialBase && inst!==initialChildComponent) {
			let baseParent = initialBase.parentNode;
			if (baseParent && base!==baseParent) {
				baseParent.replaceChild(base, initialBase);
				// 然后将老的节点进行回收
				if (!toUnmount) {
					initialBase._component = null;
					recollectNodeTree(initialBase, false);
				}
			}
		}

		if (toUnmount) {
			unmountComponent(toUnmount);
		}
		// 将dom对象挂在component实例上
		component.base = base;
		if (base && !isChild) {
			let componentRef = component,
				t = component;
			while ((t=t._parentComponent)) {
				(componentRef = t).base = base;
			}
			// 将组件实例挂在dom对象中．形成dom对象与组件实例的一对一关系
			base._component = componentRef;
			base._componentConstructor = componentRef.constructor;
		}
	}

	// 如果是新增的组件，加入mounts数组中
	if (!isUpdate || mountAll) {
		mounts.unshift(component);
	}
	else if (!skip) {
		// 执行componentDidMount()函数
		flushMounts();

		// 执行componentDidUpdate()函数
		if (component.componentDidUpdate) {
			component.componentDidUpdate(previousProps, previousState, previousContext);
		}
		if (options.afterUpdate) options.afterUpdate(component);
	}

	// 执行最后的更新完成的回调函数
	if (component._renderCallbacks!=null) {
		while (component._renderCallbacks.length) component._renderCallbacks.pop().call(component);
	}

	if (!diffLevel && !isChild) flushMounts();
}
```

### unmountComponent

负责执行组件的卸载逻辑．执行__unmountComponent__生命周期方法．


## Render (Diff)


Render函数作为整个库的入口,这里将通过一个大的vnode对象来构建整个真实的dom树, 并管理相应的组件,
是viewModel的入口.

这里render() 接受第三个参数，这是会被替换的根节点，否则，如果没有这个参数，Preact 默认追加。

```js
<!-- render -->
export function render(vnode, parent, merge) {
	return diff(merge, vnode, {}, false, parent, false);
}
<!-- diff -->
export function diff(dom, vnode, context, mountAll, parent, componentRoot) {}
```

如果元素之间进行完全的一个比较，即新旧Element对象的父元素，本身，子元素之间进行一个混杂的比较，其实现的时间复杂度为O(n^3)。

所以这里做一个同级元素之间的一个比较，则其时间复杂度则为O(n)。


```js
export function diff(dom, vnode, context, mountAll, parent, componentRoot) {
	// 因为diff是一个递归的算法,在进行vdom树的比较时,
	// 会反复的调用diff函数.
	// diffLevel用来作为全局diff是否完成的标识,
	if (!diffLevel++) {
		// 当第一次进入diff函数的时候,判断是否在进行svg元素的diff
		isSvgMode = parent!=null && parent.ownerSVGElement!==undefined;

		// 标识老的dom元素没有props缓存,
		hydrating = dom!=null && !(ATTR_KEY in dom);
	}

	// 将老的dom元素与新的vnode节点树进行递归的diff运算,得到新的dom节点
	let ret = idiff(dom, vnode, context, mountAll, componentRoot);

	// 将新的dom节点插入文档
	if (parent && ret.parentNode!==parent) {
		parent.appendChild(ret);
	}

	// diffLevel being reduced to 0 means we're exiting the diff
	if (!--diffLevel) {
		hydrating = false;
		// 完成diff运算后,触发组件的componentDidMounted生命周期
		if (!componentRoot) flushMounts();
	}

	return ret;
}
```


diff算法的内部实现,值得注意的是这里的dom和vnode
永远是属于同一级的比较,这大大的降低了diff算法的复杂度.


diff算法的详细实现:

```js
function idiff(dom, vnode, context, mountAll, componentRoot) {
	let out = dom,
		prevSvgMode = isSvgMode;


	/*
		在这里，我们做同级元素比较时，可能会出现四种情况
		- 整个元素都不一样，即元素被replace掉
		- 元素的attrs不一样
		- 元素的text文本不一样
		- 元素顺序被替换，即元素需要reorder
	*/


	// 将null或者undefined或者boolean值元素统统当作空字符串渲染
	if (vnode==null || typeof vnode==='boolean') vnode = '';

	// - 元素的text文本不一样,或者整个元素都不一样 =>

	// 在前面的h函数中,如果jsx中的文本的子节点是文本节点,
	// 那么vnode的子节点就会被渲染成字符串或者数字
	// 所以如果vnode为字符串或者数字,表明该节点是一个文本节点.
	if (typeof vnode==='string' || typeof vnode==='number') {
		// 表明老的节点是文本节点,
		// 则直接进行nodeValue赋值,更新该文本节点
		if (dom && dom.splitText!==undefined && dom.parentNode && (!dom._component || componentRoot)) {
			if (dom.nodeValue!=vnode) {
				dom.nodeValue = vnode;
			}
		}
		else {
			// 如果老的节点不是文本节点,
			// 则需要新创建一个文本节点,将老的节点进行替换.
			out = document.createTextNode(vnode);
			if (dom) {
				if (dom.parentNode) dom.parentNode.replaceChild(out, dom);
				// 回收老的节点.
				recollectNodeTree(dom, true);
			}
		}

		// 更因为文本节点不能有attributes属性值
		// 这里直接更新到内部的props属性为true,
		out[ATTR_KEY] = true;

		return out;
	}


	// 如果不是上诉的值,则vnode是一个对象,
	// 则分为两种情况:
	// 1. vnode是一个自定义的组件,这时nodeName为该组件的构造函数
	// 2. vnode为普通的原生dom组件, 这是nodeName为字符串(组件的标签名)
	// 具体的实现可以参考hyperScript函数.


	// 当vnode为一个自定义组件的时候,
	// 意味着它拥有一系列的声明周期,
	// 此时需要从Vnode中构造Component, 并执行相应的生命周期方法.
	// 最后返回从组件的render函数中的jsx中得到的真实dom节点.
	let vnodeName = vnode.nodeName;
	if (typeof vnodeName==='function') {
		return buildComponentFromVNode(dom, vnode, context, mountAll);
	}


	// 根据vnodename来判断是否是svg模式
	isSvgMode = vnodeName==='svg' ? true : vnodeName==='foreignObject' ? false : isSvgMode;


	//  =>
	//  下面是vnode节点为普通的dom标签的情况:
	
	// 整个元素都不一样，即元素被replace掉 => 
	/*
		判断老的dom节点标签名字和新的vnode节点名是否一致,
		如果不一致或者老的dom不存在,
		则简单粗暴的直接重新创建一个新的dom节点.
		不再进行任何同节点的比较
	 */
	vnodeName = String(vnodeName);
	if (!dom || !isNamedNode(dom, vnodeName)) {
		out = createNode(vnodeName, isSvgMode);

		// 如果dom节点存在,说明节点名不一致,
		// 将老的节点的字节点复制到新的节点下
		if (dom) {
			while (dom.firstChild) {
				out.appendChild(dom.firstChild);
			}

			// 用新的节点替换掉老的节点.
			if (dom.parentNode) dom.parentNode.replaceChild(out, dom);

			// 回收老的节点
			recollectNodeTree(dom, true);
		}
	}

	let fc = out.firstChild,
		props = out[ATTR_KEY],
		vchildren = vnode.children;

	// 如果是新创建的节点(没有ATTR_KEY标识)
	// 将节点的props复制到ATTR_KEY属性中．
	if (props==null) {
		props = out[ATTR_KEY] = {};
		for (let a=out.attributes, i=a.length; i--; ) props[a[i].name] = a[i].value;
	}

	// 简单针对纯文本变化的小优化(实际中也是非常多的一种情况):
	// 如果子节点只有一个文本节点,并且老的dom节点也是文本节点,
	// 此时说明只有文字的变化, 简单的重新复制nodeValue即可.
	if (!hydrating && vchildren && vchildren.length===1 && typeof vchildren[0]==='string' && fc!=null && fc.splitText!==undefined && fc.nextSibling==null) {
		if (fc.nodeValue!=vchildren[0]) {
			fc.nodeValue = vchildren[0];
		}
	}

	// 否则如果存在多个子元素,
	// 将子元素进行递归的比较(最终会进行idiff比较)
	// 直到没有vnode没有子节点为止
	else if (vchildren && vchildren.length || fc!=null) {
		innerDiffNode(out, vchildren, context, mountAll, hydrating || props.dangerouslySetInnerHTML!=null);
	}


	// 自身元素的attrs不一样 => 
	// 将vnode中的attributes或者事件应用到新的dom元素上.
	diffAttributes(out, vnode.attributes, props);

	// restore previous SVG mode: (in case we're exiting an SVG namespace)
	isSvgMode = prevSvgMode;

	return out;
}
```

> 如何对子元素进行比较,key值的比较 :

```js

/** 对一个元素的子元素进行比较,
主要是由于key的存在,所以要做一些特殊处理,
不然完全直接递归idiff即可
 */
function innerDiffNode(dom, vchildren, context, mountAll, isHydrating) {
	let originalChildren = dom.childNodes,
		children = [],
		keyed = {},
		keyedLen = 0,
		min = 0,
		len = originalChildren.length,
		childrenLen = 0,
		vlen = vchildren ? vchildren.length : 0,
		j, c, f, vchild, child;

	// 如果老的dom节点存在子节点,
	// 则遍历子节点,
	// 将其中带有key值的节点存入keyd对象中,
	// 否则按顺序存入children数组中.
	if (len!==0) {
		for (let i=0; i<len; i++) {
			let child = originalChildren[i],
				props = child[ATTR_KEY],
				key = vlen && props ? (child._component ? child._component.__key : props.key) : null;
			if (key!=null) {
				keyedLen++;
				keyed[key] = child;
			}
			else if (props || (child.splitText!==undefined ? (isHydrating ? child.nodeValue.trim() : true) : isHydrating)) {
				children[childrenLen++] = child;
			}
		}
	}

	// 如果新的vnode中存在子节点
	if (vlen!==0) {

		// 遍历字节点, 在keyed对象中相同key的节点,
		// 或者循环childrenLen,找到原节点中类型相同或者构造函数相同的节点,
		// 从而最大程度的复用原节点.
		for (let i=0; i<vlen; i++) {
			vchild = vchildren[i];
			child = null;
			// attempt to find a node based on key matching
			let key = vchild.key;
			if (key!=null) {
				if (keyedLen && keyed[key]!==undefined) {
					child = keyed[key];
					keyed[key] = undefined;
					keyedLen--;
				}
			}
			// attempt to pluck a node of the same type from the existing children
			else if (!child && min<childrenLen) {
				for (j=min; j<childrenLen; j++) {
					if (children[j]!==undefined && isSameNodeType(c = children[j], vchild, isHydrating)) {
						child = c;
						children[j] = undefined;
						if (j===childrenLen-1) childrenLen--;
						if (j===min) min++;
						break;
					}
				}
			}

			// 将找到的原节点其赋值给child变量然后交给idiff做比较,
			// 生成diff之后新的child节点.
			child = idiff(child, vchild, context, mountAll);


			f = originalChildren[i];
			if (child && child!==dom && child!==f) {
				console.log(originalChildren)

				// 如果原节点为空，或者是原节点被丢弃,
				// 直接生成的新的节点,没有子节点
				// 那么直接插入新的child节点
				if (f==null) {
					console.log(f, child)
					dom.appendChild(child);
				}
				//
				else if (child===f.nextSibling) {
					console.log(f, child)
					removeNode(f);
				}
				// 将新的child节点插入原节点的前面.
				else {
					console.log(f, child)
					dom.insertBefore(child, f);
				}
			}
		}
	}


	// 将没在vnode中对应的元素(也就是被丢弃的节点)从dom文档中移除并回收.
	if (keyedLen) {
		for (let i in keyed) if (keyed[i]!==undefined) recollectNodeTree(keyed[i], false);
	}

	while (min<=childrenLen) {
		if ((child = children[childrenLen--])!==undefined) {
			recollectNodeTree(child, false);
		}
	}
}
```

### 节点属性的diff : 

```js
function diffAttributes(dom, attrs, old) {
	let name;

	// 将新元素中不存在的, 但是老的dom元素中存在的全部置空
	for (name in old) {
		if (!(attrs && attrs[name]!=null) && old[name]!=null) {
			setAccessor(dom, name, old[name], old[name] = undefined, isSvgMode);
		}
	}

	// 新增和更新属性.
	for (name in attrs) {
		if (name!=='children' && name!=='innerHTML' && (!(name in old) || attrs[name]!==(name==='value' || name==='checked' ? dom[name] : old[name]))) {
			setAccessor(dom, name, old[name], old[name] = attrs[name], isSvgMode);
		}
	}
}

###　节点属性props设置：

#### ref属性: 销毁老的dom对象，将新的dom对象传入ref函数

```js
if (name==='ref') {
	if (old) old(null);
	if (value) value(node);
}
```

#### style样式：
如果是字符串，通过cssText的方式来设置：

如果是对象，则遍历对象，依次设置：

```js
node.style.cssText = value || '';

// 为必要的单位样式，添加px
for (let i in value) {
	node.style[i] = typeof value[i]==='number' && IS_NON_DIMENSIONAL.test(i)===false ? (value[i]+'px') : value[i];
}
```
#### 事件

规定所有的事件需要以`on + 事件名`开头：

这里需要将所有的事件进行代理，并且绑定到dom对象的_listener中对象的eventName属性中，方便事件解除绑定的时候能够找到对应的事件监听器．

```js
if (name[0]=='o' && name[1]=='n') {
	let useCapture = name !== (name=name.replace(/Capture$/, ''));
	name = name.toLowerCase().substring(2);
	if (value) {
		if (!old) node.addEventListener(name, eventProxy, useCapture);
	}
	else {
		node.removeEventListener(name, eventProxy, useCapture);
	}
	(node._listeners || (node._listeners = {}))[name] = value;
}
```

#### 自定义属性

`node[name] = value;`


#### 自有属性

`node.setAttribute(name, value);`

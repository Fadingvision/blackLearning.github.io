## Preact

### Component

1. 执行setState, forceUpdate =>  render函数

#### setState

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


2. 管理生命周期的执行顺序


3. 管理context, props, state.



code Modules:


## h()

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


## Render (Diff)

```js
<!-- render -->
export function render(vnode, parent, merge) {
	return diff(merge, vnode, {}, false, parent, false);
}
<!-- diff -->
export function diff(dom, vnode, context, mountAll, parent, componentRoot) {}
```


在分解diff算法之前，我们通过是如何通过将vnode虚拟节点转化为自定义组件的真实dom，并且管理相应的组件的生命周期的．
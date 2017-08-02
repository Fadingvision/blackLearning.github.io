1. 确保传递给子组件的方法都正确的绑定了this指向，不要在render函数里面绑定this指向。
2. 确定组件卸载之前销毁所有的自定义事件绑定和定时器以及正在pending 的http请求。
3. 避免在`componentWillMount`中进行异步的state初始化，在componentDidMount中去发起http请求。
5. 使用key来帮助react进行身份一致的验证，确保子组件能够在更新中被保留而不是重新创建，使用index作为key是一种反模式。

5.　组件的划分，

	* 区分木偶组件和smart component, 木偶组件通常不含有自身的状态与展现有关，无状态组件尽量写成纯函数式组件，智能组件通常有
	自己的状态，生命周期，这样划分的优点是它们封装逻辑和可以将数据注入不同的render.

6. 组件方法组织

* class definition
  * constructor
    * event handlers
  * 'component' lifecycle events
  * getters
  * render
* defaultProps
* proptypes

7.　组件中state的纯净问题

http://reactkungfu.com/2015/09/common-react-dot-js-mistakes-unneeded-state/

setState仅仅应该用在影响一些会render的东西，而且不能由props计算得到的东西。

8. state的放置问题

如果你的父组件需要知道子组件的状态，那么这个状态本身即应该被父组件所持有。


* 由于一些深层次的嵌套的组件需要获取顶层组件的数据时，使用props一层一层的传递太过于繁琐，这时可以使用react提供的context, 但是由于context在react中并不推荐使用，因为context会使得组件间的数据流动不那么清晰，导致debug难度增加．因此可以使用一个context wrapper来包装context,　实现一个类redux中store的context管理容器, 为app内的所有context声明和获取context　data提供一个统一的接口.


```js
	<!-- context.js -->
	export default {
	  data: {},
	  get(key) {
	    return this.data[key];
	  },
	  register(key, value) {
	    this.data[key] = value;
	  }
	}
```

此外还可以为需要接入该context的接口提供一个高阶组件（类似于react-redux中的connect高阶组件），来统一封装一些与context交互的逻辑，避免子组件需要重复的声明contextTypes.

```js
export default function wire(Component, mapContextToProps) {
  class Inject extends React.Component {
    render() {
      let props = typeof mapContextToProps === 'function' ?
      	mapContextToProps(this.context.data) : 
      	mapContextToprops;

      return React.createElement(Component, props);
    }
  }
  Inject.contextTypes = {
    data: PropTypes.object,
    get: PropTypes.func,
    register: PropTypes.func
  };
  return Inject;
};

```


可以看到，里面的概念和逻辑已经根redux和react-redux很接近了，因此，当应用内大量需要使用context来进行组件通信的时候，你应该考虑使用redux等状态管理工具了．


* 由于性能方面的原因，react使用批量更新，因此在`setState`调用之后state并不会立即改变．
使用函数作为`setState`的参数，并且之前的prevState会作为参数传入这个函数，这会更取得更加稳定和可预测的老的state.



* 使用高阶组件来控制一些组件的逻辑（例如显示和隐藏），预处理组件的Props, 进行分支处理．

> props相关

	1. 在接收props之前修改props(mapProps)
	2. 计算出新的props之后merge之后到原props中。(withProps)
	3. 通过比较指定的props属性值是否改变，如果改变，重新计算出新的computedProps之后merge到原props中，在每次receive新的props的时候触发。(withPropsOnchange)
	4. (withHandlers)添加新的handlerCreator函数，此函数将以Props作为参数，生成一个handler函数作为props传入组件中。
	5. 为组件添加defaultProps参数。（由于是高阶组件，所以并不是在原组件上添加/覆盖defaultProps, 而是在高阶组件上添加，所以原组件的defaultProps仍然有效。）
	-- defaultProps()
	6. 删除老的属性，添加新的属性props. (renameProp)


> state相关

	1. withState -- 为一些木偶组件添加简单的state状态，并提供更新state的函数，这个状态和更新state的函数将会作为props传入木偶组件。

> context相关

	1. withContext -- 根据提供的childContextTypes, getChildContext方法，为子组件注入context.
	2. getContext -- 根据提供的contextTypes为子组件获取context.


> render相关

	1. renderComponent -- 将普通组件转为一个高阶组件，方便在必须使用高阶组件的时候使用（例如branch）
	2. renderNothing -- 始终返回null的空的高阶组件。

> lifeCycle相关

	1. shouldUpdate -- 自带shouldComponentUpdate方法的高阶组件，可以根据传入的test方法来决定是否重新渲染baseComponent.
	2. pure -- 使用shallowEqual来决定是否update. shouldUpdate的扩展版。
	3. onlyUpdateForKeys -- pure的升级版，允许根据指定的key来决定是否进行更新，同样使用shallowEqual判断。
	4. onlyUpdateForPropTypes -- pure的升级版，只会根据propTypes中的值来决定是否更新。
	5. lifeCycle -- 为高阶组件注入完整的生命周期方法，并返回这个高阶组件。
	baseComponent将会在高阶组件中渲染。


### 样式

* 将样式从依赖state的组件中（包括routes, vies, layouts, containers, forms 等等）分离出来，这这些组件通常是由小的组件组合而来，这些小的无状态的纯展示组件可以拥有自己的样式隔离．





















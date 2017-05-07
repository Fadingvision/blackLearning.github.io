## react-redux


### __API__

### Provider
Provider的实现比较简单，提供一个最顶层的组件，接受store最为props,并将其用context方法暴露给所有子组件。

```js
export default class Provider extends Component {
  getChildContext() {
    return { store: this.store, storeSubscription: null }
  }

  constructor(props, context) {
    super(props, context)
    this.store = props.store
  }

  render() {
    return Children.only(this.props.children)
  }
}

```

这意味着在你所有的子组件中，都可以通过设置contextTypes来直接取得store对象。eg:

```js
TextInput.contextTypes = {
  store: PropTypes.object,
};
```


### connect

首先是createConnnect函数，用了高阶函数，这个函数接受创建connect函数的四个参数：

- `connectHOC`: 一个内部的高阶组件函数，允许你自定义connect函数的的逻辑。

- `mapStateToPropsFactories`: 该参数默认为defaultMapStateToPropsFactories，主要用来处理mapStateToProps参数传入情况的逻辑，

如果mapStateToProps参数为空，则会返回一个空对象作为props对象。

```js
export function whenMapStateToPropsIsMissing(mapStateToProps) {
  return (!mapStateToProps)
    ? wrapMapToPropsConstant(() => ({}))
    : undefined
}
```

如果mapStateToProps不为空且为一个函数，则会检测
mapStateToProps的参数个数，如果不为一个，
则视为传入了OwnProps,

```js
export function getDependsOnOwnProps(mapToProps) {
  return (mapToProps.dependsOnOwnProps !== null && mapToProps.dependsOnOwnProps !== undefined)
    ? Boolean(mapToProps.dependsOnOwnProps)
    : mapToProps.length !== 1
}
```


```js
// 生成props.
proxy.mapToProps = function detectFactoryAndVerify(stateOrDispatch, ownProps) {
    // 代理函数一旦执行后，就会被销毁，更换为真正的用户传入mapStateToProps函数，
  proxy.mapToProps = mapToProps
  // 检测是否依赖oWnProps，并更新相应的标识
  proxy.dependsOnOwnProps = getDependsOnOwnProps(mapToProps)
  // 再次执行proxy，计算props.
  let props = proxy(stateOrDispatch, ownProps)

  // 在高级场景需要更多控制渲染性能,mapStateToProps()也可以返回一个函数。在这种情况下,该函数将被用作mapStateToProps()为一个特定的组件实例。
  if (typeof props === 'function') {
    proxy.mapToProps = props
    proxy.dependsOnOwnProps = getDependsOnOwnProps(props)
    props = proxy(stateOrDispatch, ownProps)
  }
  // 生产环境下验证返回的props是否为纯对象。
  if (process.env.NODE_ENV !== 'production')
    verifyPlainObject(props, displayName, methodName)

  return props
}
```

这里为mapToProps做了一个代理，执行后，


- `mapDispatchToPropsFactories`:
- `mergePropsFactories`:

connect函数接受三个参数，`mapStateToProps`, `mapDispatchToProps`, `mergeProps`, 然后返回一个高阶组件。


#### mapStateToProps
如果mapStateToProps是函数会被注入两个参数，
一个store的state对象，
第二是你自己想传入的额外的props对象。
返回的必须是一个纯对象，这个对象将会被合并到高阶组件接受的组件参数的props对象中。

如果该参数为为一个假值，那么react-redux将不会为你监听store的状态变化。


#### mapDispatchToProps


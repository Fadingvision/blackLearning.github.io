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


### createConnnect

createConnnect函数，用了高阶函数，这个函数接受创建connect函数的四个参数：

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
则视为传入了OwnProps.

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

- `mapDispatchToPropsFactories`:
该参数默认为defaultMapDispatchToPropsFactories，主要用来处理mapDispatchToProps参数传入情况的逻辑，


```js
// 当注入的mapDispatchToprops为函数的时候，直接使用该函数invoke的结果作为props
export function whenMapDispatchToPropsIsFunction(mapDispatchToProps) {
  return (typeof mapDispatchToProps === 'function')
    ? wrapMapToPropsFunc(mapDispatchToProps, 'mapDispatchToProps')
    : undefined
}

// 当注入的mapDispatchToprops为假值的时候，将dispatch函数作为props注入组件
export function whenMapDispatchToPropsIsMissing(mapDispatchToProps) {
  return (!mapDispatchToProps)
    ? wrapMapToPropsConstant(dispatch => ({ dispatch }))
    : undefined
}

// 当注入的mapDispatchToprops为对象的时候，将对象的值bindActionCreators之后注入props
export function whenMapDispatchToPropsIsObject(mapDispatchToProps) {
  return (mapDispatchToProps && typeof mapDispatchToProps === 'object')
    ? wrapMapToPropsConstant(dispatch => bindActionCreators(mapDispatchToProps, dispatch))
    : undefined
}

```



- `mergePropsFactories`:

该参数默认为defaultMergePropsFactories，主要用来处理mergeProps参数传入情况的逻辑，如果该参数为空，则会使用`{ ...ownProps, ...stateProps, ...dispatchProps }`的逻辑，。

如果该参数为一个函数，则会返回该函数执行之后返回的纯对象作为最终的props传入组件。


------------


### __connectAdvanced__ (connectHOC)

connectAdvanced函数作为connect内部实际执行的方法，用于返回一个高阶函数，该函数接受一个WrappedComponent参数返回一个高阶组件。


connectAdvanced函数接受两个参数。

1. selectorFactory:

该函数用来负责返回一个选择器函数，被返回的函数用来从props, state, dispatch中计算新的props，这个函数将会在每次store改变的时候，或者接受新的props的时候都会被执行，用来计算新的props.



> 如果给定connect的option的pure参数为false, 则会每次都强制计算出新的props.

```js
export function impureFinalPropsSelectorFactory(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
  dispatch
) {
  return function impureFinalPropsSelector(state, ownProps) {
    return mergeProps(
      mapStateToProps(state, ownProps),
      mapDispatchToProps(dispatch, ownProps),
      ownProps
    )
  }
}
```


> 如果给定connect的option的pure参数为true,则将新的nextState, nextOwnProps
与原来的进行对比，只更新必要的props.

```js
function handleSubsequentCalls(nextState, nextOwnProps) {
  const propsChanged = !areOwnPropsEqual(nextOwnProps, ownProps)
  const stateChanged = !areStatesEqual(nextState, state)
  state = nextState
  ownProps = nextOwnProps

  if (propsChanged && stateChanged) return handleNewPropsAndNewState()
  if (propsChanged) return handleNewProps()
  if (stateChanged) return handleNewState()
  return mergedProps
}
```


2.　connectOptions




### Class Connect

首先这个组件需要通过context接受的由Provider提供的redux的store对象,用来获取最新的
state对象，和对state对象进行监听。


新建一个seletor对象，上面挂着一个run函数，保证每次执行run函数的时候，都能够从store拿到最新的state状态，并通过sourceSlector计算出最终的新的props对象，并与老的对象进行对比，由此确定该组件是否应该重新渲染。


```js

initSelector() {
  const sourceSelector = selectorFactory(this.store.dispatch, selectorFactoryOptions)
  // 计算出selector对象。
  this.selector = makeSelectorStateful(sourceSelector, this.store)
  // 得到props对象，
  this.selector.run(this.props)
}

function makeSelectorStateful(sourceSelector, store) {
  // wrap the selector in an object that tracks its results between runs.
  const selector = {
    run: function runComponentSelector(props) {
      try {
        const nextProps = sourceSelector(store.getState(), props)
        if (nextProps !== selector.props || selector.error) {
          selector.shouldComponentUpdate = true
          selector.props = nextProps
          selector.error = null
        }
      } catch (error) {
        selector.shouldComponentUpdate = true
        selector.error = error
      }
    }
  }

  return selector
}

```


#### 监听state对象：

每次State对象变化的时候，都会执行this.selector.run来更新props,
如果检测到需要重新渲染组件，则执行一次setState方法，来进行组件的重新渲染。

```js
initSubscription() {
  if (!shouldHandleStateChanges) return

  // parentSub's source should match where store came from: props vs. context. A component
  // connected to the store via props shouldn't use subscription from context, or vice versa.
  const parentSub = (this.propsMode ? this.props : this.context)[subscriptionKey]
  this.subscription = new Subscription(this.store, parentSub, this.onStateChange.bind(this))

  // `notifyNestedSubs` is duplicated to handle the case where the component is  unmounted in
  // the middle of the notification loop, where `this.subscription` will then be null. An
  // extra null check every change can be avoided by copying the method onto `this` and then
  // replacing it with a no-op on unmount. This can probably be avoided if Subscription's
  // listeners logic is changed to not call listeners that have been unsubscribed in the
  // middle of the notification loop.
  this.notifyNestedSubs = this.subscription.notifyNestedSubs.bind(this.subscription)
}

onStateChange() {
  this.selector.run(this.props)

  if (!this.selector.shouldComponentUpdate) {
    this.notifyNestedSubs()
  } else {
    this.componentDidUpdate = this.notifyNestedSubsOnComponentDidUpdate
    this.setState(dummyState)
  }
}
```



```javascript
Connect.childContextTypes = {
  storeSubscription: subscriptionShape
}
Connect.contextTypes = {
  store: storeShape,
  storeSubscription: subscriptionShape,
}
Connect.propTypes = {
  store: storeShape,
  storeSubscription: subscriptionShape,
}
```

组件定义：

```javascript
class Connect extends Component {
  constructor(props, context) {

    super(props, context)

    this.version = version
    this.state = {}
    this.renderCount = 0
    this.store = props[storeKey] || context[storeKey]
    this.propsMode = Boolean(props[storeKey])
    this.setWrappedInstance = this.setWrappedInstance.bind(this)

    invariant(this.store,
      `Could not find "${storeKey}" in either the context or props of ` +
      `"${displayName}". Either wrap the root component in a <Provider>, ` +
      `or explicitly pass "${storeKey}" as a prop to "${displayName}".`
    )

    this.initSelector()
    this.initSubscription()
  }

  getChildContext() {
    // If this component received store from props, its subscription should be transparent
    // to any descendants receiving store+subscription from context; it passes along
    // subscription passed to it. Otherwise, it shadows the parent subscription, which allows
    // Connect to control ordering of notifications to flow top-down.
    const subscription = this.propsMode ? null : this.subscription
    return { [subscriptionKey]: subscription || this.context[subscriptionKey] }
  }

  componentDidMount() {
    if (!shouldHandleStateChanges) return

    // componentWillMount fires during server side rendering, but componentDidMount and
    // componentWillUnmount do not. Because of this, trySubscribe happens during ...didMount.
    // Otherwise, unsubscription would never take place during SSR, causing a memory leak.
    // To handle the case where a child component may have triggered a state change by
    // dispatching an action in its componentWillMount, we have to re-run the select and maybe
    // re-render.
    this.subscription.trySubscribe()
    this.selector.run(this.props)
    if (this.selector.shouldComponentUpdate) this.forceUpdate()
  }

  componentWillReceiveProps(nextProps) {
    this.selector.run(nextProps)
  }

  shouldComponentUpdate() {
    return this.selector.shouldComponentUpdate
  }

  componentWillUnmount() {
    if (this.subscription) this.subscription.tryUnsubscribe()
    this.subscription = null
    this.notifyNestedSubs = noop
    this.store = null
    this.selector.run = noop
    this.selector.shouldComponentUpdate = false
  }

  getWrappedInstance() {
    invariant(withRef,
      `To access the wrapped instance, you need to specify ` +
      `{ withRef: true } in the options argument of the ${methodName}() call.`
    )
    return this.wrappedInstance
  }

  setWrappedInstance(ref) {
    this.wrappedInstance = ref
  }

  initSelector() {
    const sourceSelector = selectorFactory(this.store.dispatch, selectorFactoryOptions)
    this.selector = makeSelectorStateful(sourceSelector, this.store)
    this.selector.run(this.props)
  }

  initSubscription() {
    if (!shouldHandleStateChanges) return

    // parentSub's source should match where store came from: props vs. context. A component
    // connected to the store via props shouldn't use subscription from context, or vice versa.
    const parentSub = (this.propsMode ? this.props : this.context)[subscriptionKey]
    this.subscription = new Subscription(this.store, parentSub, this.onStateChange.bind(this))

    // `notifyNestedSubs` is duplicated to handle the case where the component is  unmounted in
    // the middle of the notification loop, where `this.subscription` will then be null. An
    // extra null check every change can be avoided by copying the method onto `this` and then
    // replacing it with a no-op on unmount. This can probably be avoided if Subscription's
    // listeners logic is changed to not call listeners that have been unsubscribed in the
    // middle of the notification loop.
    this.notifyNestedSubs = this.subscription.notifyNestedSubs.bind(this.subscription)
  }

  onStateChange() {
    this.selector.run(this.props)

    if (!this.selector.shouldComponentUpdate) {
      this.notifyNestedSubs()
    } else {
      this.componentDidUpdate = this.notifyNestedSubsOnComponentDidUpdate
      this.setState(dummyState)
    }
  }

  notifyNestedSubsOnComponentDidUpdate() {
    // `componentDidUpdate` is conditionally implemented when `onStateChange` determines it
    // needs to notify nested subs. Once called, it unimplements itself until further state
    // changes occur. Doing it this way vs having a permanent `componentDidMount` that does
    // a boolean check every time avoids an extra method call most of the time, resulting
    // in some perf boost.
    this.componentDidUpdate = undefined
    this.notifyNestedSubs()
  }

  isSubscribed() {
    return Boolean(this.subscription) && this.subscription.isSubscribed()
  }

  addExtraProps(props) {
    if (!withRef && !renderCountProp && !(this.propsMode && this.subscription)) return props
    // make a shallow copy so that fields added don't leak to the original selector.
    // this is especially important for 'ref' since that's a reference back to the component
    // instance. a singleton memoized selector would then be holding a reference to the
    // instance, preventing the instance from being garbage collected, and that would be bad
    const withExtras = { ...props }
    if (withRef) withExtras.ref = this.setWrappedInstance
    if (renderCountProp) withExtras[renderCountProp] = this.renderCount++
    if (this.propsMode && this.subscription) withExtras[subscriptionKey] = this.subscription
    return withExtras
  }

  render() {
    const selector = this.selector
    selector.shouldComponentUpdate = false

    if (selector.error) {
      throw selector.error
    } else {
      return createElement(WrappedComponent, this.addExtraProps(selector.props))
    }
  }
}
```

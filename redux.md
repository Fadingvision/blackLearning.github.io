# redux 源码学习

### 单向数据流



### 代码组织

整个项目很简单,被分为了几个小模块.

- compose 提供一个辅助方法
- bindActionCreators
- combineReducers
- createStore
- applyMiddleware

### compose
一个提供函数组合的方法,用于将多个函数运行的结果进行组合调用,是函数式编程中常用的方法之一,
用于将一个大的函数拆分成很多小的纯函数,从而减少函数的复杂度.

```js
funcs.reduce((a, b) => (...args) => a(b(...args)))
```

### bindActionCreators模块

>在redux中,action被描述为一个plainObject(纯对象).
在action标准中,action通常含有一个type属性以及一个payload属性,
type属性通常是用于表明该action的类型以及意义.
payload属性中可以用于向reducer传递一些其他参数.
actionCreator: 顾名思义,一个纯函数用于接受对应的参数,来生成一个对应的action.

此模块提供一个绑定actionCreators的方法.
所谓bindActionCreators是一个典型的高阶函数,接受两个参数(actionCreators和dispatch):

用法:
```js
const store = createStore(reducer)
const convenienceDispatch = bindActionCreator(addTodo, store.dispatch)

convenienceDispatch({id: 1, text: something})
```

源码:
```js
// 可以看到这里用到了函数组合和柯里化,这也是函数式编程中最常用的两种技巧.
function bindActionCreator(actionCreator, dispatch) {
  return (...args) => dispatch(actionCreator(...args))
}
```

#### actionCreators
该参数可以为一个单独的函数,
则返回的也是一个函数,
调用返回的函数,
则可以分发(dispatch)这个actionCreator产出的action对象到reducer.

```js
// 一个普通的actionCreator
export const addTodo = (text) => ({
  type: 'ADD_TODO',
  payload: {
  	id: nextTodoId++,
  	text
  }
})
```

也可以接收一个对象actionCreators.

```js
const addTodo = (content) => ({
  type: ADD_TODO,
  payload: {
    id: setTimeout(() => {}), // 生成唯一 ID 的一种方式
    content,
    completed: false,
    createdAt: Date.now()
  }
})

const toggleTodo = (todoId) => ({
  type: TOGGLE_TODO,
  payload: todoId
})

const delTodo = (todoId) => ({
  type: DEL_TODO,
  payload: todoId
})

// 一个常见的actionCreators
export default {
  addTodo, toggleTodo, delTodo
}
```
bindActionCreators会遍历这个actionCreators对象,返回一个对象,键和原对象相同,
值为一个用于分发相应action的函数.

```js
{
	addTodo: (...args) => dispatch(addTodo(...args)),
	toggleTodo: (...args) => dispatch(toggleTodo(...args)),
	delTodo: (...args) => dispatch(delTodo(...args)),
}
```


#### dispatch
该函数通常是挂在store对象中的一个方法,用于分发action.

因此bindActionCreator是一个语法糖,让你可以生成一个被store.dispatch包裹的函数,
实际上也可以这样调用

store.dispatch(addTodo(param));



### combineReducers模块

redux中的reducer一个纯函数的概念,通常由用户自定义,它接受一个初始对象(state),和一个action对象,

并根据action对象的不同,并且在此基础上生成一个新的(通常是对原始对象进行浅复制)对象,从而对初始状态进行修改,并返回这个新的状态对象.

!! 注意
如果没有找到对应的action,一定保证默认的state对象被返回.
如果没有指定默认状态,就应该使用初始状态initialState, initalState

```js
常见的reducer:
const todoReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TODO':
      return {
        id: action.id,
        text: action.text,
        completed: false
      }
    case 'TOGGLE_TODO':
      if (state.id !== action.id) {
        return state
      }

      return {
        ...state,
        completed: !state.completed
      }
    default:
      return state  // 如果没有找到对应的action,一定保证默认的state对象被返回.
  }
}
```

在redux中,state对象通常一个大的单一状态,为了方便状态管理,
通常利用拆分reducer的方法来拆分state,将一个大的状态拆分到各个reducer中进行管理,简化业务逻辑.

combineReducer方法可以将各个小的reducer合并为一个大的对象.

```js
// 相当于:
function combineReducer(state = initState, action) {
	// 注意：这儿实际上就是返回由各个拆分后的reducer重新生成的新的对象组成的整个state对象．
	// 而且大部份的子 reducer 只是使用 switch 语句，并且针对大部分 action 返回的都是默认的 state。
	// 以不可变的方式更新 state意味着浅拷贝，而非深拷贝。相比于深拷贝，浅拷贝更快，
	// 因为只需复制很少的字段和对象，实际的底层实现中也只是移动了若干指针而已。
	// 因此，你需要创建一个副本，并且更新受影响的各个嵌套的对象层级即可。
	return {
		router: routerReducer(state.router, action),
		userData: userReducer(state.userData, action),
		todos: todoReducer(state.todos, action) // 各个拆分后的reducer
	}
}
```

因此,如果你的reducer足够简单,可以不用combineReducers,
直接使用__const store = createStore(reducer<!-- function -->__来生成store对象.

源码:

```js
return function combination(state = {}, action) {
  if (sanityError) {
    throw sanityError
  }

  if (NODE_ENV !== 'production') {
    const warningMessage = getUnexpectedStateShapeWarningMessage(state, finalReducers, action, unexpectedKeyCache)
    if (warningMessage) {
      warning(warningMessage)
    }
  }

  let hasChanged = false
  const nextState = {}
  for (let i = 0; i < finalReducerKeys.length; i++) {
    const key = finalReducerKeys[i]
    const reducer = finalReducers[key]
    const previousStateForKey = state[key]
    const nextStateForKey = reducer(previousStateForKey, action)
    if (typeof nextStateForKey === 'undefined') {
      const errorMessage = getUndefinedStateErrorMessage(key, action)
      throw new Error(errorMessage)
    }
    nextState[key] = nextStateForKey
    hasChanged = hasChanged || nextStateForKey !== previousStateForKey
  }
  return hasChanged ? nextState : state
}
```

combineReducer同样是一个高阶函数,返回的是一个可以产生新的state的combianation函数.
将拆分后的reducers对象作为参数传入后,
遍历所有的reducer,并把上一个状态和对应的action传入该reducer计算出下一个state,
这里进行浅对比,如果前一个状态和后一个状态完全相等,就直接返回之前的状态作为新的状态.
因此在reducer函数中,如果操作的state为引用类型,则改变state之后,应该返回一个新的引用,否则将不会生成新的state树.


注意:

redux会使用一个保留的actionType(`@@redux/INIT`)来dispatch, 从而得到初始化的默认state树，
在执行combineReducers的时候，如果判断到返回的initialState为undefined,则会报错，
因此在编写reducer函数时，
如果当前没有传入state,应该使用初始的默认state，
对于任何没有匹配到的action，都应该使用默认state返回．


### createStore模块

该模块是redux的核心模块，

  
createStore接受三个参数，
一个reducer函数（并通过dispatch({ type: ActionTypes.INIT })来初始化默认的初始state）

一个preloadedState,用来进行服务端和客户端同构state对象，实现state的同步．
一个enhancer　用来对store对象进行增加，实现一些第三方功能，如打印action,时间旅行等效果．


- dispatch,
- subscribe,
- getState,
- replaceReducer,
- [$$observable]: observable

#### getState

该方法用于获取当前的state状态树．

```js
/**
 * Reads the state tree managed by the store.
 *
 * @returns {any} The current state tree of your application.
 */
function getState() {
  return currentState
}
```

#### subscribe

```js
let isSubscribed = true

ensureCanMutateNextListeners()
nextListeners.push(listener)

return function unsubscribe() {
  if (!isSubscribed) {
    return
  }

  isSubscribed = false

  ensureCanMutateNextListeners()
  const index = nextListeners.indexOf(listener)
  nextListeners.splice(index, 1)
}
```

发布订阅模式，注册一个事件到事件列表中，这些事件会在dispatch触发的时候一一被执行．



#### dispatch

```js
if (!isPlainObject(action)) {
  throw new Error(
    'Actions must be plain objects. ' +
    'Use custom middleware for async actions.'
  )
}

if (typeof action.type === 'undefined') {
  throw new Error(
    'Actions may not have an undefined "type" property. ' +
    'Have you misspelled a constant?'
  )
}

if (isDispatching) {
  throw new Error('Reducers may not dispatch actions.')
}
```

类型判断，要求action必须是纯对象，并且type属性不能为空，
isDispatching标识是否正在进行reducer的执行，此时的action不能被dispatch.

```js
try {
  isDispatching = true
  currentState = currentReducer(currentState, action)
} finally {
  isDispatching = false
}

const listeners = currentListeners = nextListeners
for (let i = 0; i < listeners.length; i++) {
  const listener = listeners[i]
  listener()
}currentState = currentReducer(currentState, action)
```

用当前的reducer来计算出新的state对象并更新对应的currentState的值．改变标识状态．
执行所有的监听时间处理器．


#### replaceReducer

```js
function replaceReducer(nextReducer) {
  if (typeof nextReducer !== 'function') {
    throw new Error('Expected the nextReducer to be a function.')
  }

  currentReducer = nextReducer
  dispatch({ type: ActionTypes.INIT })
}
```
用来替换当前的replaceReducer并且生成新的state对象树．
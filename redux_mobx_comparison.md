# redux and mobx comparision 

### setState

1. 许多组件之间需要共享状态进行通信。
2. 一个组件需要改变另一个组件的状态。


### state

redux是不可变的，有严格的更新逻辑.
mobx是可变的，可以直接更新。

redux拥有时间旅行，更加可预测，使用纯函数，debug更容易。


### Store

redux 是单一store,由reducer进行拆分逻辑。

mobx　可以是多store, 每个store掌管不同的逻辑，但组件间可以共享同一个store.

### 基本改变state的方法

#### redux

```js
const initialState = {
  todos: [
    {
      title: '1'
    },
    {
      title: '2'
    }
  ]
};

// reducer
function users(state = initialState, action) {
  switch (action.type) {
  case 'USER_ADD':
    return { ...state, todos: [ ...state.todos, action.todo ] };
  default:
    return state;
  }
}

// action
const addTodo = function(todo) {
	return { type: 'ADD_TODO', todo: todo };
}

// app
this.props.addTodo(todo);

// connect
connect(
	({ todos }) => ({ todos }), // mapStateToProps,
	(addTodo) => { 				// mapActionCreators(如果你不指定这个参数，就会将dispatch传入Props,由你自己来决定dispatch哪个action)
		return {
			addTodo,
		}	
})(App);
```

#### mobx


mobx中没有reducer的概念，你甚至不需要action, 因为state是直接可以可变的。
(但为了一个清晰的数据流，符合flux哲学，还是推荐所有改变state的地方都使用action声明来改变)

```js
// 在根文件中启用严格模式，如果没有通过action来改变state,就会报错
import { useStrict } from 'mobx';

useStrict(true);
```

redux中的一个普通的store基本是一个类。逻辑很像把angular的scope提取出来。

```js

// store
class TodoStore {
	@observable todos = []; // 建立依赖数据

	@computed get count() {
		return this.todos.length;
	}

	@action addTodo(todo) {
		this.todos.push(todo)
	}

	addTodoToLocal() {
		reaction(
			() => this.todos,
			todos => localStorage.setItem('todos', JOSN.strigify(todos));
		)
	}
}

export default new TodoStore();

// app

可以通过mobx-react提供的provider和inject来将todoStore注入到组件中，
也可以直接引入使用.

 // 每个需要用响应数据的组件都需要使用mobx-react提供的observer装饰器，　它将mobx的响应数据和react相连接，用来确保每次render函数中的响应数据更新之后，都重新render视图。

@observer
class App {
	constructor() {
		this.todoStore = todoStore;
		this.todoStore.addTodo(todo); // 直接通过来新增一个todo来更新state,
		如果不是严格模式，你可以直接this.todoStore.todos.push(todo)来更新state
	}

	render() {
		// ...
	}
}
```

通过比较可以看到，mobx的样板代码要比redux少很多，写起来也更直接，
mobx内部实现远远大于redux,使得它可以用更少的代码来实现一样的效果，你只需要改变数据，其余的事就交给组件自己渲染。


























## Fiber

#### fiberNode: 

```js
// Instance
this.tag = tag; // fiber的类型, 用于决定调度算法中fiber所对应的任务类型
this.key = key;
this.elementType = null;
this.type = null; // 表明对应的reactElement节点的类型：类或函数表示组件或者字符串表示dom组件
this.stateNode = null; // 持有对相应的reactElement的组件的实例或者dom实例

// Fiber
this.return = null;
this.child = null;
this.sibling = null;
this.index = 0;

this.ref = null;

this.pendingProps = pendingProps;
this.memoizedProps = null;
this.updateQueue = null; // 一个state, DOm, callback更新的队列
this.memoizedState = null;
this.dependencies = null;

this.mode = mode;

// Effects
this.effectTag = NoEffect;
this.nextEffect = null;

this.firstEffect = null;
this.lastEffect = null;

this.expirationTime = NoWork;
this.childExpirationTime = NoWork;

this.alternate = null;
```

所有的节点都是通过链表的方式（这种数据结构有助于fiber可以在遍历节点树链表的任意的时候暂停、恢复对应的当前节点）相连在一起的，

- return 表示父节点的引用
- siblings 表示兄弟节点的引用
- child 表示子节点的引用

这些属性用于构建fiberTree

### fiberTree: 

你可以把fiber看做代表某些待完成的任务的一种数据结构，或者说，一批量的任务。Fiber的架构提供了一种更便捷的方式用于跟踪、调度、暂停或者废弃任务。

每个对应的组件或者说React Element都会生成对应的一个fiberNode, 在更新流程中，react会使用react Element中的数据来更新fiberNode节点的对应属性，当然如果react Element在render返回中被删除或者修改了，fiberNode也会做出对应的更新。

也就是说一个fiber节点对应了一个待完成的任务，也对应了一个react组件的实例。

```js
class ClickCounter extends React.Component {
    constructor(props) {
        super(props);
        this.state = {count: 0};
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick() {
        this.setState((state) => {
            return {count: state.count + 1};
        });
    }


    render() {
        return [
            <button key="1" onClick={this.handleClick}>Update counter</button>,
            <span key="2">{this.state.count}</span>
        ]
    }
}
```

=>

![](https://miro.medium.com/max/694/1*cLqBZRht7RgR9enHet_0fQ.png)


### Fiber Tree traversal

```js
// Import stylesheets
import './style.css';

// Write Javascript code!
const appDiv = document.getElementById('app');
appDiv.innerHTML = `<h1>Linked list traversal</h1>`;

function log(value) {
  const span = document.createElement('span');
  span.textContent = value + ', ';
  appDiv.appendChild(span);
}

const a1 = {name: 'a1'};
const b1 = {name: 'b1'};
const b2 = {name: 'b2'};
const b3 = {name: 'b3'};
const c1 = {name: 'c1'};
const c2 = {name: 'c2'};
const d1 = {name: 'd1'};
const d2 = {name: 'd2'};

a1.render = () => [b1, b2, b3];
b1.render = () => null;
b2.render = () => [c1];
b3.render = () => [c2];
c1.render = () => [d1, d2];
c2.render = () => null;
d1.render = () => null;
d2.render = () => null;

class Node {
    constructor(instance) {
        this.instance = instance;
        this.child = null;
        this.sibling = null;
        this.return = null;
    }
}

function link(parent, elements) {
    if (elements === null) elements = [];

    parent.child = elements.reduceRight((previous, current) => {
        const node = new Node(current);
        node.return = parent;
        node.sibling = previous;
        return node;
    }, null);

    return parent.child;
}

function doWork(node) {
    log(node.instance.name);
    const children = node.instance.render();
    return link(node, children);
}

const hostNode = new Node(a1);
walk(hostNode);

function walk(o) {
    let root = o;
    let node = o;

    while (true) {
        let child = doWork(node);

        if (child) {
            node = child;
            continue;
        }

        if (node === root) {
            return;
        }

        while (!node.sibling) {
            if (!node.return || node.return === root) {
                return;
            }

            node = node.return;
        }

        node = node.sibling;
    }
}
```

#### Current => WorkInProgress

在第一次渲染完成后，react生成了一个fiber tree，其反映了整个应用的当前状态，这个状态用来渲染UI界面，我们将这个fiber tree叫做current。当react开始更新时，它会生成一个`workInProgess`的新的fiberTree用于反映即将被更新到界面上的状态。

所有更新的批任务都来自于这个workInProgress树，随着react遍历current树的同时，对每个存在的fiberNode都会创建一个对应的fiberNode来组成workInProgess树，一旦所有的工作完成，那么就会使用当前的workInProgess树来替换掉对应的树。

fiberNode中的`alternate`属性就是用来保存一个对应的树的对应节点的引用。

#### Effects: 

每次dom操作，或者调用生命周期方法都被视为副作用。它们代表了一些需要在update之后被完成的工作，

每个filer节点都有相对应的副作用与其关联，副作用类型被用数字类型保存在`effectTag`中。

因此effects在fiber节点中的作用就是定义了在更新操作执行后需要被完成的任务，例如需要去更新dom节点，需要调用对用的方法`componentDidMount`或者`componentDidUpdate`，或者需要更新`refs`引用之类的任务。不同的fiber节点会用不同的任务类型。

#### Effects list

为了在每次更新时尽快的执行任务，react会用nextEffect来维护一个线性的effect列表，用于快速的迭代effects和过滤掉一些不需要更新也就是没有effects的节点。


### Render and Commit phase

### Render phase

render 阶段用于为每个fiberNode标记effects, 这些effects描述了需要在commit阶段被完成的任务(例如更新，删除，插入dom节点(这会通过diff算法(fiberNode与新render出来的reactElement比较)来得出)，执行生命周期方法等等)

需要注意的是，在这个阶段的工作，都是异步的，也就是react可能会执行一个或多个fiberNode的标记工作，这取决于浏览器是否有空闲的时间。

四个主要的函数被用来遍历workInProgress树和执行任务：

performUnitOfWork
beginWork
completeUnitOfWork
completeWork

Example Code explain how fiberNodes with unit of works are processed:

```js
const a1 = {name: 'a1', child: null, sibling: null, return: null};
const b1 = {name: 'b1', child: null, sibling: null, return: null};
const b2 = {name: 'b2', child: null, sibling: null, return: null};
const b3 = {name: 'b3', child: null, sibling: null, return: null};
const c1 = {name: 'c1', child: null, sibling: null, return: null};
const c2 = {name: 'c2', child: null, sibling: null, return: null};
const d1 = {name: 'd1', child: null, sibling: null, return: null};
const d2 = {name: 'd2', child: null, sibling: null, return: null};

a1.child = b1;
b1.sibling = b2;
b2.sibling = b3;
b2.child = c1;
b3.child = c2;
c1.child = d1;
d1.sibling = d2;

b1.return = b2.return = b3.return = a1;
c1.return = b2;
d1.return = d2.return = c1;
c2.return = b3;

let nextUnitOfWork = a1;
workLoop();

function workLoop() {
    while (nextUnitOfWork !== null) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    }
}

function performUnitOfWork(workInProgress) {
    let next = beginWork(workInProgress);
    if (next === null) {
        next = completeUnitOfWork(workInProgress);
    }
    return next;
}

function beginWork(workInProgress) {
    log('work performed for ' + workInProgress.name);
    return workInProgress.child;
}

function completeUnitOfWork(workInProgress) {
    while (true) {
        let returnFiber = workInProgress.return;
        let siblingFiber = workInProgress.sibling;

        nextUnitOfWork = completeWork(workInProgress);

        if (siblingFiber !== null) {
            // If there is a sibling, return it 
            // to perform work for this sibling
            return siblingFiber;
        } else if (returnFiber !== null) {
            // If there's no more work in this returnFiber, 
            // continue the loop to complete the returnFiber.
            workInProgress = returnFiber;
            continue;
        } else {
            // We've reached the root.
            return null;
        }
    }
}

function completeWork(workInProgress) {
    log('work completed for ' + workInProgress.name);
    return null;
}

function log(message) {
  let node = document.createElement('div');
  node.textContent = message;
  document.body.appendChild(node);
}
```

### commit Phase

commit阶段就会遍历effectList从而执行对应的DOM更新或者其他的操作。而commit阶段始终是同步的。

commitBeforeMutationEffects
commitMutationEffects
commitLayoutEffects

- how the scheduler finds the next unit of work to perform.
- how priority is tracked and propagated through the fiber tree.
- how the scheduler knows when to pause and resume work.
- how work is flushed and marked as complete.
- how side-effects (such as lifecycle methods) work.
- what a coroutine is and how it can be used to implement features like context and layout.

[](https://medium.com/react-in-depth/in-depth-explanation-of-state-and-props-update-in-react-51ab94563311)

## Diff


## Hooks






























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


### Q&A:


- how the scheduler finds the next unit of work to perform.
- how priority is tracked and propagated through the fiber tree.
- how the scheduler knows when to pause and resume work.
- how work is flushed and marked as complete.
- how side-effects (such as lifecycle methods) work.
- what a coroutine is and how it can be used to implement features like context and layout.
- childExpirationTime, renderExpirationTime
- what is key used for?

[](https://medium.com/react-in-depth/in-depth-explanation-of-state-and-props-update-in-react-51ab94563311)

## Diff

1. 如果新节点是一个字符串

```js
  function reconcileSingleTextNode(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    textContent: string,
    expirationTime: ExpirationTime,
  ): Fiber {
    // There's no need to check for keys on text nodes since we don't have a
    // way to define them.
    if (currentFirstChild !== null && currentFirstChild.tag === HostText) {
      // We already have an existing node so let's just update it and delete
      // the rest.
      deleteRemainingChildren(returnFiber, currentFirstChild.sibling);
      const existing = useFiber(currentFirstChild, textContent, expirationTime);
      existing.return = returnFiber;
      return existing;
    }
    // The existing first child is not a text node so we need to create one
    // and delete the existing ones.
    deleteRemainingChildren(returnFiber, currentFirstChild);
    const created = createFiberFromText(
      textContent,
      returnFiber.mode,
      expirationTime,
    );
    created.return = returnFiber;
    return created;
  }
```

首先如果原位置的节点也是一个文本节点，将其所有的其他子节点删除，然后复用其fiberNode然后更新其文本。

如果源节点不是一个文本节点，则直接删除源节点，然后新建一个文本类型的fiber节点，将其链接到父节点上。

```js
function deleteChild(returnFiber: Fiber, childToDelete: Fiber): void {
    if (!shouldTrackSideEffects) {
      // Noop.
      return;
    }
    // Deletions are added in reversed order so we add it to the front.
    // At this point, the return fiber's effect list is empty except for
    // deletions, so we can just append the deletion to the list. The remaining
    // effects aren't added until the complete phase. Once we implement
    // resuming, this may not be true.
    const last = returnFiber.lastEffect;
    if (last !== null) {
      last.nextEffect = childToDelete;
      returnFiber.lastEffect = childToDelete;
    } else {
      returnFiber.firstEffect = returnFiber.lastEffect = childToDelete;
    }
    childToDelete.nextEffect = null;
    childToDelete.effectTag = Deletion;
  }
  function placeSingleChild(newFiber: Fiber): Fiber {
    // This is simpler for the single child case. We only need to do a
    // placement for inserting new children.
    if (shouldTrackSideEffects && newFiber.alternate === null) {
      newFiber.effectTag = Placement;
    }
    return newFiber;
  }
```

在删除子节点时，将其待删除的子节点加入到父节点的effectList中，并为待删除的子节点标记`effectTag`为`Deletion`类型。

同时，将待插入的新节点标记为`PlaceMent`类型。而这些新节点的effect会在`completeUnitOfWork`时统一归并到父节点的effectList中。

2. 如果新节点是一个对象，也就是可能为`function`, `class`, `host`组件。

`reactChildFiber -> reconcileSingleElement`

首先如果源节点是一个数组，则找到与新节点key一致的节点(都为null也视为一致)，否则删除全部节点。

如果找到key一致的源节点，首先检查源节点的类型是否与新节点的类型一致，如果一致，则直接删除所有的源节点的兄弟节点，然后复用源节点。

如果类型不一致，则直接删除所有的源节点及其兄弟节点。

然后创建新的fiber节点，并标记其effectTag为`PlaceMent`。

3. 如果新节点是一个数组。

在第一次循环中，依次对比新节点和老节点，直到有一个不匹配或者两个列表其中一个被遍历完成；

如果他们之间的key相同，则重用之前的FiberNode, 否则直接跳出循环。

第一次遍历完成后，如果新节点已经全部遍历完成了(newIdx === newChildren.length)，说明老节点多于新节点，此时所有的oldFiber之后的节点都应该被删除。

如果老节点都已经遍历完成(oldFiber === null), 这说明新节点多余老节点，此时遍历剩下的新节点，为其依次创建新的fiberNode，将其插入到新的节点列表。

如果老的节点和新的节点都有剩余，说明第一次循环中出现了不匹配的情况，说明新的节点中相比老的节点来说从中间新增或者删除了节点，

这时候我们剩余的老节点创建一个Map, 将其key或者index作为唯一标识。然后依次遍历剩余的新节点，用新节点的key去查找对应的老节点，如果找到了直接重用老节点(重用了老节点将其从Map中删除)，否则直接创建一个新的节点插入列表。

由于剩下的老节点都是已经被废弃了或者说不能重用的，最后删除Map中所有的老节点。然后返回新列表中的第一个fiberNode作为下一个工作单元。

## Hooks






























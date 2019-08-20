## VDom
## Diff
## hooks

## Fiber


#### fiberNode: 

```js
// Instance
this.tag = tag;
this.key = key;
this.elementType = null;
this.type = null;
this.stateNode = null;

// Fiber
this.return = null;
this.child = null;
this.sibling = null;
this.index = 0;

this.ref = null;

this.pendingProps = pendingProps;
this.memoizedProps = null;
this.updateQueue = null;
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

### fiberTree: 

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


#### Current => WorkInProgress


#### Effects: 

每次dom操作，或者调用生命周期方法都被视为副作用。它们代表了一些需要在update之后被完成的工作，

每个filer节点都有相对应的副作用与其关联，副作用类型被用数字类型保存在`effectTag`中。

#### Effects list


### Render and Commit phase

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

[](https://medium.com/react-in-depth/in-depth-explanation-of-state-and-props-update-in-react-51ab94563311)






























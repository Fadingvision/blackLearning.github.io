## about Promise

---------
test: npm run test_promise

#### Issues
1. 解决的问题，实现的原理
2. 不同promise的实现之间的交互（resolvePromise函数的实现和用法）
3. 原则上，promise.then(onResolved, onRejected)里的这两相函数需要异步调用,让then的参数异步执行
    （setTimeout(fn, 0)的含义和用法）
4. promise链的错误处理
5. promise 的反模式

----------------


#### 一、解决的问题，实现的原理

假设你正在编写一个函数，但是你不能马上返回值，最明显的方法就是将返回的值传入一个回调函数作为参数，而不是将其return回来。

```javascript
var oneOneSecondLater = function (callback) {
    setTimeout(function () {
        callback(1);
    }, 1000);
};
```
这是一个很简单的解决方案，但是存在很多问题。

一个更普通的办法是传入一个回调函数以及一个错误处理函数来对返回的值以及可能出现的错误进行处理。
```js
var maybeOneOneSecondLater = function (callback, errback) {
    setTimeout(function () {
        if (Math.random() < .5) {
            callback(1);
        } else {
            errback(new Error("Can't provide one."));
        }
    }, 1000);
};
```

然而,这些方法实际模型抛出异常。异常和try / catch块的目的是推迟显式处理的异常,直到程序返回一个值，试图恢复是有意义的。需要有一些隐式传播异常的机制来出传播没有被处理的异常，这就是Pormise.


```javascript
var maybeOneOneSecondLater = function () {
    var callback;
    setTimeout(function () {
        callback(1);
    }, 1000);
    return {
        then: function (_callback) {
            callback = _callback;
        }
    };
};

maybeOneOneSecondLater().then(callback);
```
我们模拟一个有then方法的对象来模拟promise,目的是为了推迟回调函数的注册，但是这里存在两个问题：

1、 只能最后有一个callback去接受返回的value, 如果有更多的callback可以去接受这个值，那么这个对象将会更有用。
2、如果这个回调函数的注册时间超过了1秒，那么这个Promise将是失败的，因为callback将不会执行。

一个更普遍的解决办法会接受任何数量的回调并允许他们注册之前或之后超时,或者一般来说,解决事件。我们可以通过将Promise变成一个拥有两个状态的对象来实现这一点。

```js
var maybeOneOneSecondLater = function () {
    var pending = [], value;
    setTimeout(function () {
        value = 1;
        for (var i = 0, ii = pending.length; i < ii; i++) {
            var callback = pending[i];
            callback(value);
        }
        pending = undefined;
    }, 1000);
    return {
        then: function (callback) {
            if (pending) {
                pending.push(callback);
            } else {
                callback(value);
            }
        }
    };
};

```
将上面的函数稍作改变，把promise的逻辑和真正的异步处理函数的逻辑分开，从而逻辑可以划分的更清晰，同时defer对象也可以进行复用，得到下面的一个通用的defer对象，可以用then来添加回调函数，用resolve方法来将保存的回调函数执行，并传入相应的我们需要回调函数接受的参数value值。

```js
var defer = function () {
    var pending = [], value;
    return {
        resolve: function (_value) {
            value = _value;
            for (var i = 0, ii = pending.length; i < ii; i++) {
                var callback = pending[i];
                callback(value);
            }
            pending = undefined;
        },
        then: function (callback) {
            if (pending) {
                pending.push(callback);
            } else {
                callback(value);
            }
        }
    }
};
// 如何使用defer对象
var oneOneSecondLater = function () {
    var result = defer();
    setTimeout(function () {
        result.resolve(1);
    }, 1000);
    return result;
};

oneOneSecondLater().then(callback);

```
这里的resolve函数有点缺陷，在于其可以执行多次并改变promise的状态。修复一下, 当第二次调用resolve的时候抛出一个错误。

```js
if (pending) {
    value = _value;
    for (var i = 0, ii = pending.length; i < ii; i++) {
        var callback = pending[i];
        callback(value);
    }
    pending = undefined;
} else {
    throw new Error("A promise can only be resolved once.");
}
```

将promise从resolve中分离出来有助于我们遵循单一职责的编程原则，promise只负责监控结果的状态，而resolve函数负责真正的执行。
这种分离必然会加重垃圾回收机制的负担。

```js
var Promise = function () {
};

var isPromise = function (value) {
    return value instanceof Promise;
};

var defer = function () {
    var pending = [], value;
    var promise = new Promise();
    promise.then = function (callback) {
        if (pending) {
            pending.push(callback);
        } else {
            callback(value);
        }
    };
    return {
        resolve: function (_value) {
            if (pending) {
                value = _value;
                for (var i = 0, ii = pending.length; i < ii; i++) {
                    var callback = pending[i];
                    callback(value);
                }
                pending = undefined;
            }
        },
        promise: promise
    };
};
```
下一步是解决连续promise调用的问题，假设一下，有个函数的执行依赖另外两个异步函数的返回值，用回调函数是这样的实现：

```js
var twoOneSecondLater = function (callback) {
    var a, b;
    var consider = function () {
        if (a === undefined || b === undefined)
            return;
        callback(a + b);
    };
    oneOneSecondLater(function (_a) {
        a = _a;
        consider();
    });
    oneOneSecondLater(function (_b) {
        b = _b;
        consider();
    });
};

twoOneSecondLater(function (c) {
    // c === 2
});
```
这种方式有明显的缺点：consider函数需要在其被使用之前显式的声明。

而在promise的实现下，我们只需要几行代码就可以轻松的实现这个效果：

```js

var a = oneOneSecondLater();
var b = oneOneSecondLater();
var c = a.then(function (a) {
    return b.then(function (b) {
        var c = a + b;
        return c;
    });
});
```
为了上面的代码能够正常的工作，我们需要做一下几件事：
1. then方法必须返回一个Promise，
2. 返回的promise必须能够被回调函数的返回值resolve
3. 回调函数的返回值必须是一个解决的常量值或者是一个pormise对象。


**reference：**

[q](https://github.com/kriskowal/q)

#### 二、不同promise之间的解决过程（为了兼容不同的promise标准实现或者兼容一些非promise的错误用法。）


**下面是promise/A+的标准文档，里面提到了我们应该如何去处理一个传进resolve的值。**


Promise 解决过程

Promise 解决过程是一个抽象的操作，其需输入一个 promise 和一个值，我们表示为 [[Resolve]](promise, x)，如果 x 有 then 方法且看上去像一个 Promise ，解决程序即尝试使 promise 接受 x 的状态；否则其用 x 的值来执行 promise 。

这种 thenable 的特性使得 Promise 的实现更具有通用性：只要其暴露出一个遵循 Promise/A+ 协议的 then 方法即可；这同时也使遵循 Promise/A+ 规范的实现可以与那些不太规范但可用的实现能良好共存。

运行 [[Resolve]](promise, x) 需遵循以下步骤：

x 与 promise 相等

如果 promise 和 x 指向同一对象，以 TypeError 为据因拒绝执行 promise

x 为 Promise

如果 x 为 Promise ，则使 promise 接受 x 的状态 注4：

如果 x 处于等待态， promise 需保持为等待态直至 x 被执行或拒绝
如果 x 处于执行态，用相同的值执行 promise
如果 x 处于拒绝态，用相同的据因拒绝 promise
x 为对象或函数

如果 x 为对象或者函数：

把 x.then 赋值给 then 注5
如果取 x.then 的值时抛出错误 e ，则以 e 为据因拒绝 promise

如果 then 是函数，将 x 作为函数的作用域 this 调用之。传递两个回调函数作为参数，第一个参数叫做 resolvePromise ，第二个参数叫做 rejectPromise:

如果 resolvePromise 以值 y 为参数被调用，则运行 [[Resolve]](promise, y)

如果 rejectPromise 以据因 r 为参数被调用，则以据因 r 拒绝 promise

如果 resolvePromise 和 rejectPromise 均被调用，或者被同一参数调用了多次，则优先采用首次调用并忽略剩下的调用

如果调用 then 方法抛出了异常 e：

如果 resolvePromise 或 rejectPromise 已经被调用，则忽略之
否则以 e 为据因拒绝 promise

如果 then 不是函数，以 x 为参数执行 promise
如果 x 不为对象或者函数，以 x 为参数执行 promise

如果一个 promise 被一个循环的 thenable 链中的对象解决，而 [[Resolve]](promise, thenable) 的递归性质又使得其被再次调用，根据上述的算法将会陷入无限递归之中。算法虽不强制要求，但也鼓励施者检测这样的递归是否存在，若检测到存在则以一个可识别的 TypeError 为据因来拒绝 promise 注6。


**reference：**

[Promises/A+规范(中文)](http://example.com/)

[Promises/A+规范(英文)](https://promisesaplus.com/)


#### 三、setTimeout(fn, 0)的作用

确保回调函数按照他们注册的时间顺序去执行，这大大减少了控制流异步编程的固有危险数量。考虑一个简单的例子:

```js
var blah = function () {
    var result = foob().then(function () {
        return barf();
    });
    var barf = function () {
        return 10;
    };
    return result;
};
```

该函数将抛出一个异常或返回一个被10解决的promise, 它取决于foob()解决在同一的事件循环(发行其立即回调在同一堆栈)或在未来。如果回调是推迟到未来,它会一直成功。

#### 关于setTimeout(fn, 0);

js运行是基于单线程的，意味着一段代码执行时，其他代码将进入队列等待，一旦线程有空闲就执行后续代码。如果代码中设定了一个setTimeout，那么浏览器便会在合适的时间，将代码插入任务队列，如果这个时间设为 0，就代表立即插入队列，但并不是立即执行，仍然要等待前面代码执行完毕（其实有个延时，具体是16ms还是4ms取决于浏览器）。
这种方法常常被用在一些库和框架中，叫做nextTick();
所以setTimeout 并不能保证执行的时间，是否及时执行取决于 JavaScript 线程是拥挤还是空闲。


这里只考虑了浏览器的情况，由于在node中是没有window对象的，而是用process.nextTick()方法代替。

```html
<input type="text" ng-model="name" ng-keydown="showName()">
<span ng-bind="name"></span>
```

```js
var app = angular.module('App', []);
app.controller('myContrl', function($scope, $window) {
    $scope.name = '123';
    $scope.showName = function() {
        $window.setTimeout(function() {
            console.log($scope.name);
        }, 0);
    };
})
```
例如在keydown事件中，js引擎需要先去执行keydown的事件，然后再去更新input中的value值，
这就导致我们无法及时的取到输入框中“准确”的value值，所以利用setTimeout(fn, 0)将取值的操作加入到当前执行队列的最后，等待value的值更新之后我们再去进行取值的操作，就可以取到准确的值了。

#### 四、 promise错误链的处理

每当我们进行到有可能出现错误的步骤时，都有try/catch语法对代码进行包装，捕获所有可能出现的错误，将其抛给reject函数，
这样我们就能在外层通过then方法将其捕获并进行处理，
因此catch方法其实就是then方法包装后的语法糖而已。

```javascript
catch(err){
    return this.then(null, function(err) {
        // Do something with the error ..
    })
}

```
-------

#### 五、 promise 的反模式


##### **怎样用 forEach() 处理promise**

```js
// I want to remove() all docs
db.allDocs({include_docs: true}).then(function (result) {
    result.rows.forEach(function (row) {
        db.remove(row.doc);
    });
}).then(function () {
    // I naively believe all docs have been removed() now!
});
```

这段代码的问题在于第一个回调函数实际上返回的是 undefined ，也就意味着第二个函数并不是在所有的 db.remove() 执行结束之后才执行。事实上，第二个函数的执行不会有任何延时，它执行的时候被删除的doc数量可能为任意整数。

```js
db.allDocs({include_docs: true}).then(function (result) {
    return Promise.all(result.rows.map(function (row) {
        return db.remove(row.doc);
    }));
}).then(function (arrayObject) {
    // All docs have really been removed() now!
})
```

这时候promise.all就能够很好的解决问题，它会在所有的promise的状态变为resolved的时候才会执行回调函数。
并且还会将计算结果以数组的形式传递给下一个函数，这一点十分有用。

##### **使用“deferred”**

在早些时候，jQuery和Angular都在使用’deferred’类型的promise。而在最新的ES6的Promise标准中，这种实现方式已经被替代了，同时，一些Promise的库，比如Q，bluebid，lie也是参照ES6的标准来实现的。

因此我们应该使用将非promise API包装成promise API,

```js
new Promise(function (resolve, reject) {
    fs.readFile('myfile.txt', function (err, file) {
        if (err) {
            return reject(err);
        }
        resolve(file);
    });
}).then(...)
```

##### 不显式调用return

```js
somePromise().then(function () {
    return getUserAccountById();
}).then(function (UserAccount) {
    // Gee, I hope getUserAccountById() has resolved
    // Spoiler alert: it hasn't
});
```

这段代码的问题在哪儿呢？如果你在then的回调函数参数中不显式的调用return,根据js的语言规范来说，
它会默认返回undefined,这回导致代码不会按照你想要的结果执行，例如上面的例子，第二个then方法会紧接着
第一个then方法执行，而不会在someOtherPromise()返回结果之后再去执行。

这是因为第一个then方法返回的promise的状态会根据他内部函数的返回值来决定，如果你返回的不是一个promise,那么该
then方法返回的promise将会立即变化为resolved,则第二个then方法会立即执行，并且不能接收到上一个promise的返回的参数。

##### 忘记添加catch()方法

很多程序员对他们代码中的promise调用十分自信，觉得代码永远不会抛出一个 error ，也可能他们只是简单的忘了加 catch() 方法。

不幸的是，不加 catch() 方法会让回调函数中抛出的异常被吞噬，
在你的控制台是看不到相应的错误的，这对调试来说是非常痛苦的。

忘记添加catch方法的时候会导致难以追踪错误发生的地方和原因，例如以前在用thinkjs写服务端的时候会去代理客户端访问第三方的接口，这时候如果对方返回的是一个非法的json数据，这时候这边的JSON.parse会报错，而这时由于异常被回调函数所吞噬，导致控制台不会显示任何错误，即如果不添加catch方法捕获该错误，会导致客服端存在pending假卡死的状态，另错误难以发觉。

-------

#### 进阶错误
##### 不了解Promise.resolve()和promise.reject()

```js
new Promise(function (resolve, reject) {
  resolve(someSynchronousValue);
}).then(...);
```

这是很多程序员在包装一个promise常用的方法，但是我们可以用promise.resolve()来对上面的代码进行精简，

```js
Promise.resolve(someSynchronousValue).then(...);
```

##### catch和then(null, (err) => {})并不完全相同

```js
somePromise().then(function () {
  return someOtherPromise();
}).catch(function (err) {
  // handle error
});

somePromise().then(function () {
  return someOtherPromise();
}, function (err) {
  // handle error
});
```

考虑当someOtherPromise抛出错误时会发生什么，答案是catch方法能够捕捉到这个错误，
而当使用 then(resolveHandler, rejectHandler) ， rejectHandler 不会捕获在 resolveHandler 中抛出的错误。

如果你的then的第二个函数只用来处理错误，那么
一个好的处理方法是从不使用then方法的第二个参数，转而使用 catch() 方法。

#### 六、 对比和学习其他优秀的实现
[es6-promise](https://github.com/stefanpenner/es6-promise)


看到这些框架和库的时候以前都往往喜欢直接去读一个大而全的代码，
而这些库和框架的代码其实也是一个个小的模块拼接起来的，
这种方法不仅有助于写出逻辑分明，功能划分明确，耦合度低，易读易debug的代码，而在es6模块化逐渐普及的今天也是非常符合js这门语言发展的趋势的，因此有必要多多学习这些拆分代码的方法和思想。

##### 1. util.js

这个模块主要负责**封装一些常用的工具方法，便于代码复用**
而我们的实现中，没有将判断thenable, 是否是函数或对象的功能方法拆分出来，
而是过程式的和逻辑代码揉在了一起，造成阅读起来不太美观和优雅，而且也不太利于代码的抽离和复用。


##### 2. promise.js

promise代表了异步执行的最终结果，主要影响promise的方法是通过它的then方法。then方法注册了回调函数用来接受promise被执行的最终值或者是未被执行的原因。

```js
import all from './promise/all';
import race from './promise/race';
import Resolve from './promise/resolve';
import Reject from './promise/reject';
import then from './then';
```

这个模块只保留了promise的核心代码，而将所有其他的由核心代码衍生出来的代码都分离出来通过import进来，代码结构十分清晰，函数粒度划分很小。

将所有的抛出错误通过函数的方式提取出来，而不是和逻辑代码混在一起，符合函数式编程的思想，代码看起来也更优雅。

这个模块负责初始化promise的状态和值，并且判断executor的值的类型的正确性。将真正初始化promise的逻辑放在initializePromise这个函数中，而且为了代码的划分，这些函数基本都是将promise作为了自己的参数，从而方便调用promise的方法和改变promise的值和状态。

##### 3. asap.js

该模块主要编写负责代码的异步执行的asap函数。


##### 4. -internal.js

该模块主要进行一些内部私有函数的编写,如resolve、reject函数，处理thenable对象的handleOwnThenable、handleMaybeThenable函数，解决promise的函数fulfill，生成promise的id的自增函数，以及一些定义promise的状态的数字常量标识。

##### 5. then, all, resolve, reject, race.js

这些模块对应编写promise原型上的一些共享方法或者挂载在构造函数的一些静态方法，
将其和主promise的模块的代码独立分开，方便逻辑清晰的划分。


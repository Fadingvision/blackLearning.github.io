// 1.
["1", "2", "3"].map(parseInt) 


// 2. 
// 节流(在timeout内最多只执行一次)
// 常用于 scroll, resize事件
function throttle(fn, timeout) {
  let isTimeout = true;
  return function() {
    if (!isTimeout) return;
    fn();
    isTimeout = false;
    let tid = setTimeout(() => {
      clearTimeout(tid);
      isTimeout = true;
    }, timeout)
  }
}

// 防抖（函数会从上一次被调用后，延迟 wait 毫秒后调用 func 方法）
function debounce(fn, timeout) {
  let tid;
  return function() {
    if (tid) {
      clearTimeout(tid);
      tid = null;
    }
    tid = setTimeout(() => {
      clearTimeout(tid);
      tid = null;
      fn();
    }, timeout)
  }
}

// 3. Set and weakSet, Map and weakMap
/*
  WeakSet 适合临时存放一组对象，以及存放跟对象绑定的信息。只要这些对象在外部消失，它在 WeakSet 里面的引用就会自动消失。
  由于上面这个特点，WeakSet 的成员是不适合引用的，因为它会随时消失。另外，由于 WeakSet 内部有多少个成员，取决于垃圾回收机制有没有运行，运行前后很可能成员个数是不一样的，而垃圾回收机制何时运行是不可预测的，因此 ES6 规定 WeakSet 不可遍历。

  weakMap 的键名所引用的对象都是弱引用，即垃圾回收机制不将该引用考虑在内。因此，只要所引用的对象的其他引用都被清除，垃圾回收机制就会释放该对象所占用的内存。也就是说，一旦不再需要，WeakMap 里面的键名对象和所对应的键值对会自动消失，不用手动删除引用。
  基本上，如果你要往对象上添加数据，又不想干扰垃圾回收机制，就可以使用 WeakMap。一个典型应用场景是，在网页的 DOM 元素上添加数据，就可以使用WeakMap结构。当该 DOM 元素被清除，其所对应的WeakMap记录就会自动被移除。
*/
var map = new Map();
var weakmap = new WeakMap();

(function(){
    var a = {x: 12};
    var b = {y: 12};

    map.set(a, 1); // will be existed after IIFE executed
    weakmap.set(b, 2); // will be deleted by GC after IIFE executed
})()

// 4. deepcopy with DFS and BFS
// DFS
function deepCopy(data) {
  if (typeof data !== 'object') {
    return data
  }

  let newData;
  if (Array.isArray(data)) {
    newData = data.map(deepCopy)
  } else {
    newData = {};
    for (const item of data) {
      newData[item] = deepCopy(item);
    }
  }

  return newData
}

// 5. microTask and macroTask

async function async1() {
  console.log('async1 start');
  await async2();
  console.log('async1 end');
}
async function async2() {
  console.log('async2');
}
console.log('script start');
setTimeout(function() {
  console.log('setTimeout');
}, 0)
async1();
new Promise(function(resolve) {
  console.log('promise1');
  resolve();
}).then(function() {
  console.log('promise2');
});
console.log('script end');

// (macro)task主要包含：script(整体代码)、setTimeout、setInterval、I/O、UI交互事件、postMessage、MessageChannel、setImmediate(Node.js 环境)

// script start => 宏任务
// async1 start => 宏任务
// async2 => 宏任务
// promise1 => 宏任务
// script end => 宏任务

// 微任务：Promise.then、MutaionObserver、process.nextTick(Node.js 环境)

// async1 end  => 第一轮Loop执行完之后的微任务
// promise2  => 第一轮Loop执行完之后的微任务

// 渲染...

// setTimeout  => 下一轮宏任务

// EventLoop: 
/* 
  执行一个宏任务（栈中没有就从事件队列中获取）
  执行过程中如果遇到微任务，就将它添加到微任务的任务队列中
  宏任务执行完毕后，立即执行当前微任务队列中的所有微任务（依次执行）
  当前宏任务执行完毕，开始检查渲染，然后GUI线程接管渲染
  渲染完毕后，JS线程继续接管，开始下一个宏任务（从事件队列中获取）
*/

// 6. implement `new` keyword
/* 
  1、创建了一个新对象（是Object类型的数据）
  2、将this指向新对象
  3、将创建的对象的原型指向构造函数的原型
  4、返回一个对象（如果构造函数本身有返回值且是对象类型，就返回本身的返回值，如果没有才返回新对象）
*/
function new(Constructor, ...args) {
  const obj = {};
  var res = Constructor.apply(obj, args);
  obj.__proto__ = Constructor.prototype;
  obj.__proto__.constructor = Constructor;
  return typeof res === 'object' && res !== null ? res : obj;
}
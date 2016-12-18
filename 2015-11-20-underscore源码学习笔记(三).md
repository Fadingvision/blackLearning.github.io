---
layout: post
title:  "underscore源码学习笔记(三)"
date:   2015-11-20 14:29:29 +0800
category: "underscore"
tags: [javascript,underscore]
---

####  函数
1. 首先是很多地方用到的原型继承。

```js
var baseCreate = function(prototype) {
    if (!_.isObject(prototype)) return {};
    if (nativeCreate) return nativeCreate(prototype);
    Ctor.prototype = prototype;
    var result = new Ctor;
    Ctor.prototype = null;
    return result;
};
```
首先检测原生的Object.create是否存在，不存在就借用一个空的构造函数来实现原型继承。
2. 函数绑定

```js
// 执行绑定函数
var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
    var self = baseCreate(sourceFunc.prototype);
    var result = sourceFunc.apply(self, args);
    if (_.isObject(result)) return result;
    return self;
};
```
sourceFunc是需要绑定的函数，boundFunc是绑定函数，context是绑定的作用域，callingContext是函数的现有作用域。首先判断现有作用域是否是绑定函数的实例，如果不是的话，就用普通的apply实现绑定即可，否则则把函数绑定在原型作用域中。
3. 函数节流

```js
_.throttle = function(func, wait, options) {
  var context, args, result;
  var timeout = null;
  var previous = 0;
  if (!options) options = {};
  var later = function() {
    previous = options.leading === false ? 0 : _.now();
    // 清除timeout
    timeout = null;
    // 执行函数
    result = func.apply(context, args);
    if (!timeout) context = args = null;
  };
  return function() {
    var now = _.now();
    // 如果不是第一次执行，或者leading为true,则previous与Now不相等，则计算剩余时间
    // 如果leading为false，且第一次执行，此时（previous == 0）,则reamaining等于wait，第一次执行func，必须在wait时间后。
    if (!previous && options.leading === false) previous = now;
    var remaining = wait - (now - previous);
    context = this;
    args = arguments;
    // 如果剩余时间小于0，或者大于传入的等待时间，则立即执行func
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
      // 否则如果trailing为true时则等待remaining后执行func,
      // 如果trailling为false,则最后一次不会被执行。
    } else if (!timeout && options.trailing !== false) {
      timeout = setTimeout(later, remaining);
    }
    return result;
  };
};
```
该函数用于一个函数频繁触发时（如scroll事件函数,mousemove函数），对函数进行节流控制，至少每隔 wait毫秒调用一次该函数。有两个可以配置的参数，如果你想禁用第一次首先执行的话，传递{leading: false}，还有如果你想禁用最后一次执行的话，传递{trailing: false}。
4. 防反跳函数----debounce函数

```js
_.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
	  // 计算持续的时间
      var last = _.now() - timestamp;
	  // 如果持续的事件小于wait的时间,则计算剩余时间后执行本函数
      if (last < wait && last >= 0) {
        timeout = setTimeout(later, wait - last);
      } else {
      // 否则情空timeout
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      // 如果传入了立即执行，则callNow为true，立即执行func
      var callNow = immediate && !timeout;
      // 设置wait后执行Later函数
      if (!timeout) timeout = setTimeout(later, wait);
      // 立即执行func
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
};
```
该函数常用避免用户频繁改变操作时，函数的运行次数过多，导致用户停止操作时，函数任然在运行。例如window.resize触发执行对元素的位置的重新计算，运用debounce函数可以再用户完全停止操作后（函数的最后一次调用时刻的wait毫秒之后），在真正的执行该函数。
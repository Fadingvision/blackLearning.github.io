---
layout: post
title:  "underscore源码学习笔记(四)"
date:   2015-01-07 22:29:29 +0800
category: "underscore"
tags: [javascript,underscore]
---

###四、对象（Objects）
1. 首先了解一下使用率最广之一的extend函数。

```js
_.extend = createAssigner(_.allKeys);
_.extendOwn = _.assign = createAssigner(_.keys);
// createAssigner 函数用于传入遍历源对象的函数，keysFunc来决定是否是复制自己的属性还是所有的属性一起复制.undefinedOnly决定是否将目标函数的已有同名属性用源对象的同名属性覆盖。
var createAssigner = function(keysFunc, undefinedOnly) {
	//　真正的extend函数是这个闭包函数
    return function(obj) {
    // 首先判断参数的个数，如果没有传入源对象，则直接返回目标对象
      var length = arguments.length;
      if (length < 2 || obj == null) return obj;
      // 利用循环嵌套循环所有源对象,将源对象中所有属性取出来遍历。
      for (var index = 1; index < length; index++) {
        var source = arguments[index],
            keys = keysFunc(source),
            l = keys.length;
        for (var i = 0; i < l; i++) {
        // 将源对象的属性通通复制到目标对象中
          var key = keys[i];
          if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
        }
      }
      // 返回目标对象
      return obj;
    };
};
```
- extend函数通常用于将源对象复制到第一个参数即目标对象中，复制是按顺序的, 所以后面的对象属性会把前面的对象属性覆盖掉(如果有重复)。这个函数在写构造函数传入大量参数时常常被使用来与默认参数合并。
- 相比jquery的extend函数这里没有提供深拷贝和浅拷贝的参数选项，这就意味着**_.extend函数只能执行浅拷贝**。也就是任何嵌套的对象都只会通过引用拷贝，对目标对象中的嵌套对象的修改都会反映到源对象中。

```js
// jquery的extend函数(可以复制数组和对象，深度复制)
function deepExtend(destination, source) {
	for (var key in source) {
		var value = source[key];
		if (value instanceof Array) {
			destination[key] = deepExtend.call(destination[key] || [], value);
		} else if (value instanceof Object) {
			destination[key] = deepExtend.call(destination[key] || {}, value);
		} else {
			destination[key] = source[key];
		}
	}
	return destination;
}
```
2. 接下就是一些**类型判断**的函数。

- 判断是否是空，如果元素为null或者是类数组且长度为0，或者是对象但没有属性，则判断是空的类型。

```js
_.isEmpty = function(obj) {
    if (obj == null) return true;
    if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
    return _.keys(obj).length === 0;
};
```
- 谈谈判断元素类型的几种方法：
1. 如果是基本类型则用typeof判断是最优选择。
2. 如果是引用类型则用instanceof判断比较好。
3. 如果是数组用原生的isArray判断比较好。
4. 用Object.prototype.toString.call(variable)来判断，这是underscore中最主要的类型判断方式
5. 需要注意的是对null使用typeof时，它会返回object.所以在UnderScore中判断对象时，用了(typeof obj) === 'function'  ||  (typeof obj)  === 'object' && !!obj;这里的!!obj就是为了防止错把null判断成object，因为!!null === false。
6. 由于NaN是Js中唯一一个不等于自身的类型，所以判断NaN时常用_.isNumber(obj) && obj !== +obj;
7. 判断undefined时用了obj === void 0，这里的void 0其实就是返回了undefined。

###四、实用函数（Utility）
1. 随机数函数，返回一个min 和 max之间的随机整数。这个函数也是较为常用的函数之一。

```js
_.random = function(min, max) {
    // 如果只穿了一个参数，则返回0到该参数的一个随机整数
    if (max == null) {
      max = min;
      min = 0;
    }
    // 因为Math.random()返回的是0到1之间的随机小数，由于取闭区间，所有加上1,保证能取到Max.
    return min + Math.floor(Math.random() * (max - min + 1));
};
```
2. id生成器函数，为需要的客户端模型或DOM元素生成一个全局唯一的id。在为数组标注时比较有用。

```js
// idCounter 是一个全局变量，每次设置id时，他都会+1,保证每次的id不一样。
var idCounter = 0;
_.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
};
```

3. 扩展underscore

```js
_.mixin = function(obj) {
	   // 循环传入的对象属性		
    _.each(_.functions(obj), function(name) {
	   // 将函数赋给_对象的'name'属性下      
	  var func = _[name] = obj[name];
	  // 设置原型
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result(this, func.apply(_, args));
      };
    });
  };

_.mixin(_);
```
4. 模块化处理

```js
if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
}
```
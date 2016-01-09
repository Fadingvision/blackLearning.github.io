---
layout: post
title:  "underscore源码学习笔记"
date:   2015-10-25 14:29:29 +0800
category: "underscore"
tags: [javascript,underscore]
---

###underscore源码学习笔记

####一、集合

1. 首先是几个迭代的方法。

```javascript
_.each = _.forEach = function(obj, iteratee, context) {
    iteratee = optimizeCb(iteratee, context);
    var i, length;
    if (isArrayLike(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    // 链式调用
    return obj;
};
```
ES为数组同样添加了原生的forEach()方法。不同的是这里的each(forEach)方法可以对所有集合使用，函数接受三个参数（集合、迭代函数、执行环境）。

optimizeCb函数根据**迭代函数参数个数的不同**为不同的迭代方法绑定了相应的执行环境，forEach迭代函数同样接受三个参数（值，索引，集合）。
接下来就是for循环调用迭代函数了。

_.map中一种更优雅的判断isArrayLike的实现方式：（只用一个for循环）

```javascript
var keys = !isArrayLike(obj) && _.keys(obj),
    length = (keys || obj).length,
    results = Array(length);
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
return results;
    // 合理使用&&、||、?:可以大大减少代码量
```
还有两个特别的地方：
  - 将集合分成了类数组集合和对象集合。使用了isArrayLike函数：
  
```js 
// js的最大精确整数
var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
var isArrayLike = function(collection) {
    var length = collection != null && collection.length;
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
}; // 如果集合有Length属性且为数字并且大于0小于最大的精确整数，则判定是类数组
```
- 使用了_.keys函数，Object同样有原生的keys函数，用于返回一个集合obj可被枚举的属性数组。实现比较简单，for in加上hasOwnProperty()方法。

-----
\_.map，_.reduce方法原理类似.
\_.find函数和Array.some()类似，不同的是返回的是第一个使迭代结果为真的那个元素，而不是Array.some()那样返回布尔值。

```js
_.find = _.detect = function(obj, predicate, context) {
    var key;
    if (isArrayLike(obj)) {
      key = _.findIndex(obj, predicate, context);
    } else {
      key = _.findKey(obj, predicate, context);
    }
    if (key !== void 0 && key !== -1) return obj[key];
};
function createIndexFinder(dir) {
    return function(array, predicate, context) {
      predicate = cb(predicate, context);
      var length = array != null && array.length;
      // 如果dir为1,index为0，index+=1，index正序循环
      // 如果dir 为-1，index为length-1,index += -1反序循环
      // 判断循环条件则用了index >= 0 && index < length方法兼顾两种循环方式
      var index = dir > 0 ? 0 : length - 1;
      
      for (; index >= 0 && index < length; index += dir) {
        if (predicate(array[index], index, array)) return index;
      }
      return -1;
    };
}
_.findIndex = createIndexFinder(1)；
_.findLastIndex = createIndexFinder(-1)；
```
值得借鉴的地方是这里的一个for循环能够根据传入的参数不同配置不同的循环顺序。
2. 集合中的其他方法基本都是基于迭代方法来实现的。

```js
_.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value > result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
   return result;
};
```
max方法用于寻找集合中的最大值，通过循环list中的所有项，然后比较当前项和结果项，如果当前项大于结果，则将其赋给结果项，最后返回结果项。
3. 集合转换为数组

```javascript
_.toArray = function(obj) {
     if (!obj) return [];
     // 如果是数组，采用了Array.prototype.slice.call(this,obj)这种方法
     if (_.isArray(obj)) return slice.call(obj);
     // 类数组对象，这里没有采用Slice方法，而是利用.map对集合进行迭代，从而返回一个数组。 _.identity该方法传入的值和返回的值相等。（主要用于迭代）
     xif (isArrayLike(obj)) return _.map(obj, _.identity);
     // 普通对象，则返回由属性值组成的数组。
     return _.values(obj);
};
```
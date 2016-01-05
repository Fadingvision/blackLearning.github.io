---
layout: post
title:  "underscore源码学习笔记(二)"
date:   2015-10-28 14:29:29 +0800
category: "underscore"
tags: [javascript,underscore]
---

#### 二、数组

1. 首先说说里面碰见的比较多的一个值：void 0, void本身是一个操作符，对表达式求值，并返回 undefined。所以void 0 其实就是等于undefined的，由于undefined本身在浏览器中的差异，有些undefined可以被重写，所以使用void 0 代替undefined更加安全。void(0)也常常在锚链接中这样使用：href = javascript:void(0);  ，用于取消a标签的默认行为
2. 接下来开始**数组部分**的源码学习：

- 相对复杂的一个函数:flatten，用于将嵌套的数组转换为1维数组，或者减少一个维度(shallow为ture时)，并且可以配置起始位置。

```js
var flatten = function(input, shallow, strict, startIndex) {
    var output = [], idx = 0;
    for (var i = startIndex || 0, length = input && input.length; i < length; i++) {
      var value = input[i];
      if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
        if (!shallow) value = flatten(value, shallow, strict);
        var j = 0, len = value.length;
        output.length += len;
        while (j < len) {
          output[idx++] = value[j++];
        }
      } else if (!strict) {
        output[idx++] = value;
      }
    }
    return output;
};
```
主要是利用了递归，首先循环数组，如果数组内部元素是数组，则对其递归调用自身函数。否则直接将其值赋给Output数组，原理类似于对象的深度clone函数。

```js
function cloneObject(src) {
  var obj;
  if (typeof src === 'object') {
  // 需要注意的是对typeof对null也返回'object'
    if (src === null) {
      obj = null;
    } else {
      obj = {};
      for (var k in src) {
        if (src.hasOwnProperty(k)) {
          obj[k] = (typeof src[k] === 'object') ? cloneObject(src[k]) : src[k];
        }
      }
    }
  } else {
    obj = src;
  }
  return obj;
}
```

- _.uniq函数，主要方法：

```js
for (var i = 0, length = array.length; i < length; i++) {
      var value = array[i];
      var result = [];
      if (!_.contains(result, value)) {
        result.push(value);
        }
return result;
```
方法类似于常用的去重方法，定义一个空对象，将数组每项的值作为对象的属性，检测对象的属性是否存在，如果不存在，则将其push到结果数组中，并给这个属性设值，这样下次有相同的值，那么这个属性就是存在的。这里是依赖内部的_.contains函数来实现的。

```js
for (var i = 0, length = array.length; i < length; i++) {
      var value = array[i];
      var result = [];
      var a = {};
      if (!a[value]) {
        a[value] = 1;
        result.push(value);
}
return result;
```
- indexOf、findIndex、lastIndexOf都是通过循环数组加if比较判断，比较清楚。
- _.sortedIndex函数没有搞太懂。API说是使用二分查找确定value在list中的位置序号，value按此序号插入能保持list原有的排序。

```js
_.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = cb(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = Math.floor((low + high) / 2);
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
};
```
-ps: 发现_.range里一个var range = Array(length);这种不加new的，还有其他库里new调用构造函数不加括号的，js真的很灵活。。
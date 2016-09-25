---
layout: post
title:  "JS代码风格对比"
date:   2016-09-20 22:29:29 +0800
category: "javascript"
tags: [javascript]
---

## airbnb和google推荐的JS代码风格对比和介绍

> 由于JavaScript 没有一个权威的编码风格指南，取而代之的是一些流行的编码风格。
通过采用一些合理的编码规范，一方面可以弥补js语言上的一些缺陷，另一方面可以降低每个组员介入项目的门槛成本，从而提高提高工作效率及协同开发的便捷性。

下面是一些比较流行的js代码风格规范：
- standard：https://github.com/feross/standard
- google: http://google-styleguide.googlecode.com/svn/trunk/javascriptguide.xml
- rwaldron: https://github.com/rwaldron/idiomatic.js
- airbnb: https://github.com/airbnb/javascript

### 下面主要对google和airbnb推荐的js风格做一些简单的介绍和对比：

### 命名

-	函数名，变量名，属性名，使用驼峰命名：functionNamesLikeThis, variableNamesLikeThis。
-	构造函数使用帕斯卡命名：FunctionNameLikeThis;
-	命名应具有描述性。

-------

-	airbnb不推荐使用下划线前/后缀

> 为什么？JavaScript 并没有私有属性或私有方法的概念。虽然使用下划线是表示「私有」的一种共识，但实际上这些属性是完全公开的，它本身就是你公共接口的一部分。这种习惯或许会导致开发者错误的认为改动它不会造成破坏或者不需要去测试。

-	google 推荐文件或类中的 私有 属性, 变量和方法名应该以下划线 "_" 开头.


### 变量

-  总是使用 var 来声明变量。

--

- 使用 var 声明每一个变量。
- airbnb 推荐在作用域顶部声明变量。避免变量声明提升相关的问题。
- 最后再声明未赋值的变量。

-- 
- google推荐常量的形式如: NAMES_LIKE_THIS, 即使用大写字符, 并用下划线分隔.


### 分号

- 都推荐始终使用分号，不依赖于隐式插入

> JavaScript 的语句以分号作为结束符, 除非可以非常准确推断某结束位置才会省略分号. 上面的几个例子产出错误, 均是在语句中声明了函数/对象/数组直接量, 但 闭括号('}'或']')并不足以表示该语句的结束. 在 JavaScript 中, 只有当语句后的下一个符号是后缀或括号运算符时, 才会认为该语句的结束.

遗漏分号有时会出现很奇怪的结果, 所以确保语句以分号结束.

```js
// good (防止函数在两个 IIFE 合并时被当成一个参数
;(function () {
  var name = 'Skywalker';
  return name;
})();
```

### 空白

-	airbnb推荐两个空格作为缩进。
-	在大括号前放一个空格。在控制语句（if、while 等）的小括号前放一个空格
-	使用空格把运算符隔开。
-	在文件末尾插入一个空行。
-	链式调用，使用前面的点 . 强调这是方法调用而不是新语句。
-	在函数调用及声明中，不在函数的参数列表前加空格。
-	在块末和新语句前插入空行。划分一组逻辑上相关联的代码片段.


```js
// good
if (isJedi) {
  var a = b + 5;

  // good
  $('#items')
    .find('.selected')
      .highlight()
      .end()
    .find('.open')
      .updateCount();
}

```


### 数组和对象

- 两种风格都推荐使用 Array 和 Object 语法, 而不使用 Array 和 Object 构造器.


```js
// bad
var item = new Object();

// good
var item = {};


// bad
var items = new Array();

// good
var items = [];
```


### 字符串

- 两种风格都推荐使用单引号 '' 包裹字符串。

#### **airbnb**推荐超过 100 个字符的字符串应该使用连接符写成多行。


### 函数

- 永远不要在一个非函数代码块（if、while 等）中声明一个函数，把那个函数赋给一个变量。

### 对象属性

- 使用 . 来访问对象的属性。
- 当通过变量访问属性时使用中括号 []。


### 注释

- 使用 /** ... */ 作为多行注释。google推荐使用jsDoc语法
- 使用 // 作为单行注释。



### 原型

- 给对象原型分配方法，而不是使用一个新对象覆盖原型。覆盖原型将导致继承出现问题：重设原型将覆盖原有原型！

```js
function Jedi() {
  console.log('new jedi');
}

// bad
Jedi.prototype = {
  fight: function fight() {
    console.log('fighting');
  },

  block: function block() {
    console.log('blocking');
  }
};

// good
Jedi.prototype.fight = function fight() {
  console.log('fighting');
};

Jedi.prototype.block = function block() {
  console.log('blocking');
};

```

- 两种风格都认为写一个自定义的 toString() 方法是可以的，但是确保它可以正常工作且不会产生副作用。


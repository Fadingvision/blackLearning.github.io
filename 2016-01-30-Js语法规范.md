---
layout: post
title:  "Js语法规范"
date:   2016-01-30 22:29:29 +0800
category: "javascript"
tags: [javascript]
---


### Js语法规范
------------

##### 1.字符串

1. 使用单引号来包裹字符串。
2. 超过80个字符的字符串应该使用连接符连接，分多行显示。
3. 程序化生成的字符串使用 Array#join 连接而不是使用连接符。

##### 2.函数
1. 永远不要在一个非函数代码块（if、while 等）中声明一个函数，而是把那个函数赋给一个变量。
例如：

```js
// bad
if (currentUser) {
  function test() {
    console.log('Nope.');
  }
}

// good
var test;
if (currentUser) {
  test = function test() {
    console.log('Yup.');
  };
}
```
2. 命名函数表达式会提升变量名，但不会提升函数名或函数体。
3. 函数声明提升它们的名字和函数体。

##### 3.变量
1. 使用 var 声明每一个变量。 这样做的好处是增加新变量将变的更加容易，而且你永远不用再担心调换错 ; 跟 ,。
2. 最后再声明未赋值的变量。当你需要引用前面的变量赋值时这将变的很有用。
3. 在作用域顶部声明变量。这将帮你避免变量声明提升相关的问题。

##### 4.比较运算符
1. if或者ToBoolean 计算真假值时的规则：
- undefined, Null, false, 0, NaN, ''计算为false;
- 对象和其他值被计算为true;

```js
// bad
if (name !== '') {
  // ...stuff...
}

// good
if (name) {
  // ...stuff...
}

```

##### 5.注释
1. 使用 /** ... */ 作为多行注释。
2. 使用 // 作为单行注释。在评论对象上面另起一行使用单行注释。在注释前插入空行。

```js
// bad
function getType() {
  console.log('fetching type...');
  // set the default type to 'no type'
  var type = this._type || 'no type';

  return type;
}

// good
function getType() {
  console.log('fetching type...');

  // set the default type to 'no type'
  var type = this._type || 'no type';

  return type;
}
```

3. 在使用长方法链时进行缩进。在使用长方法链时进行缩进。使用前面的点 . 强调这是方法调用而不是新语句。

```js
// bad
$('#items').
  find('.selected').
    highlight().
    end().
  find('.open').
    updateCount();

// good
$('#items')
  .find('.selected')
    .highlight()
    .end()
  .find('.open')
    .updateCount();
```
4. 在块末和新语句前插入空行。

5. 使用分号。


```js
// good
(function() {
  var name = 'Skywalker';
  return name;
})();

// good (防止函数在两个 IIFE 合并时被当成一个参数
;(function() {
  var name = 'Skywalker';
  return name;
})();
```

##### 6. 命名规则
1. 使用下划线 _ 开头命名私有属性。
2. 使用 _this 保存 this 的引用。

```js
// bad
function() {
  var that = this;
  return function() {
    console.log(that);
  };
}

// good
function() {
  var _this = this;
  return function() {
    console.log(_this);
  };
}
```

##### 7.构造函数	
1.给对象原型分配方法，而不是使用一个新对象覆盖原型。覆盖原型将导致继承出现问题：重设原型将覆盖原有原型！

```js
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
2. 方法可以返回 this 来实现方法链式使用。
3. 模块应该以 ! 开始。这样确保了当一个不好的模块忘记包含最后的分号时，在合并代码到生产环境后不会产生错误。

##### 8.jQuery 
1. 对 DOM 查询使用层叠 $('.sidebar ul') 或 父元素 > 子元素 $('.sidebar > ul')。
2. 对有作用域的 jQuery 对象查询使用 find。

```js
// bad
$('ul', '.sidebar').hide();

// bad
$('.sidebar').find('ul').hide();

// good
$('.sidebar ul').hide();

// good
$('.sidebar > ul').hide();

// good
$sidebar.find('ul').hide();
```

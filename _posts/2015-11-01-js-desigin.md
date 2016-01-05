---
layout: post
title:  "JavaScript设计模式学习笔记"
date:   2015-11-01 14:29:29 +0800
category: "javascript"
tags: [javascript,设计模式]
src: "img/3.jpg"
---

### JavaScript模式学习笔记
----
####一、基本技巧

-  尽量少使用全局变量
-   使用单一var模式，即在函数顶部只用一个var进行多个变量声明； 
-	为了避免变量提升，使用单一var模式；
-	for循环时缓存length，提高速度；
-	for循环遍历数组，for-in遍历对象；
-	不要为内置的构造函数添加原型属性；
-	避免使用隐式类型转换（==），使用===；
-	避免使用eval()；
-	使用parseInt()时指明转换的进制数
-	良好的编码规范和命名规则
-	通过良好的注释提供参考和维护代码
注释eg: 
```js
/**
 * [function description]  函数功能描述
 * @constrctor 用于表示构造函数
 * @namespace namespaceName 用于命名包含所有对象的全局引用的名称
 * @method methodName 定义对象中的方法和方法名
 * @property propertyName 定义对象中的属性名
 * @param  {[type]} paramName   [description]  参数
 * @param  {[type]} paramName   [description]  参数
 * @return {[type]}             [description]  返回值
 */
```
####二、字面量和构造函数
- 可重用的属性和方法都应该放入原型中。
- 创建对象和数组时使用字面量语法。
- 安全的数组检测：
```js
/**
 * 安全的数组检测
 * @param  {unknown}  value 待检测数据
 * @return {Boolean}       是否为数组
 */
function isArray(value) {
	if(typeof Array.isArray === 'undefined') {
		return Object.prototype.toString.call(value) === '[object Array]';
	} else {
		return Array.isArray(value);
	}
}
```
####三、函数
1. **即时函数**
```js
(function(){
	// dosomething
})();

var fnName=function(){
    alert('Hello World');
}();
//函数表达式后面加括号，当javascript引擎解析到此处时能立即调用函数
function fnName(){
    alert('Hello World');
}();
//不会报错，但是javascript引擎只解析函数声明，忽略后面的括号，函数声明不会被调用
function(){
    console.log('Hello World');    
}();
//语法错误，虽然匿名函数属于函数表达式，但是未进行赋值操作，
//所以javascript引擎将开头的function关键字当做函数声明，报错：要求需要一个函数名
```

即时函数能保证全局空间不会被临时变量所污染。
2. **即时对象初始化**
```js
({
	//配置常数
	width:600,
	height:600,
	// 定义方法
	gimmeMax: function() {
		return this.widht + "x" + this.height;
	},
	// 初始化
	init: function() {
		console.log(this.gimmeMax());
	}
}).init();
```
3. **初始化时分支**
eg: 优化事件绑定
```js
// 这样只会在初始化EventUtil时执行条件语句，在绑定事件时不用每次都执行条件查询
var EventUtil = {
	addEvent: null
};
if(typeof window.addEventListener === 'function') {
	EventUtil.addEvent = function(el, type, handler) {
		el.addEventListener(type, handler, false);
	}
}else if(typeof document.attachEvent === 'function') {
	EventUtil.addEvent = function(el, type, handler){
		el.attachEvent('on' + type, handler);
	}
}
```
4. **配置对象**
>当函数的参数过多时，为了提供更整洁的API接口，可以安全忽略可选参数，更加易于阅读和维护，易于添加和删除参数，即可以使用参数对象。
```js
	addPerson(obj){
		// do something...
	}
	var conf = {
		name: "batman",
		firstName: "chris",
		lastName: "bale"
	};
	addPerson(conf);
```
5. **函数柯里化**
>当发现调用同一个函数，且传递的参数绝大多数是相同的时候，就可以对该函数使用柯里化。
```javascript
function schonfinkelize(fn) {
	var slice = Array.prototype.slice,
		stored_args = slice.call(arguments, 1);
	return function() {
		var new_args = slice.call(arguments),
			args = stored_args.concat(new_args);
		return fn.apply(null, args);
	};
}
function add(a, b, c, d, e) {
	return a + b + c + d + e;
}
// 使用示例：schonfinkelize(add, 1, 2, 3)(5, 5);
// 输出16
```
####四、对象创建模式
1.  **命名空间模式**
创建一个全局对象，然后使所有函数和变量成为该全局对象的属性和方法。
```js
var MYOBJ = MYOBJ || {}; // 全局变量全部用大写形式命名
// 避免重复命名的命名函数
MYOBJ.namespace = function (nameString) {
	var parts = nameString.split('.'),
		parent = MYOBJ,
		i;
	if(parts[0] === "MYOBJ") {
		parts = parts.slice(1);
	}
	for(i = 0; i< parts.length; i++) {
		if(typeof parent[parts[i]] === 'undefined') {
			parent[parts[i]]={};		
		}
		parent = parent[parts[i]];
	}
	return parent;
}
```
- 优点：可以避免过多的全局变量，避免命名冲突。
- 缺点：每个函数变量前面都必须加前缀，增加代码量，任何代码都可以修改该全局实例。

 **依赖关系**
在函数或者模块顶部显式地声明依赖的模块。
```js
	var function myFunction() {
		//声明依赖
		var event = MYOBJ.event;
		// 使用依赖关系
		// do something
	}
```
2. 私有属性和方法 
```js
	 //   将私有方法揭示为公有方法
	var myarray;  
	(function(){
		// 私有属性
		var astr = '[object Array]'
		// 私有方法
		function isArray(a) {
			return Object.prototype.toString.call(a) === astr;
		}
	// 公共接口
	myarray = {
		isArray: isArray	
	}
	})();
```
3. **模块模式**
结合命名空间使用：
```js
	var MYOBJ = MYOBJ || {};
	MYOBJ.namespace('MYOBJ.util.array');
	MYOBJ.util.array = (function(){
		// 私有属性
		var astr = '[object Array]'；
		// 私有方法
		function isArray(a) {
			return Object.prototype.toString.call(a) === astr;
		}
		// 公共接口
		return {
			isArray: isArray	
		};
	})();
```
#### 五、代码复用模式
1. **类式继承模式**
- 默认继承模式：
```js
	function inherit(Child, Parent) {
		Child.prototype = new Parent();
	}
```
- 构造函数继承模式
> 缺点是无法从原型中继承任何方法。优点是可以获得父对象自身成员的真实副本，并不会存在子对象意外覆盖父对象的风险。

- 组合继承模式
>组合继承模式缺点是父构造函数被调用了两次，效率低下，且自身的属性会通过构造函数和原型继承两次。

- 共享原型模式
```js
	function inherit(Child, Parent) {
		Child.prototype = Parent.prototype;
	}
``` 
与默认方法相比，这样做的优点是效率比较高（不用执行和建立Parent的实例了），比较省内存。缺点是 Parent.prototype和Child.prototype现在指向了同一个对象，那么任何对Child.prototype的修改，都会反映到Parent.prototype。
- 临时构造函数
```js
	function inherit(Child, Parent) {
		var F = function () {}; // 临时构造函数
		F.prototype = Parent.prototype;
		Child.prototype = new F();
		Child.uber = Parent.prototype; // 储存超类
		Child.prototype.constructor = Child; // 重置构造函数指针
	}
``` 
2.**原型继承**（无类继承模式）
```js
	function object(parent){
		function F() {};
		F.prototype = parent;
		return new F();
	}
	var parent = {
		name: "daddy"
	};
	var child = object(parent);
``` 
>这种继承方式会共享相应的值，就像默认模式一样，对子类型的修改都会反应到父类型上。

3. **寄生继承**
```js
	function createAnother(parent){
		var child = object(parent);
		return child;
	}
```
>适合对象不是自定义类型和构造函数的情况。

4. **寄生组合式继承**(引用类型最理想的继承范式!)
>在组合式继承的基础上优化，利用寄生继承继承父类的原型，使得继承时只调用一次父类构造函数。
```js
	function inheritPrototype(child, parent){
		// ES5有原生object.create方法代替object方法
		var prototype = object(parent.prototype);
		prototype.constructor = child;
		child.prototype = prototype;
	}

// 在组合继承时将child.prototype = new Parent(); 改成inheritPrototype(child, parent); 
```
####六、设计模式
1. 单体模式
单体模式的定义是产生一个类的唯一实例.
```js
var singleton = function( fn ){
    var result;
    return function(){
        return result || ( result = fn .apply( this, arguments ) );
    }
}
var createMask = singleton( function(){
	return document.body.appendChild( document.createElement('div') );
});
```
2. 模块模式
```js
	var myNamespace = (function () {
  var myPrivateVar, myPrivateMethod;
  // A private counter variable
  myPrivateVar = 0;
  // A private function which logs any arguments
  myPrivateMethod = function( foo ) {
      console.log( foo );
  };
	return {
	    // A public variable
	    myPublicVar: "foo",
	    // A public function utilizing privates
	    myPublicFunction: function( bar ) {
      // Increment our private counter
      myPrivateVar++;
      // Call our private method using bar
      myPrivateMethod( bar );
    }
  };
})();
```
>模块模式相对于真正的封装概念更清晰，其次，模块模式支持私有数据-因此，在模块模式中，公共部分代码可以访问私有数据，但是在模块外部，不能访问类的私有部分。
模块模式的缺点是因为我们采用不同的方式访问公有和私有成员，因此当我们想要改变这些成员的可见性的时候，我们不得不在所有使用这些成员的地方修改代码。

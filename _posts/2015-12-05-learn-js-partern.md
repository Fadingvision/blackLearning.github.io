---
layout: post
title:  "JavaScript设计模式学习笔记"
date:   2015-12-04 14:29:29 +0800
category: "javascript"
tags: [javascript,设计模式]
src: "img/3.jpg"
---


##JavaScript设计模式学习笔记
####一、富有表现力的javascript
- 函数运行在定义它的作用域中，而不是调用它的作用域中，利用这一点和闭包联合使用，就能把变量保存在匿名函数中加以保护。
####二、接口
1. 模仿接口 
- 用注释模仿接口
- 用属性检查模仿接口
- 用鸭式辨型模仿接口

```js
// 检查接口存在与否
// @param {string} name    接口名称
// @param {Array} methods 接口方法
function Interface(name, methods) {
	if(arguments.length !== 2){
		throw new Error('Interface constructor called with ' + arguments.length + 'arguments,but expected exactly 2.');
	}

	this.name = name;
	this.methods = [];
	for (var i = 0; i < methods.length; i++) {
		if (typeof methods[i] !== 'string') {
			throw new Error('Interface constructor expects method names to be passed in as a string.');
		} 
		this.methods.push(methods[i]);
	}
}

```
```js

// 检查接口存在与否
// @param  {[type]} object 实例对象
// @param  {[type]} object 接口名称
Interface.ensureImplements = function(object) {
	if(arguments.length < 2){
		throw new Error('Function Interface.ensureImplements called with ' + arguments.length + 'arguments,but expected at least 2.');
	}
	for (var i = 1; i < arguments.length; i++) {
		var interface = arguments[i];
		if(interface.constructor !== Interface) {
			throw new Error('Function Interface.ensureImplements expects arguments'+ 'two and above to be instances of Interface.');
		}

		for (var j = 0; j < interface.methods.length; j++) {
			var method = interface.methods[j];

			if(!object[method] || typeof object[method] !== 'function') {
				throw new Error('Function Interface.ensureImplements: object' + 'does not inplement tht' + interface.name + 'interface.method' + method + ' was not found');
			}
		}
	}
};
```
####三、封装和信息隐藏
1. 创建对象的基本模式
- 门户大开型对象

```js
function Book(isbn,title,author){}
Book.prototype.method = function() {};
```
- 使用命名规范区别公私有成员
- 在私有属性和方法名前面加上 _ 线，表明私有特点。
- 作用域，嵌套函数，闭包
返回一个内嵌函数，是创建闭包的常用手段
####四、继承
- 采用原型继承时，需要注意对子类型的读写可能不一致，任何对子类型的修改可能都反映到父类上。
- 原型继承更能节约内存。
- **继承与封装：**
子类的实例方法都不能通过继承的特权方法去访问父类的私有变量。
- 掺元类
如果不想继承父元素的全部方法(重复代码)，而只是想重用其中的某些方法。可以用掺元类：先创建一个具有各种通用方法的类，在利用它去扩充其他的类。（适用于类与类之间差别较大时使用，否则使用类式继承和原型继承更为恰当。）

```js
function Mixin() {};
Mixin.prototype = {
	method1:function(){},
	method2:function(){},
	....
}

function Myclass(){};
augument(Myclass,Mixin,'method2'); //继承Mixin的Method2方法
new Myclass().method2()   // 调用Method2方法

// 继承其他类的方法
function augment(recivingClass, givingClass, methodName) {
	if(arguments[2]){
		for (var i = 2; i < arguments.length; i++) {
			recivingClass.prototype[arguments[i]] = givingClass.prototype[arguments[i]];
		};
	}else {
		for(methodName in givingClass.prototype) {
			if(!recivingClass.prototype[methodName]) {
				recivingClass.prototype[methodName] = givingClass.prototype[methodName];
			}
		}
	}
}
```
####五、单体模式
- 单体模式可以用来划分命名空间，以减少网页中的全局变量，把代码组织的更为一致，从而使其更容易阅读和维护。
单体用来划分命名空间并将一批相关方法和属性组织在一起的对象。
- 拥有私有成员的单体

```js
var MyNameSpace = {};
MyNameSpace.Singleton = (function(){
	// pravite members.
	var ... //私有变量必须用var 声明
	// public members.
	return {
		publicAttribute: xxx,
		publicMethod: function(){}
	}
})();
```
- 惰性实例单体（lazy loading，需要时在加载

```js
var MyNameSpace = {};
MyNameSpace.Singleton = (function(){
	var uniqueInstance; //表明单体是否已经被实例化过
	function constructor(){
		// pravite members.
		var praviteAttribute； //私有变量必须用var 声明
		// public members.
		return {
			publicAttribute: xxx,
			publicMethod: function(){}
		}
	}
return {
	getInstance:function() {
		if(!uniqueInstance){
			uniqueInstance = constructor();
		}
		return uniqueInstance;
	}
}
})();
// 调用方法改为：MyNameSpace.Singleton.getInstance().publicMethod()
```
#### 六、工厂模式
1. 简单工厂模式把成员对象的**创建工作转交给一个外部对象**，该外部对象可以是一个简单的命名空间，也可以是一个实例。
2. 真正的工厂模式是将**其成员对象的实例化推迟到子类中进行的类**。
3. 工厂模式的主要好处在于消除对象之间的**耦合**，通过使用工厂模式，可以把所有实例化代码集中在一个位置。
#### 七、桥接模式
1. 桥接模式的作用在于**将抽象和其实现隔离开来，以便二者独立变化**。
2. 桥接模式可以用来连接公开的API代码和私有的代码（特权函数）。
3. 让接口可桥接，抽象函数功能。
#### 八、门面模式
- 简化类的接口，如常用的setCss函数，event处理函数，把浏览器差异封装起来，提供便利的接口，提高编程效率。
#### 九、适配器模式
- 用于不同接口之间的转换，衔接。
#### 十、亨元模式
- 用于解决因创建大量对象而累及内存性能的问题的优化模式。
- 把每个对象的数据转化成外部数据，将其作为参数提供给各个方法。
- 使用方法：
 1. 尽可能的删除该类的属性（每个实例都不同的属性），这些参数应该由管理器添加到该类的各个方法
2. 创建一个用来控制该类的实例化工厂。例如一个对象来保存每一个这类对象的引用，并以用生成这些对象的参数的唯一组合来作为他们的索引。
3. 创建一个用来保存外在数据的管理器。
- 使用条件：
1. 网页中有大量资源密集型对象。
2. 该对象中所保存的数据中至少有一部分可以被转化成外在函数分离出来。
3. 将数据分离出去之后，独一无二的对象的数目较少。  
- 如果说实例对象在页面不止一处被使用，可以创建函数检查实例的使用状态，把未使用的对象拿来使用，避免创建多个重复实例。
#### 十、代理模式
- 虚拟代理模式用于控制那种创建开销很大的本体的访问，它会把本体的实例化推迟到有方法被调用的时候。
- 创建虚拟代理模式的通用方法：

```javascript
// 虚拟代理
function DynamicProxy() {
	this.args = arguments;
	this.initialized = false;
	var that = this;
	// 触发初始化 
	addEvent(parent, type, that._initialize);
}
DynamicProxy.prototype = {
	// 初始化（本体实例化）
	_initialize: function() {
		this.parent = new Parent(this.args);
		var that = this;
		this.interval = setInterval(function(){that._checkInitialization();},100);
	},
	// 检查初始化
	_checkInitialization:function() {
		if (this.parent.parentMethod !== null) {
			clearInterval(this.interval);
			this.initialized = true;
		}
	},
	// 如果初始化完成，调用本体方法
	method: function(args) {
		if(!this.initialized) {
			return;
		}
		return this.parent.method(args);
	}
};
```
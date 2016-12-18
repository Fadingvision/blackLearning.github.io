---
layout: post
title:  "编写高质量JavaScript的有效方法"
date:   2015-12-08 14:29:29 +0800
category: javascript
tags: [javascript]
src: "img/2.jpg"
---
###编写高质量JavaScript的有效方法
####一、js的特别之处
1. 浮点数计算不精确，应该尽量转为整数进行计算
2. **当心强制的类型转换。**
 NaN是js中唯一一个不等于自身的值，可以利用这一点来检测NaN.
js中的七个假值：false,0,-0,null,undefined,NaN,"".
3. 当参数类型不同时， == 运算符会对参数用一套难以理解的隐式强制转换的规则进行转换，所以应尽量使用 === 运算符，比较不同类型的值时，先进行手动的转换后在进行比较。
4. 分号插入规则
- 分号仅在}标记之前、一个或多个换行之后和程序输入的结尾插入
- 分后仅在后面的输入标记不能解析时插入
- for循环头部var i=0之后必须显式的插入分号
- 在return , throw, break, continue, ++ ,-- 的参数之前绝对不能换行，否则会在换行前强制插入分号
>如果下一条语句以(, {,  +,  -. / 开始时，前一行语句不能省略分号，否则会视为同一行语句执行。

####二、变量作用域
1. 闭包的三个特性
- js允许你应用在当前函数外定义的变量
- 即时外部函数已经返回，当前函数仍然可以引用外部函数中定义的变量
- 闭包可以更新外部变量的值
####三、使用函数
1. 永远不要修改arguments对象
2. 使用bind方法创建绑定到适当接受者的函数

```js
function bind(fn, context) {
	return function() {
		return fn.apply(context, arguments);
	};
}
```
3. 避免使用函数对象的toString()方法
4. 避免使用非标准的arguments.callee和arguments.callee属性
####四、对象和原型
1. 使用Object.getPrototypeOf(obj)函数而不是obj.\_proto_来检测原型
2. 不要修改\_proto_属性
3. 使用闭包来存储私有数据
4. 继承时使用object.create(parent.prototype)来构造子类的原型，以避免调用父类的构造函数
5. 不要重用父类的属性名（容易引发冲突）
6. 不要去继承内置的Array、Function等内置的标准类
####五、数组与字典
1. 属性枚举时使用hasOwnProperty过滤原型属性，防止原型污染。
为了避免hasOwnProperty被意外覆盖，可以预先缓存hasOwn方法或者直接在原型中加入hasOwn方法。

```js
var hasOwn = {}.hasOwnProperty;
```
2. 因为for...in循环无法保证循环顺序，所以用数组而不是字典来存储有序集合，使用for循环循环数组。
3. 绝对不要在Object.prototype中增加可枚举的属性
4. 不要在枚举时修改枚举对象
5. ES5中Array自带的foreach,map,filter等方法优于for循环，但如果需要提前终止循环还是推荐使用传统的循环。
####六、库和API设计
1. 接口设计为接受关键字参数的选项对象，使用extend合并默认参数对象和用户写入的参数对象。
2. 避免过度的强制转换，考虑使用防御性监视非预期的输入。
3. 支持方法链.
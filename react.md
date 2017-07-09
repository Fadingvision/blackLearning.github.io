# React

## 全局模块系统

```js
var babelOpts = {
  plugins: [
    [babelPluginModules, {
      map: Object.assign(
        {},
        require('fbjs/module-map'),
        {
          'object-assign': 'object-assign',
        }
      ),
    }],
  ],
};
```

> global module system

react打包的时候采用了rewrite-modules这个babel plugin,
从而使得在引用模块的时候，不用考虑模块的路径，直接require模块的
名字即可。

这个插件依赖一个fbjs维护的模块映射表，babel转换的时候从而可以在这张表中查找到对应的模块位置并替换掉原来的模块路径，如果没有找到，则默认为本地模块，而最后打包的模块路径全被扁平化掉了，所以直接插入`./`来引入模块。

-----

## JSX && React Elements
通常我门在写react的时候习惯用jsx语法，但jsx实际上还是createElement的语法糖。下面可以看到一个最简单的组件是如何被转换为es5的方法的，其中最主要的函数便是createElement方法。

```js
function hello(props) {
  return <div {...props} a="1">Hello worldd!</div>;
}
```

> => 

```js
"use strict";

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function hello(props) {
  return React.createElement(
    "div",
    _extends({}, props, { a: "1" }),
    "Hello worldd!"
  );
}
```

### __createElement()__

> 不同于浏览器DOM元素,react Element是纯对象和创建很便宜。

在一个实际的dom节点中，我们有几种可以选择的东西：

1.　该节点的类型(div, span, p...)
2. 该节点的属性(attributes)
3. 该节点的事件绑定（onclick）
4. 该节点的子元素

同理：　我们要通过reactElements来创建一个react Element,
同样需要这几个元素。

1. type: 可以接受一个dom标签，或者React Element(一个class, 或者function ).

如果element类型为一个user-defined Component,
则用其defaultProps中的默认值覆盖写入props对象的
空值。


2. config: 标识了React Element中可以接受的props,　这个props对象，可以包含所有的js数据类型.

保留字props：

__ref__: 用来对react实例进行引用（user-defined 状态组件）或者拿到真实的dom 元素节点对象(dom 类型的组件)。

__key__: 用来对每个字节点进行唯一标识，帮助react在重渲染的时候识别哪些组件是真正的改变了.


```js
<!-- 剥离保留字 -->
if (config != null) {
  if (hasValidRef(config)) {
    ref = config.ref;
  }
  if (hasValidKey(config)) {
    key = '' + config.key;
  }

  self = config.__self === undefined ? null : config.__self;
  source = config.__source === undefined ? null : config.__source;
  // Remaining properties are added to a new props object
  for (propName in config) {
    if (
      hasOwnProperty.call(config, propName) &&
      !RESERVED_PROPS.hasOwnProperty(propName)
    ) {
      props[propName] = config[propName];
    }
  }
}
```

3. childrens: 该节点的子节点(字符串或者一个或多个react Elements, 如果没有子节点，则该参数为空。)

通过...children剥离出后面的参数children，并放于props中。

__Element Tree__

```javascript
// 为了对React ELement的类型进行标识，这里用了
Symbol.for('react.element')，　Symbol.for(string)会在Symbol对象中搜索名为string的Symbol值，如果找到该值，则返回，如果没有，则返回一个新的Symbol值。

这保证了$$typeof属性值的唯一性。


var REACT_ELEMENT_TYPE =
  (typeof Symbol === 'function' && Symbol.for && Symbol.for('react.element')) ||
  0xeac7;

var element = {
  // This tag allow us to uniquely identify this as a React Element
  $$typeof: REACT_ELEMENT_TYPE,

  // Built-in properties that belong on the element
  type: type,
  key: key,
  ref: ref,
  props: props,

  // Record the component responsible for creating this element.
  _owner: owner
};
```

将这些参数递归的组合完毕之后，一个基本的element 对象tree就存在了，剩下的就交给reactDOM去渲染了。

__createFactory()__

### Transforming Elements
__cloneElemets__
__isValidElements__
__React.children__ 

### Virtual Dom  (React Only Updates What's Necessary)

### key (What does the key do?)

------

## 组件系统







































__React.Component__
__React.PureComponent__

### setState(Updating the Rendered Element)

### 生命周期

### 事件系统(表单元素)

### refs

### context

------

## Renderers

### ReactDOM



----------

--------

# 服务端渲染　

# React Native


























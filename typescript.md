# TypeScirpt 小记

### 基础类型:

* Boolean
* Number
* String
* Array
* Object
* Null
* Undefined
* Tuple: 可以知道数组内不同元素的类型的数组.
* Enum
* Any
* Void
* Never

### Interfaces

所有的相同的Interface的声明都会最终合并在一起，因此如果你想在一个已经声明了的Interface上继续添加属性的话，可以继续声明该Interface即可。

* optional properties

`x?: Number;`

* readonly properties: 属性使用 readonly, 变量使用`const`

`readyonly x: Number;`
`ReadonlyArray<T>`

* function types

表示一个可被调用的类型注解

```typescript
interface SearchFunc {
  (source: string, subString: string): boolean;
}
```

* class Types

```ts
interface Shape {
  color: string;
}

interface PenStroke {
  penWidth: number;
}

interface Square extends Shape, PenStroke {
  sideLength: number;
}

let square = <Square>{};
square.color = 'blue';
square.sideLength = 10;
square.penWidth = 5.0;
```

### Generics

泛型是在定义一个类型或者接口的时候，我们不知道其中某些参数的具体类型，但是又想对其进行某种约束，这时候就可以用泛型(常常是一个大写字母)来代替表示该类型。T或者任意的大写字母被叫做泛型模板，会在运行时而不是编译时被代替。

当你使用简单的泛型时，泛型常用 T、U、V 表示。如果在你的参数里，不止拥有一个泛型，你应该使用一个更语义化名称，如 TKey 和 TValue （通常情况下，以 T 做为泛型前缀也在如 C++ 的其他语言里做为模版。）

* 泛型函数

```ts
function identity(arg: T): T {
  return arg;
}

// 可选：把类型作为参数，从而指定该函数的参数和返回值都必须是该类型。
function identity<T>(arg: T): T {
  return arg;
}

// 传入string作为类型，从而指定该函数的参数和返回值都必须是字符串。
let output = identity<string>('myString');
```

* 泛型 interface

```ts
interface GenericIdentityFn {
  <T>(arg: T): T;
}

// 把类型参数提到interface层面可以当参数传入
interface GenericIdentityFn<T> {
  (arg: T): T;
}

function identity<T>(arg: T): T {
  return arg;
}

let myIdentity: GenericIdentityFn<number> = identity;
```

* 泛型类

泛型类和泛型 interface 类似：

```js
class GenericNumber<T> {
    zeroValue: T;
    add: (x: T, y: T) => T;
}

let myGenericNumber = new GenericNumber<number>();
myGenericNumber.zeroValue = 0;
myGenericNumber.add = function(x, y) { return x + y; };
```

为了让泛型可以工作在一些特殊的情况，引入泛型约束。

```js
// 约束该泛型必须有length属性
interface Lengthwise {
  length: number;
}

function loggingIdentity<T extends Lengthwise>(arg: T): T {
  // 这样在使用length属性的时候，ts就不会提示错误
  // 否则ts就会由于不知T是什么类型，从而提示length属性错误
  console.log(arg.length);
  return arg;
}
```

### 枚举

枚举用来定义一种常量类型，帮助使用这个枚举中的值，可以有效的避免硬编码，
并且当使用了超出枚举范围内的值时，方便的提示错误。

```ts
enum Response {
  No = 0,
  Yes = 1,
}
```
反向隐射：

```ts

enum isSuccess {
  0 = 'no',
  1 = 'yes'
};

isSucess[0] // no
isSucess[no] // 0

```

常量枚举：

```ts
const enum Tristate {
  False,
  True,
  Unknown
}

const lie = Tristate.False; // goes => const lie = 0;
```


### 类型进阶

* 类型断言：

```ts
let pet = getSmallPet();
// 当不能确定一个变量的类型，需要对变量类型进行断言，这样ts才不会抛出错误
if ((<Fish>pet).swim) {
    (<Fish>pet).swim();
}
else {
    (<Bird>pet).fly();
}
```
然而，当你在 JSX 中使用 <Fish> 的断言语法时，这会与 JSX 的语法存在歧义：

因此可以使用`(pet as Fly).fly()`的as语法来断言。


* 类型守护：

```ts

function isFish(pet: Fish | Bird): pet is Fish {
  return (<Fish>pet).swim !== undefined;
}

function padLeft(value: string, padding: string | number) {
  if (isNumber(padding)) {
      return Array(padding + 1).join(" ") + value;
  }
  if (isString(padding)) {
      return padding + value;
  }
  throw new Error(`Expected string or number, got '${padding}'.`);
}
```


* 类型别名

```ts
type Name = string;
type NameResolver = () => string;
type NameOrResolver = Name | NameResolver;
function getName(n: NameOrResolver): Name {
    if (typeof n === "string") {
        return n;
    }
    else {
        return n();
    }
}
```

### Types vs Interface

types在声明联合类型时很有用，而Interface能更好的用于声明字典类型，以便后续的`实现`和`继承`。

类型工具：

- Omit: 从类型中移除某个属性
- Partial: 允许使用类型中的部分类型
- typeof: 从变量中读出其类型(通常由ts推断得出)
- &: 交叉类型
- |: 联合类型

从数组中自动生成联合类型：

```ts
// 用于创建字符串列表映射至 `K: V` 的函数
function strEnum<T extends string>(o: Array<T>): { [K in T]: K } {
  return o.reduce((res, key) => {
    res[key] = key;
    return res;
  }, Object.create(null));
}

// 创建 K: V
const Direction = strEnum(['North', 'South', 'East', 'West']);

// 创建一个类型
type Direction = keyof typeof Direction;

// 简单的使用
let sample: Direction;

sample = Direction.North; // Okay
sample = 'North'; // Okay
sample = 'AnythingElse'; // ERROR!
```

- as: 类型推断(当你比ts编译器更懂该变量的类型时，可以强制指定该变量的类型，防止编译报错)
- declare module: 可以用于为第三方模块添加类型, 或者覆盖第三方的类型

```ts
// my-typings.ts
declare module 'plotly.js' {
  interface PlotlyHTMLElement {
    removeAllListeners(): void;
  }
}

// MyComponent.tsx
import { PlotlyHTMLElement } from 'plotly.js';
import './my-typings';
const f = (e: PlotlyHTMLElement) => {
  e.removeAllListeners();
};
```


### .d.ts

## React + TS

常用的React+ts应用:

```tsx
import React, { Component, useState, useRef } from 'react';
import logo from './logo.svg';
import './App.css';

interface HelloProps {
  message: string;
}

interface AsyncTask {
  (aPromise: Promise<any>) : Promise<any>;
}


// custom hook
export function useLoading() {
  const [isLoading, setState] = useState(false);
  const load: AsyncTask = (asyncTask) => {
    setState(true);
    return asyncTask.finally(() => setState(false));
  }
  // 当一个数组有两种类型的时候，为了避免类型推断，这里显式定义类型。
  return [isLoading, load] as [boolean, AsyncTask];
}


// 语法更冗长，但是没有突出的优点，优先使用普通函数语法。
const HelloWorld: React.FunctionComponent<HelloProps> = (props) => {

  const [val, toggle] = useState(false); 
  const inputRef = useRef<HTMLInputElement | null>(null); 


  return <div>
    <input type="text" ref={inputRef} />
    <span onClick={() => inputRef.current && inputRef.current.focus()}>{props.message}</span>
  </div>;
}

// 为app.props声明defaultProps和其他props的联合类型
type AppProps = typeof App.defaultProps & {
  prefix?: string,
}

// 这里forwardRef是一个泛型函数，
// 第一个泛型参数标识接收的组件类型是一个函数式组件，并且它的类型必须是HTMLButtonElement
// 第二个泛型参数限制了该组件的props, propTypes, defaultProps必须是ButtonProps类型
// 两个参数同时限制了返回的组件的props(如果不为空)必须是HTMLButtonElement类型的ref属性和ButtonProps的属性
type ButtonProps = React.PropsWithChildren<{ type: 'submit' | 'button' }>;
const FancyButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => (
    <button ref={ref} type={props.type}>
      {props.children}
    </button>
  )
);

class App extends Component<AppProps> {
  private buttonRef = React.createRef<HTMLButtonElement>();

  static defaultProps = {
    name: 'world'
  }

  // 自动bind this, 声明该函数是一个MouseEventHandler, 并且e.target是HTMLAnchorElement
  onClick: React.MouseEventHandler<HTMLAnchorElement> = e => {
    this.setState({});
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <HelloWorld message="123" />
          <a
            className="App-link"
            onClick={this.onClick}
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FancyButton type="button" ref={this.buttonRef}>
              Learn React
            </FancyButton>
          </a>
        </header>
      </div>
    );
  }
}

export default App;
```





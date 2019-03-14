## TypeScirpt 初体验

#### 基础类型:

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

#### Interfaces

* optional properties

`x?: Number;`

* readonly properties: 属性使用 readonly, 变量使用`const`

`readyonly x: Number;`
`ReadonlyArray<T>`

* function types

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

#### Generics

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

#### 枚举

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


#### 类型进阶


* 使用 & 来组合类型
* 使用 number | string | boolean 来表明几种类型之一

```
let personProps: keyof Person; // 'name' | 'age'
```

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


#### .d.ts


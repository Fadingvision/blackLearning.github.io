### htm 源码分析

#### feature: 用ES6的tag template代替jsx

- 无需编译, 使用es6的`tag template`, 浏览器直接支持(生产环境建议还是用babel编译, 否则render时需要编译, 影响性能)

```js
const CACHE = {};

const stringify = JSON.stringify;

export default function html(statics) {
  let key = '.';
  for (let i=0; i<statics.length; i++) key += statics[i].length + ',' + statics[i];
  // 用组件的html文本作为键值, 缓存计算结果, 避免重复计算
  const tpl = CACHE[key] || (CACHE[key] = build(statics));

  // eslint-disable-next-line prefer-rest-params
  return tpl(this, arguments);
}

const TAG_START = 60; // <
const TAG_END = 62; // >
const EQUALS = 61;
const QUOTE_DOUBLE = 34;
const QUOTE_SINGLE = 39;
const TAB = 9;
const NEWLINE = 10;
const RETURN = 13;
const SPACE = 32;
const SLASH = 47;

const MODE_WHITESPACE = 0;
const MODE_TEXT = 1;
const MODE_TAGNAME = 9;
const MODE_ATTRIBUTE = 13;
const MODE_SKIP = 47;

/** Create a template function given strings from a tagged template. */
const build = (statics) => {
  // 初始化模式为空格模式
  let mode = MODE_WHITESPACE;
  let out = 'return ';
  let buffer = '';
  let field = '';
  let hasChildren = 0;
  let props = '';
  let propsClose = '';
  let spreadClose = '';
  let quote = 0;
  let slash, charCode, inTag, propName, propHasValue;

  // 提交, 表示一个字符串或者节点名称已经读取完毕, 此时需要通过commit 来进行处理, 
  // 按照此时的模式方法来将buffer的值 按照对应的模式插入out函数体中.
  const commit = () => {
    // 不再标签内, 即为子元素模式, 则需要将buffer或者field加入最近的h函数作为第三个参数.
    if (!inTag) {
      if (field || (buffer = buffer.replace(/^\s*\n\s*|\s*\n\s*$/g,''))) {
        if (hasChildren++) out += ',';
        out += field || stringify(buffer);
      }
    }
    // 标签模式
    else if (mode === MODE_TAGNAME) {
      // 由于一个组件是单标签模式, 则一个组件在最终转换形式为一个h函数, 因此函数参数全部通过`,`分隔
      if (hasChildren++) out += ',';
      // 此时构建函数体, 执行h函数(一般为react.createElement 或者 preact的 h函数, 即hyperscript函数)
      // 传入第一个参数, 即为 组件或者html标签的名称
      out += 'h(' + (field || stringify(buffer));
      // 标签参数读取完毕之后, 重置为空格模式
      mode = MODE_WHITESPACE;
    }
    // 简单属性模式<div a="b"></div> 或者 扩展属性模式(<div ...${props}>xxx</div>)
    else if (mode === MODE_ATTRIBUTE || (mode === MODE_WHITESPACE && buffer === '...')) {
      // 扩展属性模式, 将其他props和扩展Props通过oBject.assign组合起来
      if (mode === MODE_WHITESPACE) {
        if (!spreadClose) {
          spreadClose = ')';
          if (!props) props = 'Object.assign({}';
          else props = 'Object.assign(' + props;
        }
        props += propsClose + ',' + field;
        propsClose = '';
      }
      // 在简单模式下,将 props构造成一个对象
      else if (propName) {
        if (!props) props += '{';
        else props += ',' + (propsClose ? '' : '{');
        propsClose = '}';
        // 拼接属性值和属性名为对象形式. 属性值可以为简单字符串, 或者js变量, 或者为true值.
        props += stringify(propName) + ':';
        props += field || ((propHasValue || buffer) && stringify(buffer)) || 'true';
        propName = '';
      }
      propHasValue = false;
    }

    else if (mode === MODE_WHITESPACE) {
      mode = MODE_ATTRIBUTE;
      // we're in an attribute name
      propName = buffer;
      buffer = field = '';
      commit();
      mode = MODE_WHITESPACE;
    }
    // 每次commit 之后, buffer的值通过某种形式传入out函数体中, 因此清空缓存buffer.
    buffer = field = '';
  };

  /*
    html tagged template:

    html`
      <div class="app">
        <ul>
          ${todos.map(todo => html`
            <li>${todo}</li>
          `)}
        </ul>
        <button onClick=${() => this.addTodo()}>Add Todo</button>
      </div>
    `
  
     => 

    $[0]/statics:
     0: "↵          <div class="app">↵            <ul>↵              "
     1: "↵            </ul>↵            <button onClick="
     2: ">Add Todo</button>↵          </div>↵        "
   */

  for (let i=0; i<statics.length; i++) {
    if (i > 0) {
      if (!inTag) commit();
      field = `$[${i}]`;
      commit();
    }
    // 依次遍历每个字符
    for (let j=0; j<statics[i].length; j++) {
      charCode = statics[i].charCodeAt(j);

      // 如果不是在html<>标签中
      if (!inTag) {
        if (charCode === TAG_START) {
          // 这里有可能是闭合标签的tag_start, 所以要处理一下Buffer子元素
          commit();
          // 设置为在标签中
          inTag = 1;
          // 每次遇到新的开始标签, 则将其props清空
          spreadClose = propsClose = props = '';
          slash = propHasValue = false;
          // 设置模式为标签模式, 此时如果遇到空格, 进入commit , 所以逻辑一般是先设置模式, 
          // 下一次循环的时候在进行该模式的commit
          mode = MODE_TAGNAME;
          continue;
        }
      }
      // 特殊字符的处理
      else {
        // 跳过单引号和双引号, 也支持不写引号的属性值
        if (charCode === QUOTE_SINGLE || charCode === QUOTE_DOUBLE) {
          if (quote === charCode) {
            quote = 0;
            continue;
          }
          if (quote === 0) {
            quote = charCode;
            continue;
          }
        }
        
        if (quote === 0) {
          switch (charCode) {
            // 结束标签
            case TAG_END:
              // 执行commit, 将之前缓存的Props, buffers作为属性拼接起来
              commit();
              // 如果不是自闭合标签
              if (mode !== MODE_SKIP) {
                // 如果没有属性值, 则表示h函数的第二个参数为空, 传入null
                if (!props) {
                  out += ',null';
                }
                // 否则加上属性值, 对象闭合标签, 以及Object.assign调用闭合标签
                else {
                  out += ',' + props + propsClose + spreadClose;
                }
              }
              // 如果是闭合标签, 则表示该标签已经组合完毕, 直接添加函数调用闭合标签
              if (slash) {
                out += ')';
              }
              // 重置标签flag
              inTag = 0;
              // 清空props
              props = '';
              // 默认进入文本模式
              mode = MODE_TEXT;
              continue;
            case EQUALS:
              // 在标签中发现`=`号, 进入属性模式
              mode = MODE_ATTRIBUTE;
              // 先设置该属性是有值属性<a class="asd">, 而不是<a disabled>这种无值属性
              propHasValue = true;
              // 此时缓存的字符串为属性名
              propName = buffer;
              // 字符串清空,用于继续缓存属性值
              buffer = '';
              continue;
            case SLASH:
              if (!slash) {
                slash = true;
                // </foo>
                // 检测到`/`号, 并且`/`符号前没有任何字符, 说明进入结束标签
                if (mode === MODE_TAGNAME && !buffer.trim()) {
                  buffer = field = '';
                  mode = MODE_SKIP;
                }
              }
              continue;
            case TAB:
            case NEWLINE:
            case RETURN:
            case SPACE:
              // <a disabled>
              // 遇到空格, 先将之前缓存的buffer进行处理
              commit();
              // 在标签中检测到空格, 说明进入空格模式
              mode = MODE_WHITESPACE;
              continue;
          }
        }
      }
      // 缓存当前字符串(除了`<`, `>`, `=`, `/`, `tab`, `\n`, 'return', ' '等特殊字符串)
      buffer += statics[i].charAt(j);
    }
  }
  commit();

  return Function('h', '$', out);
};

```

#### 生产环境: `babel-plugin-htm`


```js
import htm from 'htm';

/**
 * @param {Babel} babel
 * @param {object} options
 * @param {string} [options.pragma=h]  JSX/hyperscript pragma.
 * @param {string} [options.tag=html]  The tagged template "tag" function name to process.
 * @param {boolean} [options.monomorphic=false]  Output monomorphic inline objects instead of using String literals.
 * @param {boolean} [options.useBuiltIns=false]  Use the native Object.assign instead of trying to polyfill it.
 * @param {boolean} [options.variableArity=true] If `false`, always passes exactly 3 arguments to the pragma function.
 */
export default function htmBabelPlugin({ types: t }, options = {}) {
  const pragma = options.pragma===false ? false : dottedIdentifier(options.pragma || 'h');
  const useBuiltIns = options.useBuiltIns;
  const inlineVNodes = options.monomorphic || pragma===false;

  function dottedIdentifier(keypath) {
    const path = keypath.split('.');
    let out;
    for (let i=0; i<path.length; i++) {
      const ident = propertyName(path[i]);
      out = i===0 ? ident : t.memberExpression(out, ident);
    }
    return out;
  }

  function patternStringToRegExp(str) {
    const parts = str.split('/').slice(1);
    const end = parts.pop() || '';
    return new RegExp(parts.join('/'), end);
  }
  
  function propertyName(key) {
    if (key.match(/(^\d|[^a-z0-9_$])/i)) return t.stringLiteral(key);
    return t.identifier(key);
  }
  
  function stringValue(str) {
    if (options.monomorphic) {
      return t.objectExpression([
        t.objectProperty(propertyName('type'), t.numericLiteral(3)),
        t.objectProperty(propertyName('tag'), t.nullLiteral()),
        t.objectProperty(propertyName('props'), t.nullLiteral()),
        t.objectProperty(propertyName('children'), t.nullLiteral()),
        t.objectProperty(propertyName('text'), t.stringLiteral(str))
      ]);
    }
    return t.stringLiteral(str);
  }
  
  function createVNode(tag, props, children) {
    // Never pass children=[[]].
    if (children.elements.length === 1 && t.isArrayExpression(children.elements[0]) && children.elements[0].elements.length === 0) {
      children = children.elements[0];
    }

    if (inlineVNodes) {
      return t.objectExpression([
        options.monomorphic && t.objectProperty(propertyName('type'), t.numericLiteral(1)),
        t.objectProperty(propertyName('tag'), tag),
        t.objectProperty(propertyName('props'), props),
        t.objectProperty(propertyName('children'), children),
        options.monomorphic && t.objectProperty(propertyName('text'), t.nullLiteral())
      ].filter(Boolean));
    }

    // Passing `{variableArity:false}` always produces `h(tag, props, children)` - where `children` is always an Array.
    // Otherwise, the default is `h(tag, props, ...children)`.
    if (options.variableArity !== false) {
      children = children.elements;
    }

    return t.callExpression(pragma, [tag, props].concat(children));
  }
  
  function spreadNode(args, state) {
    // 'Object.assign({}, x)', can be collapsed to 'x'.
    if (args.length === 2 && !t.isNode(args[0]) && Object.keys(args[0]).length === 0) {
      return propsNode(args[1]);
    }
    const helper = useBuiltIns ? dottedIdentifier('Object.assign') : state.addHelper('extends');
    return t.callExpression(helper, args.map(propsNode));
  }
  
  function propsNode(props) {
    if (props == null) return t.nullLiteral();

    return t.isNode(props) ? props : t.objectExpression(
      Object.keys(props).map(key => {
        let value = props[key];
        if (typeof value==='string') {
          value = t.stringLiteral(value);
        }
        else if (typeof value==='boolean') {
          value = t.booleanLiteral(value);
        }
        return t.objectProperty(propertyName(key), value);
      })
    );
  }

  /*
    将普通对象通过babel-types转成 babel 能识别的标识符.
    js中的所有数据类型对应的 type表示:
   * string: t.stringLiteral(str);
   * undefined: t.identifier('undefined');
   * null: t.nullLiteral(str);
   * boolean: t.booleanLiteral(str);
   * number: t.numericLiteral(str);
   * array: t.arrayExpression([]);
   * object: t.objectExpression([
     t.objectProperty(t.stringLiteral(key), t.stringLiteral(value)),
     t.objectProperty(t.stringLiteral(key), t.stringLiteral(value)),
    ]);
   * function call: t.callExpression(helper, [args]);
  */
  function transform(node, state) {
    
    if (node === undefined) return t.identifier('undefined');
    if (node == null) return t.nullLiteral();

    const { tag, props, children } = node;
    // 递归转换所有的children 对象
    function childMapper(child) {
      if (typeof child==='string') {
        return stringValue(child);
      }
      return t.isNode(child) ? child : transform(child, state);
    }
    const newTag = typeof tag === 'string' ? t.stringLiteral(tag) : tag;
    const newProps = !Array.isArray(props) ? propsNode(props) : spreadNode(props, state);
    const newChildren = t.arrayExpression(children.map(childMapper));
    return createVNode(newTag, newProps, newChildren);
  }
  
  function h(tag, props, ...children) {
    return { tag, props, children };
  }
  
  const html = htm.bind(h);
  
  // 先将该模板转为一个virtual dom对象. 目前只支持一个root对象.
  // {
  //   tag: '',
  //   props: {},
  //   children: [{
  //    tag: '',
  //    props: {},
  //    children: ....
  //   }]
  // }
  function treeify(statics, expr) {
    const assign = Object.assign;
    try {
      Object.assign = function(...objs) { return objs; };
      return html(statics, ...expr);
    }
    finally {
      Object.assign = assign;
    }
  }

  // The tagged template tag function name we're looking for.
  // This is static because it's generally assigned via htm.bind(h),
  // which could be imported from elsewhere, making tracking impossible.
  const htmlName = options.tag || 'html';
  return {
    name: 'htm',
    // 访问者是一个用于 AST 遍历的跨语言的模式。 
    // 简单的说它们就是一个对象，定义了用于在一个树状结构中获取具体节点的方法。
    // 把它用于遍历中时，每当在树中遇见一个 TaggedTemplateExpression 的时候会调用 TaggedTemplateExpression() 方法。
    visitor: {
      /**
       * html`` 字符串模板表达式
       * @param {[type]} path  
       *
       * path是一个节点在树中的位置以及关于该节点各种信息的响应式 Reactive 表示。
       * 你调用一个修改树的方法后，路径信息也会被更新。 Babel 帮你管理这一切，从而使得节点操作简单，尽可能做到无状态。
       * 所有修改节点都必须通过path提供的方法来进行.
       * 
       * @param {[type]} state 
       *
       * 如果您想让您的用户自定义您的Babel插件的行为您可以接受用户可以指定的插件特定选项，
       * 这些选项会通过`state`对象传递给插件访问者
       */
      TaggedTemplateExpression(path, state) {
        const tag = path.node.tag.name;
        if (htmlName[0]==='/' ? patternStringToRegExp(htmlName).test(tag) : tag === htmlName) {
          // 获取该模板中所有的字符串表达式
          const statics = path.node.quasi.quasis.map(e => e.value.raw);
          // 获取该模板中所有的js表达式`${js expressions}`
          const expr = path.node.quasi.expressions;

          const tree = treeify(statics, expr);
          // 由于babel是标准的ast树, 不能简单的用字符串代替.
          // 因此需要把node树转成AST树, 然后代替原来的AST树, 从而完成转换
          path.replaceWith(transform(tree, state));
        }
      }
    }
  };
}
```
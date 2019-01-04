export default function html(statics) {
  let key = '.';
  for (let i=0; i<statics.length; i++) key += statics[i].length + ',' + statics[i];
  const tpl = build(statics);

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

    statics:
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
        // 单引号和双引号
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
              // 不在标签内
              inTag = 0;
              // 清空props
              props = '';
              // 进入文本模式
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

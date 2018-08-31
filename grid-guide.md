## Grid 指南


### 基本语法和概念


CSS Grid layout是css中可用的最强大的布局系统。
它是二维系统，能够处理行和列，而不是像flexbox一样很大程度是一维的，
你可以通过在父元素（即为grid container）和子元素(即为grid items)上面应用css规则来使用grid布局。

开始，你需要用`display: grid`来定义一个容器元素作为gird. 然后用`grid-template-rows`和`grid-template-columns`来设置行和列，然后用用`grid-column`和`grid-row`将子元素放在grid中，
和flexbox相似，gird items的原始顺序并不重要，你可以用css来对他们进行排序，从而可以很轻松的用媒体查询来重新排列你的grid布局。

#### 重要的术语

- 网格容器 grid-container
- 网格线 grid-line
- 网格轨道 grid-track
- 网格格子 grid Cell 
- 网格区域 grid-area

#### 语法

18个新的属性

**容器属性**

- `display: grid`: 定义该元素为栅格项目，

- `grid-template`: 通过空格分隔的值定义栅格的行与列。


```css
.container{
  <!-- 定义栅格的列 -->
  grid-template-columns: <track-size> ... | <line-name> <track-size> ...;

  <!-- 定义栅格的行 -->
  grid-template-rows: <track-size> ... | <line-name> <track-size> ...;
}

.container{
  <!-- 用括号语法为栅格线确定名字 -->
  grid-template-columns: [first] 40px [line2] 50px [line3] auto [col4-start] 50px [five] 40px [end];
  grid-template-rows: [row1-start] 25% [row1-end] 100px [third-line] auto [last-line];

  <!-- 定义栅格区域: 一个引号代表一行，引号中的每个栅格区域用空格分隔, . 句点表示空白栅格格子 -->
  grid-template-areas: "header header header header"
                        "main main . sidebar"
                        "footer footer footer footer";
}
```

当你使用`grid-template-areas`的时候，栅格区域两端的栅格线已被自动命名为`header-start`, `header-end`。

- `grid-gap`: 指定栅格之间的间隙

```css
.container{
  grid-template-columns: 100px 50px 100px;
  grid-template-rows: 80px auto 80px; 
  grid-column-gap: 10px;
  grid-row-gap: 15px;
  grid-gap: 10px 15px;
}
```

栅格间隙仅仅在行/列 之间，不包括最外部的边。 如果没有设置 grid-row-gap，它将于 grid-column-gap 保持一致。

- `justify-items`和 `align-items`

```css
.container{
  justify-items: start | end | center | stretch [default]; // 使栅格项目中的内容与 列 轴对齐
  align-items: start | end | center | stretch [default]; // 使栅格项目中的内容与 行 轴对齐
}
```

- `justify-content`和 `align-content`

```css
.container {
  justify-content: start | end | center | stretch | space-around | space-between | space-evenly;  // 栅格与 列 轴对齐 
  align-content: start | end | center | stretch | space-around | space-between | space-evenly;  // 会使栅格与  行 轴对齐
}
```

* start 与栅格容器的左侧对齐
* end 与栅格容器的右侧对齐
* center 在栅格容器中居中
* stretch 调整栅格项目的大小，使栅格充满整个栅格容器。
* space-around 每两个项目之间留有相同的空白，在最左端与最右端为一半大小的空白。
* space-between 每两个项目之间留有相同的空白，在最左端与最右端不留空白。
* space-evenly 每两个项目之间留有相同的空白，包括两端。




**子元素属性**

- `grid-column`和 `grid-row`： 通过指定栅格线来确定栅格项目的位置。


```css
.item{
  grid-column-start: <number> | <name> | span <number> | span <name> | auto
  grid-column-end: <number> | <name> | span <number> | span <name> | auto
  grid-row-start: <number> | <name> | span <number> | span <name> | auto
  grid-row-end: <number> | <name> | span <number> | span <name> | auto
}
```

- <Line> 可以是一个表示栅格线名字或数字。
- span <number> 项目将横跨指定数量栅格轨迹
- span <name> 项目将横跨至指定名字的栅格线
- auto 自动放置，自动跨越轨迹或者默认跨越轨迹

栅格块可能会互相重叠，你可以使用 z-index 控制它们的层叠顺序（stacking order）。


```css
.item{
  grid-column: <start-line> / <end-line> | <start-line> / span <value>;
  grid-row: <start-line> / <end-line> | <start-line> / span <value>;
}
```

- `grid-area`: 当创建栅格容器使用 grid-template-areas 属性时，可以通过制定区域名字确定栅格项目的位置。

```css
.item{
  grid-area: <name> | <row-start> / <column-start> / <row-end> / <column-end>;
  grid-area: header;
  grid-area: 1 / col4-start / last-line / 6
}
```

- `justify-self`和`align-self`

```css
.item{
  justify-self: start | end | center | stretch; // 制定栅格项目中的内容与 列 轴对齐的的方式
  align-self: start | end | center | stretch; // 制定栅格项目中的内容与 行 轴对齐的的方式
}
```


#### Examples

- https://gridbyexample.com/examples/

- 基本的网格
  https://codepen.io/rachelandrew/pen/RPXNod

- 自定义网格线名称
  https://codepen.io/rachelandrew/pen/yNmyoM

- 合并单元行与合并单元列
    
  通过指定行数：https://codepen.io/rachelandrew/pen/XbvJMz
  通过span跨行和跨列：https://codepen.io/rachelandrew/pen/oXKgwa

- 通过网格区域命名和定位网格项目
  https://codepen.io/rachelandrew/pen/oXKgoQ

- 显式网格和隐式网格
  https://codepen.io/rachelandrew/pen/JdgoOB

- minmax()
  https://codepen.io/rachelandrew/pen/RRxPyk

- repeat() 
  https://codepen.io/rachelandrew/pen/yNmyPb

- auto-fill:
  https://codepen.io/rachelandrew/pen/mJNyjb

  atuo-fill vs auto-fit: https://codepen.io/rachelandrew/pen/dpYzkq

- fr
  https://codepen.io/rachelandrew/pen/GZQYOL


### grid-layout带来的单位和函数

0. fr,弹性长度

css3的新单位，fr，在一串数值中出现的话表示根据比例分配某个方向上的剩余空间。
[fr](https://css-tricks.com/introduction-fr-css-unit/)

- 你想用来占据一个自动伸缩的空间

1. repeat()

repeat()提供了一个紧凑的声明方式。它也接受两个值：重复的次数和重复的值或者值组
如果行列太多并且是规则的分布，我们可以用函数来做网格线的排布。
grid-template-columns: repeat(3, 20px [col-start]) 5%;
// 等价于
grid-template-columns: 20px [col-start] 20px [col-start] 20px [col-start] 5%;
}

给repeat()函数使用这个关键词，来替代重复次数。这可以根据每列的宽度灵活的改变网格的列数

2. minmax()

这个函数意味着你能够指定一个网格轨道的最小值和最大值。

minmax(min, max)相当于为网格线间隔指定一个最小到最大的区间。如果min>max，最大值就失效了，展示的是min。

3. fit-content()

ex: fit-content(300px)

内容不足300px, 适应内容的宽度，如果内容超过300px,则容器的宽度不超过300px

4. max-content, min-content

这些关键字包括 min-content 和 max-content， 都可被用于定义网格轨道的大小。
min-content: 单元格的内容使用了最小宽度,将可用空间转移给其他单元格
max-content：尺寸扩大到整个内容字符串长度。

5. auto-fill 和 auto-fit

能够在一个容器中尽可能放入多的列, 有时候我们并不需要固定行数和列数，能根据浏览器的窗口大小来自动的适应

auto-fill: 倾向于容纳更多的列，所以如果在满足宽度限制的前提下还有空间能容纳新列，那么它会暗中创建一些列来填充当前行。即使创建出来的列没有任何内容，但实际上还是占据了行的空间。
auto-fit: 倾向于使用最少列数占满当前行空间，浏览器先是和 auto-fill 一样，暗中创建一些列来填充多出来的行空间，然后坍缩（collapse）这些列以便腾出空间让其余列扩张。

```css 
grid-template-columns: repeat(auto-fill, 200px);
```

5. auto

如果用于最大值，那么auto值相当于max-content值；如果用于最小值，那么auto值相当于min-content。

### 布局实例

[grid by Examples](https://gridbyexample.com/examples/)

方式：

- 圣杯布局
- 两列布局
- 等高布局
- 双飞翼布局
- 栅格布局
- layout


### 机制

- float和clear属性对网格项目不起作用，
- 如果使用了 display: inline-block 或其他表格属性如 display: table-cell， 这些属性将不再生效
- vertical-align属性对网格项目不起作用
- 网格容器不具有::first-line与::first-letter伪元素

### 与flexbox对比

Flexbox 几乎能解决大多数的场景。但 Flexbox 专注于轴内的空间分配，只能控制子元素在主轴上的排布规则，而 Grid Layout 则能够对子元素同时在两个方向上进行空间分配和排列对齐。

你希望单个项目在一行中进行扩展，而不考虑上面一行中发生的情况，那就应该使用Flexbox布局更为合适。

-----

参考：

[specificaton](https://www.w3.org/TR/css3-grid-layout/)






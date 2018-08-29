## Grid指南


### 基本语法和概念


CSS Grid layout是css中可用的最强大的布局系统。
它是二维系统，能够处理行和列，而不是像flexbox一样很大程度是一维的，
你可以通过在父元素（即为grid container）和子元素(即为grid items)上面应用css规则来使用grid布局。

开始，你需要用`display: grid`来定义一个容器元素作为gird. 然后用`grid-template-rows`和`grid-template-columns`来设置行和列，然后用用`grid-column`和`grid-row`将子元素放在grid中，
和flexbox相似，gird items的原始顺序并不重要，你可以用css来对他们进行排序，从而可以很轻松的用媒体查询来重新排列你的grid布局。

### 重要的术语

在深入Gird的概念之前，理解一些术语是很重要的。


```html
<div class="container">
  <div class="item item-1"></div>
  <div class="item item-2"></div>
  <div class="item item-3"></div>
</div>
```

- 网格容器 grid-container
- 网格线 grid-line
- 网格轨道 grid-track
- 网格格子 grid Cell 
- 网格区域 grid-area


- grid-layout带来的单位和函数

0. fr,弹性长度

css3的新单位，fr，在一串数值中出现的话表示根据比例分配某个方向上的剩余空间。
[fr](https://css-tricks.com/introduction-fr-css-unit/)

- 你想用来占据一个自动伸缩的空间

1. repeat()

repeat()提供了一个紧凑的声明方式。它也接受两个值：重复的次数和重复的值
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

fit-content()相当于 min('max-content', max('auto', argument));

4. max-content, min-content

这些关键字包括 min-content 和 max-content， 都可被用于定义网格轨道的大小。
min-content: 单元格的内容使用了最小宽度,将可用空间转移给其他单元格
max-content：尺寸扩大到整个内容字符串长度。

5. auto

如果用于最大值，那么auto值相当于max-content值；如果用于最小值，那么auto值相当于min-content。

### 布局实战

方式：

- 圣杯布局
- 两列布局
- 等高布局
- 双飞翼布局
- 栅格布局
- layout


### 最佳实践


- float和clear属性对网格项目不起作用，
- 如果使用了 display: inline-block 或其他表格属性如 display: table-cell， 这些属性将不再生效
- vertical-align属性对网格项目不起作用
- 网格容器不具有::first-line与::first-letter伪元素

### 与flexbox和传统布局方式对比

Flexbox 几乎能解决大多数的场景。但 Flexbox 专注于轴内的空间分配，只能控制子元素在主轴上的排布规则，而 Grid Layout 则能够对子元素同时在两个方向上进行空间分配和排列对齐。

你希望单个项目在一行中进行扩展，而不考虑上面一行中发生的情况，那就应该使用Flexbox布局更为合适。著作权归作者所有。
如果你的布局是二维的带有行和列，一个单元格大小的改变将会改变整个轨道的大小。









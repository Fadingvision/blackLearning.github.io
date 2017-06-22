## React　单元测试

### React 单元测试要关注的点


1. 组件所要render的内容．
2. 组件所接受的props.
3. 组件所持有的state.
4. 组件的行为当用户进行交互的时候(点击，拖拽，键盘输入事件)


#### 其他一些影响组件的因素:

- 组件的context
- 组件的refs实例
- 组件的生命周期方法


#### 一些问题：　

1. 组件所渲染的内容
2. 在不同的条件下，组件是否会渲染不同的结果．
3. 假如我传了一个function 作为组件的props, 　那么组件拿这个函数做了什么，
是否将其传入了其他组件，是否调用了它，如果调用了，参数是什么．
4. 当产生交互行为的时候，组件内部发生了什么．


#### 哪些代码有测试的价值：

1. 如果测试代码需要直接复制应用代码，那么将使得测试代码非常脆弱．
（例如行内样式，标签名，标签属性这些很容易改动的东西）

2. 如果一个应用代码的行为已经被框架和库所断言，例如propTypes, 标签是否渲染，生命周期是否执行，那么测试的价值不大．

3. 不要测试与该组件无关的内容．

4. 就像一个纯函数一样，输入输出是测试的重点; 
在react中，组件接收的props，组件所渲染组件的结果，是测试的重点．

5. 不要测试一些与逻辑展现无关的细节，让eslint, propTypes, flow等工具来做这些事情．



#### 可测试的点：

1. 条件语句，测试真实的渲染结果．

对于一些简单的纯dumb component,只需要测试其是否render即可，
对于一些复杂条件的component,模拟各种条件检查是否渲染正确的内容．

```js
const wrapper = shallow(<ComponentName />);
expect(wrapper.state().data).toBe('something');
expect(wrapper.props().data).toBe('something');

```

2.　围绕组件的props，state编写测试．

3.　用户的交互行为．模拟事件进行用户行为测试，点击，输入等．

```js
const wrapper = shallow(<ComponentName />);
expect(wrapper.state().data).toBe('state1');
wrapper.find('button').simulate('click');
expect(wrapper.state().data).toBe('state2');
```

4.　测试一些临界行为．

5. 测试setState方法．

6. 测试组件类中的方法．

7. services, common, util 函数应该完整的测试．

8. redux的异步action Creators测试，reducers测试．


### 工具


#### Enzyme


提供三种渲染模式：

1. 浅渲染

`const wrapper = shallow(<MyComponent />);`

2. 全渲染

全渲染会执行完整的生命周期方法，和在dom中真实渲染类似．

`const wrapper = mount(<MyComponent />);`

3. 静态渲染

将react component 渲染成静态的html，用来分析html结构

`const wrapper = render(<MyComponent />);`

4. wrapper 

渲染结果返回的容器，可以用来找到组件内的具体状态，从而进行断言分析．

```js
wrapper.find(Foo)
wrapper.find('.icon-star')
wrapper.find('button').simulate('click')
wrapper.contains(<div className="unique" />)
wrapper.props().data
wrapper.state().data
```
1. 确保传递给子组件的方法都正确的绑定了this指向，不要在render函数里面绑定this指向。
2. 确定组件卸载之前销毁所有的自定义事件绑定和定时器以及正在pending 的http请求。
3. 在componentDidMount中去发起http请求。
4. 无状态组件尽量写成纯函数式组件。
5. 使用key来帮助react进行身份一致的验证，确保子组件能够在更新中被保留而不是重新创建，使用index作为key是一种反模式。

5.　组件的划分，

 * 单例组件

6. 组件方法组织

* class definition
  * constructor
    * event handlers
  * 'component' lifecycle events
  * getters
  * render
* defaultProps
* proptypes

7.　组件中state的纯净问题

http://reactkungfu.com/2015/09/common-react-dot-js-mistakes-unneeded-state/

setState仅仅应该用在影响一些会render的东西，而且不能由props计算得到的东西。

8. state的放置问题

如果你的父组件需要知道子组件的状态，那么这个状态本身即应该被父组件所持有。


格式：

1.　jsx注意换行

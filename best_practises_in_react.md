1. 确保传递给子组件的方法都正确的绑定了this指向，不要在render函数里面绑定this指向。
2. 确定组件卸载之前销毁所有的自定义事件绑定和定时器以及正在pending 的http请求。
3. 在componentDidMount中去发起http请求。
4. 无状态组件尽量写成函数式组件。


5.　组件的划分，

 * 单例组件

6. 类中属性方法的顺序问题

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


格式：

1.　jsx注意换行

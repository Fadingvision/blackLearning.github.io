## Part I -- React Mount


### JSX => HMTL

1. 监视滚动条。
2. 实例化组件。

组件被分成三类：混合式组件（自定义的），dom组件（div之类）,字符串组件（无标签的纯字符串）

3. validate the nesting of component

For example, if parent tag is <select>, child tag should be only one of the following: option, optgroup, or #text. These rules actually are defined in https://html.spec.whatwg.org/multipage/syntax.html#parsing-main-inselect.

### transaction (事务)

想象有一个通信渠道，你需要打开链接，发送信息，关闭链接，如果你一条接一条的发送一些信息，因此，仅需要打开链接一次，发送所有待发送的消息，然后关闭连接。

好的，然后让我们思考一些更抽象的东西，如果发送消息是你想要执行的操作，打开/关闭链接是在执行操作期间的预/后处理。


事务是react中被广泛使用的模式，除了用来包装action,事务允许你重置事务流，允许你在一个事务已经在进程中的时候阻塞其他的同时发生的事务流。


不同的事务负责了不同的行为，但所有的事务都是从Transaction模块中扩张出来的，最主要的不同是具体的事务容器列表，容器是一个包含初始化和关闭事务方法的对象。

<img src="https://rawgit.com/Bogdan-Lyashenko/Under-the-hood-ReactJS/master/stack/images/1/transaction.svg" alt="">
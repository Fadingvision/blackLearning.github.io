
## asd

* 没有硬编码，所有的配置全部抽离到config或者constant里面。

	> 我的代码中硬编码去除的还不够彻底．


* 组件划分拆分的很好，很细节（button, sort, list, listItem等等）。

	> 我的组件拆分得还不够细，有时候很多逻辑都混在一起写了，这样不利于复用．


* 将loading，　fetchOnScroll等逻辑拆分出来作为形成高阶组件， 

* 将isFetching，　isLoading等状态的ui逻辑__从业务逻辑中拆分出来__然后组合起来统一放到store中管理．

	> 我的代码中通常在业务代码中混入了太多的类似下面的这种与业务逻辑无关的ui逻辑，导致代码看起来很松散，low.
		```js
		toast.loading();
		this.isLoading = true;
		toast.close();
		this.isLoading = false;
		```

* 其实应该将组件拆分开来，而无需过分担心使用了太多的 connect．

	> 我的代码中只在最高层级的用connect，而将数据一层一层的来传递，这样会导致很多不必要的渲染,而且很麻烦．

* 尽量的使用纯函数组件，一个组件只负责一件事，然后将其组合起来，符合函数式编程思想．

	```js
	function Activity({
	  activity,
	  idx
	}) {
	  return (
	    <li>
	      <TrackStreamContainer activity={activity} idx={idx} />
	      <TrackExtension activity={activity} />
	    </li>
	  );
	}
	function Activities({
	  ids,
	  entities,
	  activeFilter,
	  activeSort,
	}) {
	  const matchedEntities = getMatchedEntities(ids, entities);
	  const filteredEntities = filter(activeFilter, matchedEntities);
	  const sortedEntities = activeSort(filteredEntities);

	  return (
	    <div>
	      <div>
	        <ul>
	          {map((activity, key) => {
	            const activityProps = { activity, idx: key, key };
	            return <Activity { ...activityProps } />;
	          }, sortedEntities)}
	        </ul>
	      </div>
	    </div>
	  );
	}
	```

* 两个缩进．
	
	> 我的四个缩进，看起来比较松散，考虑换成2缩进．

* 高阶组件优于父子组件．

* 每个组件都有一个className的props,方便对组件的样式进行重写和控制

	> 我的组件中样式名是写死的，一旦想要复用组件但是对样式又有改变的话，只能进入css去强制覆盖，这样灵活性比较弱，而且容易冲突．


















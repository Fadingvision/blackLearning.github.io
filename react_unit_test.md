## React　单元测试

### React 单元测试要关注的点
1. 组件所要render的内容．
2. 组件所接受的props，拿到props之后我用它干了些什么，
3. 组件是否持有state, 什么时候更新了state.
4. 组件的行为当用户进行交互的时候，或者子组件调用了回调函数，
这时候发生了什么。
5. 组件加载和卸载的时候都发生了什么。


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

2.　围绕组件的props，state编写测试, 确保能渲染不同的props和state。

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


## 工具


### Enzyme


提供三种渲染模式：

1. 浅渲染

不会渲染子组件．

`const wrapper = shallow(<MyComponent />);`

2. 全渲染

全渲染会执行完整的生命周期方法，和在dom中真实渲染类似，　用来充分完整的测试组件．

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
wrapper.find('input').simulate('change');
wrapper.setState(nextState) => ShallowWrapper
wrapper.setProps(nextProps) => ShallowWrapper
wrapper.setContext(context) => ShallowWrapper

wrapper.instance() => ShallowWrapper
wrapper.contains(<div className="unique" />)
wrapper.props().data
wrapper.state().data
```

### Jest

熟悉jasmine的可以看到它的语法和jasmine很相似．

#### Snapshot(快照)测试

```js

import React from 'react';
import Link from '../Link.react';
import renderer from 'react-test-renderer';

it('renders correctly', () => {
  const tree = renderer.create(
    <Link page="http://www.facebook.com">Facebook</Link>
  ).toJSON();
  expect(tree).toMatchSnapshot();
});

// => 

exports[`renders correctly 1`] = `
<a
  className="normal"
  href="http://www.facebook.com"
  onMouseEnter={[Function]}
  onMouseLeave={[Function]}
>
  Facebook
</a>
`;

```

第一次跑测试的时候会生成一个snapshot 文件，在随后的测试运行jest会比较输出与以前的快照。
如果他们匹配,测试通过。如果他们不匹配,那么代表你的代码有bug，或者代码实现已经改变了，
snapshot需要被更新,这时候可以用`jest --updateSnapshot`来更新快照．

这种测试方式很适合一些纯展示的组件.

### 如何具体的测试一个组件

>组件代码：

```js
import React from 'react';
import Modal from 'react-modal';

import LoanItem from 'COMPONENTS/LoanItem';
// import PullMore from 'COMPONENTS/PullMore';
import SelectBar from './SelectBar';
import SelectBody from './SelectBody';
import toast from 'COMPONENTS/Toast';
import NoData from 'COMPONENTS/NoData';
// import FixedBar from 'COMPONENTS/FixedBar';

import { CREDIT_TYPES, CREDIT_TIMES } from 'CONSTANTS/default';

import apiService from 'SERVICE';

const ModalStyle = {
	overlay: {
		position: 'fixed',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: 'rgba(0, 0, 0, 0.25)',
		zIndex: 100001
	},
	content: {
		position: 'absolute',
		top: '2.666667rem',
		left: '50%',
		bottom: 'auto',
		width: '7.866667rem',
		height: 'auto',
		marginLeft: '-3.933333rem',
		background: '#fff',
		overflow: 'auto',
		WebkitOverflowScrolling: 'touch',
		borderRadius: '30px',
		outline: 'none',
		padding: '0.506667rem 0.64rem'
	}
};

export default class Loan extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			loanList: [],
			isModalOpen: false,
			params: {
				date: '0',
				money: '0',
				loanRepayment: 0,
				loanTime: 0,
				rate: 1
			}
		};

		this.mount = true;
		this.closeModal = this.closeModal.bind(this);
		this.openModal = this.openModal.bind(this);
		this.changeChooseParams = this.changeChooseParams.bind(this);
		this.changeCurrent = this.changeCurrent.bind(this);
		this.getData = this.getData.bind(this);
		this.changeParams = this.changeParams.bind(this);
	}

	componentWillMount() {
		this.isLoading = true;
		toast.loading();
	}

	componentDidMount() {
		this.getData().then(() => {
			this.isLoading = false;
			toast.close();
		})
	}

	componentWillUnmount() {
		this.mount = false;
	}

	getData(params = this.state.params) {
		let postParams = { ...params };
		postParams.loanQuota = postParams.money;
		postParams.loanTerm = postParams.date;
		delete postParams.date;
		delete postParams.money;

		return apiService.getLoanList(postParams).then(data => {
			if (!this.mount) return;
			this.setState({
				loanList: data.loans
			});
		});
	}

	changeChooseParams() {
		const { type, currentKey, params } = this.state;
		this.setState(
			{
				params: {
					...params,
					[type === 'CREDIT_TYPES' ? 'money' : 'date']: currentKey
				},
				isModalOpen: false
			},
			this.getData
		);
	}

	changeParams(type, key) {
		let stateObj = {};
		if (key) stateObj.loanRepayment = key;
		if (type === 'rate') {
			stateObj.rate = 1;
			stateObj.loanTime = 0;
		}
		if (type === 'loanTime') {
			stateObj.rate = 0;
			stateObj.loanTime = 1;
		}

		this.setState(
			{
				params: {
					...this.state.params,
					...stateObj
				}
			},
			this.getData
		);
	}

	changeCurrent(key) {
		this.setState({
			currentKey: key
		});
	}

	openModal(type) {
		this.setState({
			isModalOpen: true,
			type,
			currentKey: this.state.params[
				type === 'CREDIT_TYPES' ? 'money' : 'date'
			]
		});
		this.selectBody.closeSelect();
	}

	closeModal() {
		this.setState({
			isModalOpen: false
		});
	}

	renderLoanList() {
		if(!this.state.loanList.length &&
			!this.isLoading) return (
			<div className="nodata-container">
				<NoData />
			</div>
		);

		const items = this.state.loanList.map(loan => {
			return <LoanItem loanItem={loan} key={loan.id} />;
		});

		return (
			<div className="padding-box loan-padding-box">
				{items}
			</div>
		);
	}

	renderModal() {
		const { type, currentKey } = this.state;
		let obj = type === 'CREDIT_TYPES' ? CREDIT_TYPES : CREDIT_TIMES;
		let title = type === 'CREDIT_TYPES' ? '贷款额度' : '贷款期限';
		let style = {
			flexBasis: type === 'CREDIT_TYPES' ? '48%' : '30%'
		};
		return (
			<Modal
				isOpen={this.state.isModalOpen}
				contentLabel="Modal"
				style={ModalStyle}
				key="modal"
				onRequestClose={this.closeModal}
				shouldCloseOnOverlayClick
			>
				<div className="modal-container">
					<div className="modal-header">
						<h2>{title}</h2>
						<span className="close-btn" onClick={this.closeModal}>
							X
						</span>
					</div>

					<div className="modal-body">
						<ol className="credit-type">
							{Object.keys(obj).map(key => {
								return (
									<li
										key={key}
										style={style}
										onClick={() => this.changeCurrent(key)}
										className={
											currentKey === key ? 'active' : ''
										}
									>
										{obj[key]}
									</li>
								);
							})}
						</ol>
					</div>

					<div className="modal-footer">
						<button
							className="modal-btn"
							onClick={() => this.changeChooseParams()}
						>
							确定
						</button>
					</div>
				</div>
			</Modal>
		);
	}

	render() {
		return (
			<div className="loan">
				<div className="fix-bar">
					<SelectBar
						openModal={this.openModal}
						money={CREDIT_TYPES[this.state.params.money]}
						date={CREDIT_TIMES[this.state.params.date]}
					/>
					<SelectBody
						changeParams={this.changeParams}
						ref={selectBody => {
							this.selectBody = selectBody;
						}}
					/>
				</div>
				{this.renderLoanList()}
				{this.renderModal()}
			</div>
		);
	}
}
```


#### 测试代码：

```js
import React from 'react';
import { shallow, mount, render } from 'enzyme';
import Loan from './index';
import NoData from 'COMPONENTS/NoData';
import apiService from 'SERVICE';
import LoanItem from 'COMPONENTS/LoanItem';
import {MemoryRouter} from 'react-router-dom';

describe('LoanComponent test container', () => {
	let props;
	let LoanWrapper;


	const loanWrapperCreator = () => {
		if (!LoanWrapper) {
			LoanWrapper = shallow(<Loan {...props} />);
		}
		return LoanWrapper;
	};

	beforeEach(() => {
		props = {
			router: {}
		};
		LoanWrapper = undefined;
	});

	// render
	it('应该一直渲染div元素', () => {
		const div = loanWrapperCreator().find('.loan');
		expect(div.length).toBe(1);
	})


	it('当loanList为空并且不是正在加载的时候应该渲染NoData的数据', () => {
		const loanWrapper = loanWrapperCreator();
		loanWrapper.setState({
			loanList: [],
		});
		loanWrapper.instance().isLoading = false;
		loanWrapper.instance().forceUpdate();
		expect(loanWrapper.contains(<NoData />)).toEqual(true);
	})


	it('当loanList不为空的时候应该渲染正确的条数', () => {
		const loanWrapper = loanWrapperCreator();
		loanWrapper.setState({
			loanList: [{
				id: 1
			}],
		});
		expect(loanWrapper.find(LoanItem).length).toEqual(1);
	})

	// props, state
	it('当初始化返回数据时应该能够渲染出数据', async () => {
		apiService.getLoanList = jest.fn();
		apiService.getLoanList.mockReturnValueOnce(
			Promise.resolve({
				loans: [{
					id: 1
				}]
			})
		);
		const loanWrapper = mount(<MemoryRouter><Loan {...props} /></MemoryRouter>);
		setTimeout(() => expect(loanWrapper.find(Loan).find(LoanItem).length).toEqual(1), 0);
	})
});
```


可以看到就测试这个组件而言，我们应该关心的是：

1.　根据各种条件是否正确渲染了相应的组件。
2. 当有数据的时候，是否渲染了对应的列表。


这里我们并没有去测试相应的用户交互的逻辑，
这是因为这是属于子组件的工作，应该把这部分的测试逻辑放在子组件中去做，
react组件的测试，你应该仅仅测试你组件自身所关心的内容。


>参考：

https://facebook.github.io/jest/docs/en/troubleshooting.html#content

https://reacttraining.com/react-router/web/guides/testing

https://medium.freecodecamp.com/the-right-way-to-test-react-components-548a4736ab22

http://airbnb.io/enzyme/docs/api/ReactWrapper/setContext.html
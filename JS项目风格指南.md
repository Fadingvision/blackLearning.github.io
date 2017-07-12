# javascript项目的一些最佳实践（译）

> 译自 => https://github.com/wearehive/project-guidelines

译者注： 翻译水平有限，肯请釜正。

> 对你来说，开发一个全新的项目就像在青草地上打滚那样快乐，但是对其他人来讲，维护这个项目就像是一个潜在的黑暗扭曲的噩梦。
下面是我们发现的一系列指导方案，它们和大多数[hive](http://wearehive.co.uk)中的项目都合作的很好（至少我们认为）。
如果你想分享一些最佳实践，或者认为这些指导方案中的某一条应该被移除。[请随意的和我们分享](http://makeapullrequest.com)。

- [Git](#git)
- [介绍](#documentation)
- [环境](#environments)
- [依赖](#dependencies)
- [测试](#testing)
- [结构和命名](#structure-and-naming)
- [编码风格](#code-style)
- [log记录](#logging)
- [API 设计](#api-design)
- [Licensing](#licensing)

## 1. Git <a name="git"></a>

### 1.1 一些git规则


* 在开发分支中进行开发

    _为什么:_
    > 因为这种方法让你所有的工作都是在一个专门的分支上独立完成的，而不是在主分支上。它让你在提交多个合并请求的时候不会造成混淆，它可以让你安全的进行迭代开发，而不会用一些潜在的不稳定的，未完成的代码去污染主分支。[阅读更多...](https://www.atlassian.com/git/tutorials/comparing-workflows#feature-branch-workflow)


* 分支分离于develop分支

    _为什么:_
    > 通过这种方式，你能保证master分支尽可能的在没有任何问题的情况下构建，而且能够直接用来发布。（这可能对一些项目来说有点过度了）


* 永远不要在 `develop` 分支或者 `master` 分支上进行push操作，而是选择提交一个合并请求。

    _为什么:_
    > 它会将已经完成一个功能开发的消息通知到团队成员，也能使得团队之间的代码评审和社区间的功能提议讨论更加容易。

* 在你push你的功能代码和提交一个合并请求之前，更新你本地的 `develop` 分支，然后做一个 `interactive rebase`.

    _为什么:_
    > rebase操作将会被合并进被请求合并的分支（`master` 或者 `develop`），并且将你本地的提交添加到提交历史的顶部，而不会造成一个合并请求的提交记录（假设过程中没有任何冲突），这会使得你的提交历史记录更加好看和清晰。[阅读更多...](https://www.atlassian.com/git/tutorials/merging-vs-rebasing)


* 在rebase操作中或者提交一个合并请求之前解决潜在可能的冲突。


* 在提交合并之后，删除本地和远程的开发分支。

    _为什么:_
    > 废弃分支将会使你的分支列表变得杂乱，这种方式确保你的分支只会被合并到 `master` 或者 `develop` 一次，开发分支仅应该存在于你的开发工作还在持续进行中的时候。


* 在提交一个合并请求之前，确保你的开发分支成功的构建，并且通过所有的测试（包括代码的风格检查）。

    _为什么:_
    > 你即将把你的代码合并到一个稳定的分支上，如果你的开发分支测试失败了，那么你的目标分支有相当高的几率也会构建失败。在提交合并请求前检查代码风格，有助于提高代码的可读性和在真实代码结合的时候减少格式化错误。

* 使用.gitignore文件。


```

### Node ###

# Logs
logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Optional npm cache directory
.npm

# Dependency directories
/node_modules
/jspm_packages
/bower_components

# Yarn Integrity file
.yarn-integrity

# Optional eslint cache
.eslintcache

# dotenv environment variables file
.env

#Build generated
dist/
build/


### SublimeText ###
# cache files for sublime text
*.tmlanguage.cache
*.tmPreferences.cache
*.stTheme.cache

# workspace files are user-specific
*.sublime-workspace

# project files should be checked into the repository, unless a significant
# proportion of contributors will probably not be using SublimeText
# *.sublime-project


### VisualStudioCode ###
.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json

### WebStorm/IntelliJ ###
/.idea
modules.xml
*.ipr


### System Files ###
.DS_Store

# Windows thumbnail cache files
Thumbs.db
ehthumbs.db
ehthumbs_vista.db

# Folder config file
Desktop.ini

# Recycle Bin used on file shares
$RECYCLE.BIN/

# Thumbnails
._*

# Files that might appear in the root of a volume
.DocumentRevisions-V100
.fseventsd
.Spotlight-V100
.TemporaryItems
.Trashes
.VolumeIcon.icns
.com.apple.timemachine.donotpresent

```

    _为什么:_
    > 上面的文件列表将不会被同步到你的远程仓库中，它包含了大多数常用的编辑器中的临时文件，和一些基本js项目的依赖文件夹。

* 保护你的 `develop` 和 `master` 分支 .

    _why:_
    > 它让你的生产分支不会收到意外的或者不可逆的改变的干扰. 关于更多... [Github](https://help.github.com/articles/about-protected-branches/) and [Bitbucket](https://confluence.atlassian.com/bitbucketserver/using-branch-permissions-776639807.html)


### 1.2 git 工作流

因为上述的原因，我们使用带有[Interactive Rebasing](https://www.atlassian.com/git/tutorials/merging-vs-rebasing#the-golden-rule-of-rebasing)的[Feature-branch-workflow](https://www.atlassian.com/git/tutorials/comparing-workflows#feature-branch-workflow)和一些[Gitflow](https://www.atlassian.com/git/tutorials/comparing-workflows#gitflow-workflow)中的元素（分支命名和开发分支的约定），主要的流程如下：


* 切换到一个新的 `featrue/bug-fix` （开发或者问题修复）分支

    ```sh
    git checkout -b <branchname>
    ```

* 修改代码，提交代码
    ```sh
    git add
    git commit -a
    ```

    _为什么:_
    > `git commit -a`将会打开一个编辑器，允许你将提交主题从提交内容中分离出来，在 *1.3章节中阅读更多关于它的内容*

* 从远程同步你错过的提交

    ```sh
    git checkout develop
    git pull
    ```

    _为什么：_
    > 这给你一个机会在rebasing 的时候在本机上处理冲突，而不是提交一个包含冲突的合并请求。


* 通过rebase更新你的开发分支到最新的修改

    ```sh
    git checkout <branchname>
    git rebase -i autosquash develop
    ```

    _为什么：_
    > 你能使用 `--autosquash` 来将你所有的commits挤压到一个commit记录中，没有人想在develop分支中的一个功能开发中看到大量的commit记录。[阅读更多](https://robots.thoughtbot.com/autosquashing-git-commits)


* 如果你没有冲突，你可以跳过这一步了，如果你有，[解决它们](https://help.github.com/articles/resolving-a-merge-conflict-using-the-command-line/)然后继续rebase。

    ```sh
    git add <file1> <file2> ...
    git reabse --continue
    ```

* 推送你的分支，rebase将会改变提交历史，你将使用`-f`来强制提交改变到远程分支，如果其他人也在你的分支上工作，使用破坏性稍弱的操作（--fore-with-lease）。

    ```sh
    git push -f
    ```

    _为什么:_
    > 当你进行reabs操作的时候，你是正在改变你的开发分支的历史，结果是，git将会拒绝普通的`git push`，所以你需要使用-f 或者 --force 的标志来强制推送。[read more...](https://developer.atlassian.com/blog/2015/04/force-with-lease/)

* 提交合并请求
* 合并请求将会被代码审查者接受，合并或者关闭。
* 当你完成开发的时候，移除你本地的开发分支


### 1.3 写出更好的提交信息


在commit 的时候有一个好的习惯，并且坚持这样做，将会使得用git工作，或者与他人合作更加容易，
下面是一些经验法则：

* 将主题从提交信息中分离出来单独一行

* 主题行限制为50个字符

* 不要以句号结束主题行

* 使用内容区域来解释 改变了**什么**， **为什么**作出这次改变， 以及**怎么**改变的信息。

## 2. 文档

* 使用这个[模板](https://github.com/wearehive/project-guidelines/blob/master/README.sample.md)作为README的标准，可以随意添加该模板没有覆盖到的部分。
* 如果一个项目有多个仓库，请在各自的README文档中提供连接到各个仓库的链接。
* 随着项目的开发保持README的更新。
* 为代码添加注释，尽可能的将你计划中的每个主要部分描述清楚。
* 如果有一个关于你使用的代码和解决方案的github 讨论，或者stackOverFlow上面的问题，将这些链接作为注释添加到你的代码中。

* 不要使用注释作为你的烂代码的借口，保持你的代码整洁。

* 同样的，不要使用代码洁癖来作为你丝毫不写注释的借口，
（好的代码当然是保持代码整洁的同时，而在适当的地方有适当的注释。）

* 随着你的代码的更新，随时更新你的注释，保持注释和代码的关联。

## 3. 环境<a name="环境"></a>

* 根据项目大小，定义并分离出 `开发(development)`, `测试(test)`, `生产(production)` 环境。

    _why:_
    > 不同的环境可能需要不同的数据，token，接口，端口号等。

* 从环境变量中加载你的部署的特殊配置，不要将作为常量放入代码库中。

    _why:_
    > 你也许有tokens, 密码和其他重要的信息放在其中，你的配置信息应该从应用实现中分离出来，这样app的内部代码可以随时开源。[参考这个例子](https://github.com/wearehive/project-guidelines/blob/master/config.sample.js)

    _how:_
    > 使用`.env`文件去存储你的变量，然后将其放入`.gitigore`中忽略掉，将一个example作为替代进行提交，可以当做参考。生产环境中你应该仍然用标准的方法设置环境变量。[更多](https://medium.com/@rafaelvidaurre/managing-environment-variables-in-node-js-2cb45a55195f)


* 被推荐的方式是在应用启动之前先进行环境变量的验证，[参考这个例子](https://github.com/wearehive/project-guidelines/blob/master/configWithTest.sample.js)中使用`joi`来验证提供的变量。

### 3.1 保持一致的开发环境。

* 在`package.json`文件的`engines`字段中设置你的Node版本，
    _why:_
    > 这让其他人能够知道该项目使用的具体node版本。[关于更多engines](https://docs.npmjs.com/files/package.json#engines)可以参考npm的文档。

* 此外，使用`nvm`以及在项目根目录下创建`.nvmrc`文件，不要忘记在文档中声明。

    _why:_
    > 任何使用nvm的人都可以使用`nvm use`操作来自由的切换node版本。[更多nvm的信息](https://github.com/creationix/nvm)

* 你还可以使用`preinstall`的一个npm 脚本来检查node和npm的版本。

    _why:_
    > 一些依赖可能会由于太新的node版本而导致安装失败。

* 使用 `Docker images`来使事情变得不那么复杂。[更多](https://hackernoon.com/how-to-dockerize-a-node-js-application-4fbab45a0c19)

* 本地安装包而不是全局安装。


## 4. 依赖 <a name="依赖"></a>

在使用一个包之前，先看看它的github主页，看下打开的`issues`的数量，每日的下载量和贡献者的数量，以及这个包最近一次更新的日期。

* 如果你需要引入一些不太知名的库，在使用之前最好在团队中进行讨论。

* 记录了解你当前正在使用的包。例如，`npm ls --depth=0` 可以看到当前项目所有的顶级依赖包。 [关于更多](https://docs.npmjs.com/cli/ls)

* 注意你的所有包中是否有未使用的和与项目不想关的。[关于更多](https://www.npmjs.com/package/depcheck)

* 注意包的下载统计来确定是否这个包正在被社区重度使用过. `npm-stat`[关于更多...](https://npm-stat.com/)

    _why:_
    > 更多的使用者意味着更多的贡献者，也通常意味着这个包的维护性更好，结果意味着这个包的Bug会被更快的发现和修复。

* 检查这个依赖是否有一个好的，成熟的频繁的版本发布，`npm view async`. [关于更多...](https://docs.npmjs.com/cli/view)

* 始终确保你的应用在最新的依赖版本下正常工作。`npm outdated`可以用来检查是否依赖有新的版本发布[关于更多...](https://docs.npmjs.com/cli/outdated)

    _why:_
    > 包的更新有时候会包含一些不能向下兼容的改变，因此你应该尽可能快的了解这些更新内容个，始终去检查它们的发布日志，一个接一个的更新你的依赖，这将使得问题检查更加容易（如果真的有不向下兼容的更新发生），使用一些屌屌的工具来帮助你完成这些事情。例如[npm-check-updates](https://github.com/tjunnone/npm-check-updates).

* 检查安装的包是否有已知的安全漏洞,例如[Snyk](https://snyk.io/test?utm_source=risingstack_blog).

### 4.1 保持一致的依赖(`dependencies`)

* 确保你的团队成员得到和你保持一致的依赖

    怎么做：
    > 使用`npm@5`或者更高版本的`package-lock.json`

    如果你没有npm，你可以选择使用`yarn`，并且在README中声明使用的工具，你的版本锁文件和`package.json`文件应该在依赖更新之后有同样的版本。

    如果你不喜欢`yarn`，在老版本中的npm中，当安装一个新的依赖的时候使用`-save --save-exact`，并且在发布之前创建`shinkwrap.json`文件.[read more...](https://docs.npmjs.com/files/package-locks)


## 5. 测试 <a name="测试"></a>

* 如果需要的话，部署一个测试环境。

    为什么：
    > 一些人认为测试环境为了单元测试，而端到端测试在生产环境上测试就可以了，然后这句号只有部分是对的，这有一些例外。一个例子是你也许不想在生产环境下激活分析信息去用测试数据污染其他人的显示器。

* 将你的测试文件放在被测试的模块旁边，并且使用`*.test.js`和`*.spec.js`的命名约定，例如`moduleName.spec.js`。

    为什么：
    > 每次你想找到一个单元测试文件的时候你绝对不想去层层的打开一些文件夹，此外，这种命名约定是现在的标准格式，能够被绝大多数的js测试框架识别。

* 将一些额外的测试文件分离到一个单独的测试文件夹中以避免困扰。

    为什么：
    > 一些测试文件不是具体的与某个指定的文件相关联，你可以将其放在其他开发者最有可能找到的地方：`__test__`文件夹，这个名字：`__test__`也是标准的，能够被大多数的测试框架识别到。

* 写出具有可测试性的代码，避免副作用，分离副作用，尽量的编写纯函数。

    为什么：
    > 将你的业务逻辑作为一个单独的单元进行测试。你必须将不可测性的代码和不确定性的过程的影响最小化。[read more...](https://medium.com/javascript-scene/tdd-the-rite-way-53c9b46f45e3)

* 不要写测试去检查类型，使用一个静态类型的检查器，例如`flow`

    >有时候你需要一个静态类型检查，它为你的代码增加一定程度的可靠性。[read more...](https://medium.freecodecamp.org/why-use-static-types-in-javascript-part-1-8382da1e0adb)

* 在将你的代码推送到`develop`分支之前先在本地跑通所有的测试

    > 因为你不想成为导致生产环境构建失败的那个人。

* 为测试写文档和说明


## 6.文件结构和命名 <a name="文件结构和命名"></a>

* 围绕产品功能、页面、组件来组织你的文件，而不是文件的角色（`html, css ,js`）。此外，将你的测试文件放在它们实现的旁边。


    **Bad**

    ```
    .
    ├── controllers
    |   ├── product.js
    |   └── user.js
    ├── models
    |   ├── product.js
    |   └── user.js
    ```

    **Good**

    ```
    .
    ├── product
    |   ├── index.js
    |   ├── product.js
    |   └── product.test.js
    ├── user
    |   ├── index.js
    |   ├── user.js
    |   └── user.test.js
    ```

    > 你可以创建将单一职责（包含具体实现，测试等功能）聚合到小的模块中，而不是一长串的文件列表。这更容易浏览，而且一眼就能找到你想要的文件。


* 使用一个`./config`文件进行配置，而不是为不同的环境写不同的配置文件。

    > [read more...](https://medium.com/@fedorHK/no-config-b3f1171eecd5)

* 将你的脚本文件放入`./scripts`文件夹中，这包含了`bash`和`node`的脚本文件。

    > 有很大的可能性你的项目中将会超过一个脚本文件，例如生产环境构建的脚本，开发构建的脚本，数据库的脚本等等。

* 将你的构建输出放到`./build`文件夹中，将`build/`放入`.gitignore`中。

    > 起一个你喜欢的名字，`dist`也很不错。 但是确保和你团队保持一致，里面可能有打包后的，编译后的，转义后的文件，你能够自动生成的，你的团队成员也应该能够生成，因此，没有必要将其提交到远程仓库，除非你特别的想要这样做。

* 使用`大驼峰（PascalCase）`和`小驼峰（camelCase）`来命名文件和文件夹，仅仅针对组件使用`大驼峰`。

* `CheckBox/index.js` 应该有 `CheckBox` 组件, 就和`CheckBox.js`一样, 但是**不要** `CheckBox/CheckBox.js` or `checkbox/CheckBox.js` 这样重复多余的写。

* 理想情况下每个文件夹的名字都应该和里面`index.js`的默认export的名字一样。

    > 这样你就简单的通过导入它的父文件夹就能够知道你导入的模块名。

## 7. 编码风格 <a name="编码风格"></a>


* 在新项目中使用 `stage-2` 或者更高的 现代javascript语法，在老的项目中和老的语法保持一致，除非你想将这个项目现代化。

    > 这完全取决于你，我们使用编译工具来提前享受新语法带来的好处，`stage-2`是更有可能经过小的调整而最终成为js规范的提案阶段。


* 在你构建过程中添加代码风格的检查。

    为什么：
    > 打断你的构建过程是一种强制将一些标准良好的代码风格应用到你的代码中的手段，它让你真正的开始严肃对待风格检查。 在客户端和服务端代码中都应该这样做。
    [read more...](https://www.robinwieruch.de/react-eslint-webpack-babel/)

* 使用 [ESLint - Pluggable JavaScript linter](http://eslint.org/) 来实施代码风格检查。

    > 我们更偏好`eslint`，你不必跟我们一样。它有更多数量的规则支持，能够配置这些规则和添加定制的规则。

* 我们使用  [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript) 来检查Js代码，[Read more](https://www.gitbook.com/book/duk/airbnb-javascript-guidelines/details).

* 当使用[flowType](https://flow.org/)做静态类型检查的时候，我们使用[eslint的插件来检查flow的语法](https://github.com/gajus/eslint-plugin-flowtype)


    > Flow 引入了一些新的语法，这些语法同样需要被检查。

* 使用 `.eslintignore` 来将你不需要检查的文件排除。

    > 当你不想要检查一些文件的时候，你不会想要用大量的`eslint-disable`注释来污染你的代码

* 在你提交PR之前取消掉`eslint-diabled`的注释。

    为什么：
    > 在你完全关注代码逻辑的时候你可能会禁止掉风格检查，
    这是很常规的做法，只是要记得移除这些注释，遵守检查的规则。

* 取决于任务的大小来使用`//TODO:` 注释或者`open a ticket`

    为什么：
    > 这样你能够提醒你自己或者其他人还有哪些小的工作没有做：（例如重构一个函数，更新注释），对于大的任务使用`//TOOD(#3456)`, 这种注释能够被一些lint的规则检查到而强制你去修改，这个数字代表了`open ticket`


* 总是随着代码的更迭来添加或者更新注释，将已经被注释的废弃代码删除（有git版本控制）.

    > 你的代码应该尽可能的具有可读性，所以去掉那些会影响可读性的东西，如果你在重构一个函数，不要老的函数仅仅注释掉，而是删除它们。

* 避免不相关的或者是为了搞笑的注释，日志命名等等。

* 写出具有可测试性的代码，避免副作用，分离副作用，尽量的编写纯函数。 [read more...](https://hackernoon.com/structure-your-javascript-code-for-testability-9bc93d9c72dc)

* 让你的命名更具有可搜索性，避免一些难以理解的简写命名，
对于函数，始终使用长的，描述性的名字，一个函数名字应该是一个动词或者动词词组，以显示该函数的意图。

    > 这让你的源码读起来更加自然。

* 通过`step-down`规则来组织你文件中的函数，高层级的函数应该在上，底层级的函数应该在下。


## 8. log日志 <a name="log日志"></a>

* 在正式环境中避免出现 console logs.

    > 确保你的代码检查工具给你关于log的警告。


## 9. API设计 <a name="API设计"></a>


* 我们大多数时候都遵循面向资源的设计原则，它有三个因素：
资源，集合，和URLs。

    * 一个资源拥有数据，关系和其他资源，以及操作它们的方法。
    * 一组资源就叫做一个集合
    *  URL用来识别一个资源的线上位置


    > 这是非常著名的设计准则，REST的核心理念就是资源，每个资源都有一个URL来标识，而你可以通过向该URL发送一个get请求来检索获取资源。

### 9.1 API命名

#### 9.1.1 给URL命名

* `/users`代表用户的集合。
* `/users/id` 代表一个资源，其中带有某个指定用户的信息。
* 一个url中的资源始终应该是复数，在你的资源URLs中不要带有动词。

* 对非资源的API使用动词， 在这种情况下，你的API不会返回任何资源，而是执行一个操作并返回操作的结果信息给客户端，你应该使用动词代替名词来清楚的区分两种响应（非资源响应和资源相关的响应）

<a name="操作资源"></a>
### 9.2 操作资源

#### 9.2.1 使用HTTP方法

在你的资源url中仅仅使用名词，避免`/addNewUser` or `/updateUser`这样的url, 用http方法来解释功能。

*　__GET__   用来检索资源
* __POST__　 用来创建一个新的资源或者子资源
* __PUT__    用来更新已经存在的资源
* __PATCH__  用来更新已经存在的资源，PATCH只会更新应用的区域
* __DELETE__    用来删除已经存在的资源

### 9.3 子资源

* **GET**       `/schools/2/students    `   Should get the list of all students from school 2
* **GET**       `/schools/2/students/31`    Should get the details of student 31, which belongs to school 2
* **DELETE**    `/schools/2/students/31`    Should delete student 31, which belongs to school 2
* **PUT**       `/schools/2/students/31`    Should update info of student 31, Use PUT on resource-URL only, not collection
* **POST**  `/schools `                     Should create a new school and return the details of the new school created. Use POST on collection-URLs


### 9.4 API版本控制

### 9.5 API反馈

#### 9.5.1 错误

响应信息必须具有自我描述性，一个号的错误信息响应应该看来像这样：

```json
{
"code": 1234,
"message" : "Something bad happened",
"description" : "More details"
}
```

或者是表单验证的错误：

```json
{
  "code" : 2314,
  "message" : "Validation Failed",
  "errors" : [
    {
      "code" : 1233,
      "field" : "email",
      "message" : "Invalid email"
    },
    {
       "code" : 1234,
       "field" : "password",
       "message" : "No password provided"
    }
  ]
}
```

#### 9.5.2 用HTTP状态码来匹配你的反馈信息。

##### 客户端和API都正常工作：

* `200 OK`这个响应对GET, PUT, POST请求来说代表成功
* `201 created`这个状态码应你该被返回无论何时一个实例被创建的时候，
* `204 NoContent`代表这些请求是成功的被处理过的，但是没有返回任何的内容。

##### 客户端错误：

* `400 Bad Request` 表明这个请求没有被处理，因为服务端不知道请求的内容。
* `401 Unauthorized` 表明请求缺少有效的认证信息来读取资源
* `403 Forbidden` 表明请求是有效的并且经过认证的，但是客户端因为某些原因被禁止接受资源。
* `404 Not Found` 表明请求的资源没有找到。
* `406 Not Acceptable` 匹配在Accept-Charset和Accept-Language标头中定义的可接受值列表的响应无法提供。
* `409 Conflict` 请求无法完成由于与目标资源的当前状态的冲突。
* `410 Gone` 表明了所请求的资源不再可用,已经被故意的永久移动了。


##### 服务端错误：
* `500 Internal Server Error` 表明了请求是有效的，但是服务端由于一些异常情况不能执行这个请求。
* `503 Service Unavailable` 表明服务器已经关闭了或者不在可用来接受或者处理请求，很有可能是服务器正在进行维护或者暂时性的负载。


#### 9.6 资源参数和元数据

#### 9.7 API安全

#### 9.8 API 文档

* 在这个[模板README](https://github.com/wearehive/project-guidelines/blob/master/README.sample.md)中填补上关于api的部分
* 用代码实例来描述API的鉴权方法
* 解释这个url的结构和类型

每个端点的解释：

* url参数，指明他们

```
Required: id=[integer]
Optional: photo_id=[alphanumeric]
```

* 成功的响应，成功的状态码？是否有返回数据？返回数据的格式，当人们需要知道他们的回调函数应该接受怎么样的参数时这些都是有用的

```
Code: 200
Content: { id : 12 }
```

* 错误响应，可能有许多种错误的情况，从未验权的请求到错误的参数等等。
所有这些应该被列出来，可能会有些重复，但有效的防止了假设的情况。

```json
{
    "code": 403,
    "message" : "Authentication failed",
    "description" : "Invalid username or password"
}
```

#### 9.8.1 API设计工具
这儿有许多的开源的API设计工具，例如[API Blueprint](https://apiblueprint.org/) 和 [Swagger](https://swagger.io/).

--------
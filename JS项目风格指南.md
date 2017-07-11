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

* 











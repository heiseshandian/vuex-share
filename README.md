### 介绍

本项目使用 vue-cli (4.4.1) 生成，选择的特性主要包含 ts + vue-class-component （让我们能够以 es6 class 的方式来写组件）。本项目主要用于讲解使用 vuex 过程中可能会遇到的一些坑 + vuex 源码解读。

### vuex 踩坑记录

#### 使用 registerModule 多次注册同一模块会导致后面再调用此模块下的 action 时连续触发多次

```js
import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

// 根模块
const store = new Vuex.Store({});

// 子模块-简便起见我们这里只定义个actions
const moduleA = {
  actions: {
    inc() {
      console.log("i was called");
    },
  },
};

// 多次注册子模块
store.registerModule("moduleA", moduleA);
store.registerModule("moduleA", moduleA);

// 调用一次 action
store.dispatch("inc");
```

实际上 action 被执行了两次

```sh
i was called
i was called
```

这个问题的出现原因是通过 registerModule 注册模块的时候并不会检查模块本身是否注册过，而 vuex 内部又是通过数组来收集 action 的，这就导致多次注册同一模块时 action 被加入到内部数组中多次。action 在 vuex 中被注册的简化代码如下：

```js
module.forEachAction((action, key) => {
  const type = action.root ? key : namespace + key;
  const handler = action.handler || action;
  registerAction(store, type, handler, local);
});

function registerAction(store, type, handler, local) {
  const entry = store._actions[type] || (store._actions[type] = []);
  entry.push(function wrappedActionHandler(payload) {
    // action参数注入等逻辑
  }
}
```

这里的 action 之所以是数组是 vuex 作者考虑到可能不同的模块需要对某一 action 做出响应，也就是说默认情况下不同模块的 action 是可以重名的，且默认注册在根命名空间下。比如说我们有个应用的不同页面被分成不同模块，然后用户切换账号的时候我们需要将不同页面上展示的资源都刷新掉，这时候就可以注册个名字叫做 refreshResource 的 action，各个模块可以实现自己的定制刷新逻辑，然后一次触发全部刷新。（默认情况下 mutation 也是注册在根命名空间下的），当然，也可以为 module 添加 namespaced 属性控制 vuex 不要将 action 和 mutation 注册在根命名空间下。

添加了 namespaced 属性的模块可以在 action 中添加 root 属性将 action 注册在根命名空间下

```js
const moduleA = {
  namespaced: true,
  actions: {
    foo: {
      root: true,
      handler (namespacedContext, payload) { ... }
    },
  },
};
```

### 如何实现一个精简版 vuex？

如果让我们来实现一个精简版的 vuex，我们会如何实现，思路是什么？

一种很简单的思路是我们定义一个全局对象，然后在所有 vue 组件中使用这个对象作为组件的状态，这样当全局对象变更时所有的 vue 实例都会得到通知。

以下实现来自 vue 官网 [state-management](https://vuejs.org/v2/guide/state-management.html)

```js
var sourceOfTruth = {};

var vmA = new Vue({
  data: sourceOfTruth,
});

var vmB = new Vue({
  data: sourceOfTruth,
});
```

当然，sourceOfTruth 本身没对组件对其修改做任何限制，这对于调试来说可能不太方便（组件可以随便变更状态，比如说 A 组件依赖于某个状态，但是 B 组件无意中改了这个状态，这就导致 A 组件 ui 被无意刷新了），我们可以约定下状态变更的方式。

以下实现来自 vue 官网 [state-management](https://vuejs.org/v2/guide/state-management.html)

```js
const store = {
  debug: true,
  state: {
    message: "Hello!",
  },
  setMessageAction(newValue) {
    if (this.debug) console.log("setMessageAction triggered with", newValue);
    this.state.message = newValue;
  },
  clearMessageAction() {
    if (this.debug) console.log("clearMessageAction triggered");
    this.state.message = "";
  },
};
```

业务端只能通过调用 action 的方式来改变状态，这样每一次状态变更就是可追踪的。

当然，上面的模式还有个问题就是每个组件都需要手动引入 store，使用体验可能不是很好，我们期望可以像 vuex 一样只注册一次，然后在每个 vue 组件中都可以使用。借助全局 mixin 的方式我们可以轻松实现类似功能。

```js
const store={...};

Vue.mixin({
  beforeCreate() {
    this.$store = store;
  },
});
```

这样在组件中使用的时候我们就可以直接使用 this.\$store 来访问全局 store 对象，而不用每次都手动引入。

```js
export default {
  data() {
    return this.$store;
  },
};
```

到这里其实已经和 vuex 的使用体验非常接近了，有个不同点是我们的 store 对象不是响应式的，当然，我们可以借助 vue 来让 store 变成响应式的。

```js
Vue.observable(store.state);
```

这样在组件中我们就可以通过计算属性的方式来引用 state 里面的属性值

```js
export default {
  computed: {
    message() {
      return this.$store.state.message;
    },
  },
};
```

至此，精简版 vuex 就实现完毕了，当然，为了绑定方便我们还可以添加 mapXXX 类函数。实现起来也不费事。大家可以自行实现下~

### vuex(3.5.1) 源码解读

#### 为什么要看 vuex 源码？

- 非常简短，看起来不费劲
- 业务上的特殊使用场景导致一些奇怪的 bug，不了解内部实现可能无法从根本上解决问题

#### install

通过 global mixin 的形式往每个 vue 实例下都挂个 $store 属性，这样就可以在每个 vue 组件里面通过 this.$store 访问 vuex，这么做主要是为了避免每次使用 vuex 都需要手动 import store。

```js
Vue.mixin({ beforeCreate: vuexInit });

function vuexInit() {
  const options = this.$options;
  // store injection
  if (options.store) {
    this.$store =
      typeof options.store === "function" ? options.store() : options.store;
  } else if (options.parent && options.parent.$store) {
    this.$store = options.parent.$store;
  }
}
```

#### state & getter

#### mutation

#### action

#### module

#### namespace

#### mapState,mapMutations,mapGetters,mapActions

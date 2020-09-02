### 介绍

本项目使用 `vue-cli (4.4.1)` 生成，选择的特性主要包含 `ts` + `vue-class-component` （让我们能够以 es6 class 的方式来写组件）。本项目主要用于讲解使用 `vuex` 过程中可能会遇到的一些坑 + `vuex` 源码解读。

### vuex 踩坑记录

#### 使用 `registerModule` 多次注册同一模块会导致后面再调用此模块下的 `action` 时连续触发多次

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

```sh
i was called
i was called
```

### vuex(3.5.1) 源码解读

#### 为什么要看 vuex 源码？

- 非常简短，看起来不费劲
- 业务上的特殊使用场景导致一些奇怪的 bug，不了解内部实现可能无法从根本上解决问题

#### install

通过 `global mixin` 的形式往每个 `vue` 实例下都挂个 `$store` 属性，这样就可以在每个 `vue` 组件里面通过 `this.$store` 访问 `vuex`，这么做主要是为了避免每次使用 `vuex` 都需要手动 `import` store。

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

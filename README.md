### 介绍

本项目使用 `vue-cli (4.4.1)` 生成，选择的特性主要包含 `ts` + `vue-class-component` （让我们能够以 es6 class 的方式来写组件）。本项目主要用于讲解使用 `vuex` 过程中可能会遇到的一些坑 + `vuex` 源码解读。

### vuex 踩坑记录

#### 重复注册模块导致 action 触发多次

- 根模块
  简便起见，我们的根状态只有个空对象

```ts
// store.ts
import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {},
});
```

- 子模块 a
  我们在子模块里面定义一个 action

```ts
// module-a.ts
export const moduleA = {
  namespaced: true,
  state: { countA: 1 },
  actions: {
    // 这里我们定义了一个action，action被调用的时候会在控制台打印一条日志
    inc({ commit, state }) {
      console.log("i was called");
      commit("UPDATE_COUNT", state.countA + 1);
    },
  },
  mutations: {
    UPDATE_COUNT(state, payload) {
      state.countA = payload;
    },
  },
};
```

- App.vue

```html
<script lang="ts">
  import { Component, Vue } from "vue-property-decorator";
  import { createNamespacedHelpers } from "vuex";
  import store from "./store";
  import { moduleA } from "./module-a";

  // 注册两次 moduleA
  store.registerModule("moduleA", moduleA);
  store.registerModule("moduleA", moduleA);
  const { mapActions } = createNamespacedHelpers("moduleA");

  @Component
  export default class App extends Vue {
    inc = mapActions(["inc"]).inc;

    created() {
      // 此处会调用两次我们在module-a中定义的 action
      this.inc();
    }
  }
</script>
```

```sh
i was called
i was called
```

### 如何实现个简化版的 vuex

抛开上面的问题，如果让我们来实现个精简版的 vuex，只有 state，没有 getters,actions,mutations 这些东西

### vuex 源码解读

#### install

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

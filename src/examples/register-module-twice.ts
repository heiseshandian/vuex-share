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
    }
  }
};

// 多次注册子模块
store.registerModule("moduleA", moduleA);
store.registerModule("moduleA", moduleA);

// 调用一次 action
store.dispatch("inc");

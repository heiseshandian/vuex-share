import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import { moduleA } from "./store/module-a";

store.registerModule("moduleA", moduleA);

Vue.config.productionTip = false;

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount("#app");

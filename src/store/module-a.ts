import { Module } from "vuex";

interface ModuleA {
  countA: number;
}

export const moduleA: Module<ModuleA, unknown> = {
  state: {
    countA: 1
  },
  actions: {
    inc({ state: { countA }, commit }) {
      console.log("i was called");
      commit("UPDATE_COUNT", countA + 1);
    }
  },
  mutations: {
    UPDATE_COUNT(state, payload) {
      state.countA = payload;
    }
  }
};

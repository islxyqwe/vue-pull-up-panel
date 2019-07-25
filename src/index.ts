import PullUpPanel from "./PullUpPanel.vue";
import Vue from "vue";

let installed = false;
export function install(v: any) {
  if (installed) return;
  installed = true;
  v.component("PullUpPanel", PullUpPanel);
}

// Create module definition for Vue.use()
const plugin = {
  install
};

if (typeof window !== "undefined" || typeof global !== "undefined") {
  Vue.use(plugin);
}
export default PullUpPanel;

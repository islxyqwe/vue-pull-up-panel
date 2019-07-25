(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('vue')) :
  typeof define === 'function' && define.amd ? define(['exports', 'vue'], factory) :
  (global = global || self, factory(global.VuePullUpPanel = {}, global.Vue));
}(this, function (exports, Vue) { 'use strict';

  Vue = Vue && Vue.hasOwnProperty('default') ? Vue['default'] : Vue;

  var performPhysicalMotion = (function () {
      function performPhysicalMotion(initial_velocity, target_getter, target_setter, force, stopper) {
          var _this = this;
          if (stopper === void 0) { stopper = function () { return false; }; }
          this.complete = false;
          this.velocity = initial_velocity;
          this.target = target_getter();
          this.target_setter = target_setter;
          this.force = force;
          this.stopper = stopper;
          this.lastTime = performance.now();
          requestAnimationFrame(function () { return _this.loop(); });
      }
      performPhysicalMotion.prototype.stop = function () {
          this.complete = true;
      };
      performPhysicalMotion.prototype.loop = function () {
          var _this = this;
          var now = performance.now();
          var delay = now - this.lastTime;
          this.lastTime = now;
          this.target = this.target + this.velocity * delay;
          this.target_setter(this.target);
          var f = this.force(this.velocity, this.target);
          this.velocity = this.velocity + f * delay;
          if (this.stopper(this.velocity, this.target))
              { this.complete = true; }
          if (Math.abs(f) < 1e-5 && this.velocity < 1e-5)
              { this.complete = true; }
          if (!this.complete) {
              requestAnimationFrame(function () { return _this.loop(); });
          }
      };
      return performPhysicalMotion;
  }());
  var script = Vue.extend({
      props: {
          height: {
              type: String,
              default: "90vh"
          },
          reservedHeight: {
              type: Number,
              default: 0
          },
          backgroundColor: {
              type: String,
              default: "rgba(255, 255, 255, 0.9)"
          },
          headerHeight: {
              type: Number,
              default: 24
          }
      },
      data: function () {
          return {
              x: 0,
              is_active: false,
              startpt: {
                  pageX: 0,
                  pageY: 0
              },
              start_x: 0,
              start_s: 0,
              last_event: {
                  pageX: 0,
                  pageY: 0,
                  time: 0,
                  vX: 0,
                  vY: 0
              },
              anim: null
          };
      },
      mounted: function () {
          var that = this;
          document.addEventListener("mousemove", function (event) {
              that.mm(event);
          });
          document.addEventListener("mouseup", function (event) {
              that.me(event);
          });
      },
      methods: {
          get_pos: function (event) {
              if (event instanceof MouseEvent) {
                  return event;
              }
              return event.touches[0];
          },
          moveTo: function (deltaY, start_x, start_s) {
              var height = this.$refs.body.offsetHeight - this.reservedHeight;
              var scale = height / 100;
              if (deltaY > 0) {
                  var next_x = start_x + deltaY / scale;
                  var overflow = next_x > 100 ? next_x - 100 : 0;
                  var next_s = start_s + overflow * scale;
                  var body = this.$refs.body;
                  var max_s = body.scrollHeight - body.offsetHeight;
                  body.scrollTop = Math.min(next_s, max_s);
                  this.x = Math.min(next_x, 100);
              }
              else {
                  var next_s = start_s + deltaY;
                  var overflow = next_s < 0 ? -next_s : 0;
                  var next_x = start_x - overflow / scale;
                  this.x = Math.max(next_x, 0);
                  this.$refs.body.scrollTop = Math.max(next_s, 0);
              }
          },
          touch_mm: function (e) {
              e.cancelable && e.preventDefault();
              this.mm(e);
          },
          mm: function (e) {
              if (!this.is_active)
                  { return; }
              var time = performance.now();
              if (e.screenX === 0 && e.screenY === 0)
                  { return; }
              var event = this.get_pos(e);
              this.last_event = {
                  pageX: event.pageX,
                  pageY: event.pageY,
                  time: time,
                  vX: (event.pageX - this.last_event.pageX) / (time - this.last_event.time),
                  vY: (event.pageY - this.last_event.pageY) / (time - this.last_event.time)
              };
              var deltaY = -(event.pageY - this.startpt.pageY);
              this.moveTo(deltaY, this.start_x, this.start_s);
          },
          ms: function (e) {
              if (this.anim)
                  { this.anim.stop(); }
              this.is_active = true;
              this.startpt = this.get_pos(e);
              this.start_x = this.x;
              this.start_s = this.$refs.body.scrollTop;
          },
          me: function (e) {
              var _this = this;
              this.is_active = false;
              var time = performance.now();
              if (this.x > 0 && this.x < 100) {
                  var velocity = time - this.last_event.time < 30 ? -this.last_event.vY : 0;
                  var height = this.$refs.body.offsetHeight - this.reservedHeight;
                  var scale_1 = height / 100;
                  this.anim = new performPhysicalMotion(velocity, function () { return _this.x * scale_1; }, function (val) {
                      _this.x = val < 0 ? 0 : Math.min(Math.round(val) / scale_1, 100);
                  }, function (v, x) {
                      var K = 0.001 / scale_1;
                      var half = 50 * scale_1;
                      var elasticForce = (half - Math.abs(x - half)) * K * (x > half ? 1 : -1);
                      var c = 2 * Math.pow(K, 0.5);
                      var viscousFriction = -v * 0.8 * c;
                      return elasticForce + viscousFriction;
                  }, function (_, x) { return x < 0 || x / scale_1 > 100; });
              }
              else if (time - this.last_event.time < 30 &&
                  this.$refs.body.scrollTop > 0) {
                  var velocity = -this.last_event.vY;
                  var target_1 = this.$refs.body;
                  var maxScroll_1 = target_1.scrollHeight - target_1.offsetHeight;
                  this.anim = new performPhysicalMotion(velocity, function () { return target_1.scrollTop; }, function (val) {
                      target_1.scrollTop = val < 0 ? 0 : Math.min(val, maxScroll_1);
                  }, function (v, _) { return (v > 0 ? -1 : 1) * 0.002; }, function (v, s) { return s < 0 || s > maxScroll_1 || Math.abs(v) < 0.1; });
              }
          },
          toggle: function () {
              if (this.x > 50) {
                  this.toggleDown();
              }
              else {
                  this.toggleUp();
              }
          },
          toggleUp: function () {
              var _this = this;
              if (this.anim)
                  { this.anim.stop(); }
              var height = this.$refs.body.offsetHeight - this.reservedHeight;
              var scale = height / 100;
              this.anim = new performPhysicalMotion(0, function () { return _this.x * scale; }, function (val) {
                  _this.x = val < 0 ? 0 : Math.min(Math.round(val) / scale, 100);
              }, function (v, x) {
                  var K = 0.0005 / scale;
                  var target = 100 * scale;
                  var elasticForce = (target - x) * K;
                  var c = 2 * Math.pow(K, 0.5);
                  var viscousFriction = -v * 0.8 * c;
                  return elasticForce + viscousFriction;
              }, function (_, x) { return x < 0 || x / scale > 100; });
          },
          toggleDown: function () {
              var _this = this;
              if (this.anim)
                  { this.anim.stop(); }
              var height = this.$refs.body.offsetHeight - this.reservedHeight;
              var scale = height / 100;
              this.anim = new performPhysicalMotion(0, function () { return _this.x * scale; }, function (val) {
                  _this.x = val < 0 ? 0 : Math.min(Math.round(val) / scale, 100);
              }, function (v, x) {
                  var K = 0.0005 / scale;
                  var elasticForce = -x * K;
                  var c = 2 * Math.pow(K, 0.5);
                  var viscousFriction = -v * 0.8 * c;
                  return elasticForce + viscousFriction;
              }, function (_, x) { return x < 0 || x / scale > 100; });
              this.$refs.body.scrollTo({
                  top: 0,
                  behavior: "smooth"
              });
          }
      }
  });

  function normalizeComponent(template, style, script, scopeId, isFunctionalTemplate, moduleIdentifier
  /* server only */
  , shadowMode, createInjector, createInjectorSSR, createInjectorShadow) {
    if (typeof shadowMode !== 'boolean') {
      createInjectorSSR = createInjector;
      createInjector = shadowMode;
      shadowMode = false;
    } // Vue.extend constructor export interop.


    var options = typeof script === 'function' ? script.options : script; // render functions

    if (template && template.render) {
      options.render = template.render;
      options.staticRenderFns = template.staticRenderFns;
      options._compiled = true; // functional template

      if (isFunctionalTemplate) {
        options.functional = true;
      }
    } // scopedId


    if (scopeId) {
      options._scopeId = scopeId;
    }

    var hook;

    if (moduleIdentifier) {
      // server build
      hook = function hook(context) {
        // 2.3 injection
        context = context || // cached call
        this.$vnode && this.$vnode.ssrContext || // stateful
        this.parent && this.parent.$vnode && this.parent.$vnode.ssrContext; // functional
        // 2.2 with runInNewContext: true

        if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
          context = __VUE_SSR_CONTEXT__;
        } // inject component styles


        if (style) {
          style.call(this, createInjectorSSR(context));
        } // register component module identifier for async chunk inference


        if (context && context._registeredComponents) {
          context._registeredComponents.add(moduleIdentifier);
        }
      }; // used by ssr in case component is cached and beforeCreate
      // never gets called


      options._ssrRegister = hook;
    } else if (style) {
      hook = shadowMode ? function () {
        style.call(this, createInjectorShadow(this.$root.$options.shadowRoot));
      } : function (context) {
        style.call(this, createInjector(context));
      };
    }

    if (hook) {
      if (options.functional) {
        // register for functional component in vue file
        var originalRender = options.render;

        options.render = function renderWithStyleInjection(h, context) {
          hook.call(context);
          return originalRender(h, context);
        };
      } else {
        // inject component registration as beforeCreate hook
        var existing = options.beforeCreate;
        options.beforeCreate = existing ? [].concat(existing, hook) : [hook];
      }
    }

    return script;
  }

  var normalizeComponent_1 = normalizeComponent;

  var isOldIE = typeof navigator !== 'undefined' && /msie [6-9]\\b/.test(navigator.userAgent.toLowerCase());
  function createInjector(context) {
    return function (id, style) {
      return addStyle(id, style);
    };
  }
  var HEAD;
  var styles = {};

  function addStyle(id, css) {
    var group = isOldIE ? css.media || 'default' : id;
    var style = styles[group] || (styles[group] = {
      ids: new Set(),
      styles: []
    });

    if (!style.ids.has(id)) {
      style.ids.add(id);
      var code = css.source;

      if (css.map) {
        // https://developer.chrome.com/devtools/docs/javascript-debugging
        // this makes source maps inside style tags work properly in Chrome
        code += '\n/*# sourceURL=' + css.map.sources[0] + ' */'; // http://stackoverflow.com/a/26603875

        code += '\n/*# sourceMappingURL=data:application/json;base64,' + btoa(unescape(encodeURIComponent(JSON.stringify(css.map)))) + ' */';
      }

      if (!style.element) {
        style.element = document.createElement('style');
        style.element.type = 'text/css';
        if (css.media) { style.element.setAttribute('media', css.media); }

        if (HEAD === undefined) {
          HEAD = document.head || document.getElementsByTagName('head')[0];
        }

        HEAD.appendChild(style.element);
      }

      if ('styleSheet' in style.element) {
        style.styles.push(code);
        style.element.styleSheet.cssText = style.styles.filter(Boolean).join('\n');
      } else {
        var index = style.ids.size - 1;
        var textNode = document.createTextNode(code);
        var nodes = style.element.childNodes;
        if (nodes[index]) { style.element.removeChild(nodes[index]); }
        if (nodes.length) { style.element.insertBefore(textNode, nodes[index]); }else { style.element.appendChild(textNode); }
      }
    }
  }

  var browser = createInjector;

  /* script */
  var __vue_script__ = script;

  /* template */
  var __vue_render__ = function() {
    var _vm = this;
    var _h = _vm.$createElement;
    var _c = _vm._self._c || _h;
    return _c(
      "div",
      {
        ref: "main",
        staticClass: "panel",
        style: {
          transform:
            "translateY(" +
            (100 - _vm.x) +
            "%) translateY(" +
            (-_vm.reservedHeight * (100 - _vm.x)) / 100 +
            "px)"
        },
        on: {
          mousedown: function($event) {
            return _vm.ms($event)
          },
          touchend: function($event) {
            return _vm.me($event)
          },
          touchmove: function($event) {
            return _vm.touch_mm($event)
          },
          touchstart: function($event) {
            return _vm.ms($event)
          }
        }
      },
      [
        _c(
          "div",
          {
            staticClass: "panel-header",
            style: { paddingTop: _vm.headerHeight + "px" }
          },
          [
            _c("div", {
              staticClass: "panel-bg",
              style: {
                backgroundColor: _vm.backgroundColor,
                borderTopLeftRadius: _vm.headerHeight / 2 + "px",
                borderTopRightRadius: _vm.headerHeight / 2 + "px"
              }
            }),
            _vm._v(" "),
            _c("div", {
              staticClass: "panel-handle",
              style: { height: _vm.headerHeight + "px" },
              on: { click: _vm.toggle }
            }),
            _vm._v(" "),
            _vm._t("header")
          ],
          2
        ),
        _vm._v(" "),
        _c(
          "div",
          {
            ref: "body",
            staticClass: "panel-body",
            style: { height: "" + _vm.height }
          },
          [_vm._t("default")],
          2
        )
      ]
    )
  };
  var __vue_staticRenderFns__ = [];
  __vue_render__._withStripped = true;

    /* style */
    var __vue_inject_styles__ = function (inject) {
      if (!inject) { return }
      inject("data-v-459214a1_0", { source: ".panel[data-v-459214a1] {\n  position: fixed;\n  bottom: 0px;\n  width: 100%;\n}\n.panel .panel-header[data-v-459214a1] {\n  position: absolute;\n  top: 0px;\n  width: 100%;\n  transform: translateY(-100%);\n  z-index: -1;\n}\n.panel .panel-header .panel-bg[data-v-459214a1] {\n  left: 0;\n  right: 0;\n  position: absolute;\n  width: 100%;\n  height: 100vh;\n  top: 0px;\n  border-top-left-radius: 16px;\n  border-top-right-radius: 16px;\n  box-shadow: 0 0 16px 0 rgba(0, 0, 0, 0.5);\n  z-index: -1;\n}\n.panel .panel-header .panel-handle[data-v-459214a1] {\n  position: absolute;\n  top: 0;\n  width: 100%;\n}\n.panel .panel-header .panel-handle[data-v-459214a1]:after {\n  content: \"\";\n  width: 15%;\n  height: 25%;\n  border-radius: 9999px;\n  position: absolute;\n  margin: auto auto;\n  top: 0;\n  bottom: 0;\n  left: 0;\n  right: 0;\n  background-color: rgba(60, 60, 60, 0.4);\n}\n.panel .panel-body[data-v-459214a1] {\n  overflow-y: scroll;\n}\n\n/*# sourceMappingURL=PullUpPanel.vue.map */", map: {"version":3,"sources":["F:\\vue-pull-up-panel\\src\\PullUpPanel.vue","PullUpPanel.vue"],"names":[],"mappings":"AA0BA;EACA,eAAA;EACA,WAAA;EACA,WAAA;ACzBA;AD0BA;EACA,kBAAA;EACA,QAAA;EACA,WAAA;EACA,4BAAA;EACA,WAAA;ACxBA;ADyBA;EACA,OAAA;EACA,QAAA;EACA,kBAAA;EACA,WAAA;EACA,aAAA;EACA,QAAA;EACA,4BAAA;EACA,6BAAA;EACA,yCAAA;EACA,WAAA;ACvBA;ADyBA;EACA,kBAAA;EACA,MAAA;EACA,WAAA;ACvBA;ADwBA;EACA,WAAA;EACA,UAAA;EACA,WAAA;EACA,qBAAA;EACA,kBAAA;EACA,iBAAA;EACA,MAAA;EACA,SAAA;EACA,OAAA;EACA,QAAA;EACA,uCAAA;ACtBA;AD0BA;EACA,kBAAA;ACxBA;;AAEA,0CAA0C","file":"PullUpPanel.vue","sourcesContent":[" <template>\r\n  <div\r\n    :style=\"{\r\n        transform:`translateY(${100-x}%) translateY(${-reservedHeight*(100-x)/100}px)`,\r\n    }\"\r\n    @mousedown=\"ms($event)\"\r\n    @touchend=\"me($event)\"\r\n    @touchmove=\"touch_mm($event)\"\r\n    @touchstart=\"ms($event)\"\r\n    class=\"panel\"\r\n    ref=\"main\"\r\n  >\r\n    <div :style=\"{paddingTop:headerHeight + 'px'}\" class=\"panel-header\">\r\n      <div\r\n        :style=\"{backgroundColor,borderTopLeftRadius:headerHeight/2 + 'px',borderTopRightRadius:headerHeight/2 + 'px'}\"\r\n        class=\"panel-bg\"\r\n      ></div>\r\n      <div :style=\"{height:headerHeight + 'px'}\" @click=\"toggle\" class=\"panel-handle\"></div>\r\n      <slot name=\"header\"></slot>\r\n    </div>\r\n    <div :style=\"{height:`${height}`}\" class=\"panel-body\" ref=\"body\">\r\n      <slot></slot>\r\n    </div>\r\n  </div>\r\n</template>\r\n<style scoped lang=\"scss\">\r\n.panel {\r\n  position: fixed;\r\n  bottom: 0px;\r\n  width: 100%;\r\n  .panel-header {\r\n    position: absolute;\r\n    top: 0px;\r\n    width: 100%;\r\n    transform: translateY(-100%);\r\n    z-index: -1;\r\n    .panel-bg {\r\n      left: 0;\r\n      right: 0;\r\n      position: absolute;\r\n      width: 100%;\r\n      height: 100vh;\r\n      top: 0px;\r\n      border-top-left-radius: 16px;\r\n      border-top-right-radius: 16px;\r\n      box-shadow: 0 0 16px 0 rgba(0, 0, 0, 0.5);\r\n      z-index: -1;\r\n    }\r\n    .panel-handle {\r\n      position: absolute;\r\n      top: 0;\r\n      width: 100%;\r\n      &:after {\r\n        content: \"\";\r\n        width: 15%;\r\n        height: 25%;\r\n        border-radius: 9999px;\r\n        position: absolute;\r\n        margin: auto auto;\r\n        top: 0;\r\n        bottom: 0;\r\n        left: 0;\r\n        right: 0;\r\n        background-color: rgba(60, 60, 60, 0.4);\r\n      }\r\n    }\r\n  }\r\n  .panel-body {\r\n    overflow-y: scroll;\r\n  }\r\n}\r\n</style>\r\n<script lang=\"ts\">\r\nimport Vue from \"vue\";\r\n\r\nclass performPhysicalMotion {\r\n  private velocity: number;\r\n  private lastTime: number;\r\n  private complete = false;\r\n  private target_setter: (value: number) => void;\r\n  private force: (velocity: number, target: number) => number;\r\n  private stopper: (velocity: number, target: number) => boolean;\r\n  private target: number;\r\n  constructor(\r\n    initial_velocity: number,\r\n    target_getter: () => number,\r\n    target_setter: (value: number) => void,\r\n    force: (velocity: number, target: number) => number,\r\n    stopper: (velocity: number, target: number) => boolean = () => false\r\n  ) {\r\n    this.velocity = initial_velocity;\r\n    this.target = target_getter();\r\n    this.target_setter = target_setter;\r\n    this.force = force;\r\n    this.stopper = stopper;\r\n    this.lastTime = performance.now();\r\n    requestAnimationFrame(() => this.loop());\r\n  }\r\n  public stop() {\r\n    this.complete = true;\r\n  }\r\n  public loop() {\r\n    const now = performance.now();\r\n    const delay = now - this.lastTime;\r\n    this.lastTime = now;\r\n    this.target = this.target + this.velocity * delay;\r\n    this.target_setter(this.target);\r\n    const f = this.force(this.velocity, this.target);\r\n    this.velocity = this.velocity + f * delay;\r\n    if (this.stopper(this.velocity, this.target)) this.complete = true;\r\n    if (Math.abs(f) < 1e-5 && this.velocity < 1e-5) this.complete = true;\r\n    if (!this.complete) {\r\n      requestAnimationFrame(() => this.loop());\r\n    }\r\n  }\r\n}\r\n\r\nexport default Vue.extend({\r\n  props: {\r\n    height: {\r\n      type: String,\r\n      default: \"90vh\"\r\n    },\r\n    reservedHeight: {\r\n      type: Number,\r\n      default: 0\r\n    },\r\n    backgroundColor: {\r\n      type: String,\r\n      default: \"rgba(255, 255, 255, 0.9)\"\r\n    },\r\n    headerHeight: {\r\n      type: Number,\r\n      default: 24\r\n    }\r\n  },\r\n  data() {\r\n    return {\r\n      x: 0,\r\n      is_active: false,\r\n      startpt: {\r\n        pageX: 0,\r\n        pageY: 0\r\n      },\r\n      start_x: 0,\r\n      start_s: 0,\r\n      last_event: {\r\n        pageX: 0,\r\n        pageY: 0,\r\n        time: 0,\r\n        vX: 0,\r\n        vY: 0\r\n      },\r\n      anim: null as any\r\n    };\r\n  },\r\n  mounted() {\r\n    const that = this;\r\n    document.addEventListener(\"mousemove\", event => {\r\n      that.mm(event);\r\n    });\r\n    document.addEventListener(\"mouseup\", event => {\r\n      that.me(event);\r\n    });\r\n  },\r\n\r\n  methods: {\r\n    get_pos(event: any) {\r\n      if (event instanceof MouseEvent) {\r\n        return event;\r\n      }\r\n      return event.touches[0];\r\n    },\r\n\r\n    moveTo(deltaY: number, start_x: number, start_s: number) {\r\n      const height =\r\n        (this.$refs.body as HTMLElement).offsetHeight - this.reservedHeight;\r\n      const scale = height / 100;\r\n      if (deltaY > 0) {\r\n        const next_x = start_x + deltaY / scale;\r\n        const overflow = next_x > 100 ? next_x - 100 : 0;\r\n        const next_s = start_s + overflow * scale;\r\n        const body = this.$refs.body as HTMLElement;\r\n        const max_s = body.scrollHeight - body.offsetHeight;\r\n        body.scrollTop = Math.min(next_s, max_s);\r\n        this.x = Math.min(next_x, 100);\r\n      } else {\r\n        const next_s = start_s + deltaY;\r\n        const overflow = next_s < 0 ? -next_s : 0;\r\n        const next_x = start_x - overflow / scale;\r\n        this.x = Math.max(next_x, 0);\r\n        (this.$refs.body as HTMLElement).scrollTop = Math.max(next_s, 0);\r\n      }\r\n    },\r\n    touch_mm(e: any) {\r\n      e.cancelable && e.preventDefault();\r\n      this.mm(e);\r\n    },\r\n    mm(e: any) {\r\n      if (!this.is_active) return;\r\n      const time = performance.now();\r\n      if (e.screenX === 0 && e.screenY === 0) return;\r\n      const event = this.get_pos(e);\r\n      this.last_event = {\r\n        pageX: event.pageX,\r\n        pageY: event.pageY,\r\n        time,\r\n        vX:\r\n          (event.pageX - this.last_event.pageX) / (time - this.last_event.time),\r\n        vY:\r\n          (event.pageY - this.last_event.pageY) / (time - this.last_event.time)\r\n      };\r\n      const deltaY = -(event.pageY - this.startpt.pageY);\r\n      this.moveTo(deltaY, this.start_x, this.start_s);\r\n    },\r\n    ms(e: any) {\r\n      if (this.anim) this.anim.stop();\r\n      this.is_active = true;\r\n      this.startpt = this.get_pos(e);\r\n      this.start_x = this.x;\r\n      this.start_s = (this.$refs.body as Element).scrollTop;\r\n    },\r\n    me(e: any) {\r\n      this.is_active = false;\r\n      const time = performance.now();\r\n      if (this.x > 0 && this.x < 100) {\r\n        const velocity =\r\n          time - this.last_event.time < 30 ? -this.last_event.vY : 0;\r\n        const height =\r\n          (this.$refs.body as HTMLElement).offsetHeight - this.reservedHeight;\r\n        const scale = height / 100;\r\n        this.anim = new performPhysicalMotion(\r\n          velocity,\r\n          () => this.x * scale,\r\n          val => {\r\n            this.x = val < 0 ? 0 : Math.min(Math.round(val) / scale, 100);\r\n          },\r\n          (v, x) => {\r\n            const K = 0.001 / scale;\r\n            const half = 50 * scale;\r\n            const elasticForce =\r\n              (half - Math.abs(x - half)) * K * (x > half ? 1 : -1);\r\n            const c = 2 * K ** 0.5;\r\n            const viscousFriction = -v * 0.8 * c;\r\n            return elasticForce + viscousFriction;\r\n          },\r\n          (_, x) => x < 0 || x / scale > 100\r\n        );\r\n      } else if (\r\n        time - this.last_event.time < 30 &&\r\n        (this.$refs.body as HTMLElement).scrollTop > 0\r\n      ) {\r\n        const velocity = -this.last_event.vY;\r\n        const target = this.$refs.body as HTMLElement;\r\n        const maxScroll = target.scrollHeight - target.offsetHeight;\r\n        const f = 0.002;\r\n        this.anim = new performPhysicalMotion(\r\n          velocity,\r\n          () => target.scrollTop,\r\n          val => {\r\n            target.scrollTop = val < 0 ? 0 : Math.min(val, maxScroll);\r\n          },\r\n          (v, _) => (v > 0 ? -1 : 1) * 0.002,\r\n          (v, s) => s < 0 || s > maxScroll || Math.abs(v) < 0.1\r\n        );\r\n      }\r\n    },\r\n    toggle() {\r\n      if (this.x > 50) {\r\n        this.toggleDown();\r\n      } else {\r\n        this.toggleUp();\r\n      }\r\n    },\r\n    toggleUp() {\r\n      if (this.anim) this.anim.stop();\r\n      const height =\r\n        (this.$refs.body as HTMLElement).offsetHeight - this.reservedHeight;\r\n      const scale = height / 100;\r\n      this.anim = new performPhysicalMotion(\r\n        0,\r\n        () => this.x * scale,\r\n        val => {\r\n          this.x = val < 0 ? 0 : Math.min(Math.round(val) / scale, 100);\r\n        },\r\n        (v, x) => {\r\n          const K = 0.0005 / scale;\r\n          const target = 100 * scale;\r\n          const elasticForce = (target - x) * K;\r\n          const c = 2 * K ** 0.5;\r\n          const viscousFriction = -v * 0.8 * c;\r\n          return elasticForce + viscousFriction;\r\n        },\r\n        (_, x) => x < 0 || x / scale > 100\r\n      );\r\n    },\r\n    toggleDown() {\r\n      if (this.anim) this.anim.stop();\r\n      const height =\r\n        (this.$refs.body as HTMLElement).offsetHeight - this.reservedHeight;\r\n      const scale = height / 100;\r\n      this.anim = new performPhysicalMotion(\r\n        0,\r\n        () => this.x * scale,\r\n        val => {\r\n          this.x = val < 0 ? 0 : Math.min(Math.round(val) / scale, 100);\r\n        },\r\n        (v, x) => {\r\n          const K = 0.0005 / scale;\r\n          const elasticForce = -x * K;\r\n          const c = 2 * K ** 0.5;\r\n          const viscousFriction = -v * 0.8 * c;\r\n          return elasticForce + viscousFriction;\r\n        },\r\n        (_, x) => x < 0 || x / scale > 100\r\n      );\r\n      (this.$refs.body as HTMLElement).scrollTo({\r\n        top: 0,\r\n        behavior: \"smooth\"\r\n      });\r\n    }\r\n  }\r\n});\r\n</script>\r\n",".panel {\n  position: fixed;\n  bottom: 0px;\n  width: 100%;\n}\n.panel .panel-header {\n  position: absolute;\n  top: 0px;\n  width: 100%;\n  transform: translateY(-100%);\n  z-index: -1;\n}\n.panel .panel-header .panel-bg {\n  left: 0;\n  right: 0;\n  position: absolute;\n  width: 100%;\n  height: 100vh;\n  top: 0px;\n  border-top-left-radius: 16px;\n  border-top-right-radius: 16px;\n  box-shadow: 0 0 16px 0 rgba(0, 0, 0, 0.5);\n  z-index: -1;\n}\n.panel .panel-header .panel-handle {\n  position: absolute;\n  top: 0;\n  width: 100%;\n}\n.panel .panel-header .panel-handle:after {\n  content: \"\";\n  width: 15%;\n  height: 25%;\n  border-radius: 9999px;\n  position: absolute;\n  margin: auto auto;\n  top: 0;\n  bottom: 0;\n  left: 0;\n  right: 0;\n  background-color: rgba(60, 60, 60, 0.4);\n}\n.panel .panel-body {\n  overflow-y: scroll;\n}\n\n/*# sourceMappingURL=PullUpPanel.vue.map */"]}, media: undefined });

    };
    /* scoped */
    var __vue_scope_id__ = "data-v-459214a1";
    /* module identifier */
    var __vue_module_identifier__ = undefined;
    /* functional template */
    var __vue_is_functional_template__ = false;
    /* style inject SSR */
    

    
    var PullUpPanel = normalizeComponent_1(
      { render: __vue_render__, staticRenderFns: __vue_staticRenderFns__ },
      __vue_inject_styles__,
      __vue_script__,
      __vue_scope_id__,
      __vue_is_functional_template__,
      __vue_module_identifier__,
      browser,
      undefined
    );

  var installed = false;
  function install(v) {
      if (installed)
          { return; }
      installed = true;
      v.component("PullUpPanel", PullUpPanel);
  }
  var plugin = {
      install: install
  };
  if (typeof window !== "undefined" || typeof global !== "undefined") {
      Vue.use(plugin);
  }

  exports.default = PullUpPanel;
  exports.install = install;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=vue_pull_up_panel.js.map

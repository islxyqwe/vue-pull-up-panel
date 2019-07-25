# vue-pull-up-panel

A vue component to imitate the drawer in iOS 10 Map app.

## Live Demo

https://islxyqwe.github.io/vue-pull-up-panel/

## Install

### via yarn/npm

```bash
yarn add https://github.com/islxyqwe/vue-pull-up-panel
```

Then register the component

```js
import PullUpPanel from 'vue-pull-up-panel'
Vue.use(PullUpPanel)
```

### in browser

```html
<script src="https://raw.githubusercontent.com/islxyqwe/vue-pull-up-panel/master/dist/vue_pull_up_panel.js"></script>
```

## Usage

### component

```html
<pull-up-panel style="z-index:2;" height="80vh" reservedHeight="100" backgroundColor="rgba(255,255,255,0.9)" headerHeight="24" ref="panel">
  <div slot="header">
    Elements that in header (e.g. search bar)
  </div>
  Elements that in body
</pull-up-panel>
```

### methods

```js
this.$refs.panel.toggleUp() //show the panel
this.$refs.panel.toggleDown() //hide the panel
```

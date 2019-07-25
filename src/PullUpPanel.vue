 <template>
  <div
    :style="{
        transform:`translateY(${100-x}%) translateY(${-reservedHeight*(100-x)/100}px)`,
    }"
    @mousedown="ms($event)"
    @touchend="me($event)"
    @touchmove="touch_mm($event)"
    @touchstart="ms($event)"
    class="panel"
    ref="main"
  >
    <div :style="{paddingTop:headerHeight + 'px'}" class="panel-header">
      <div
        :style="{backgroundColor,borderTopLeftRadius:headerHeight/2 + 'px',borderTopRightRadius:headerHeight/2 + 'px'}"
        class="panel-bg"
      ></div>
      <div :style="{height:headerHeight + 'px'}" @click="toggle" class="panel-handle"></div>
      <slot name="header"></slot>
    </div>
    <div :style="{height:`${height}`}" class="panel-body" ref="body">
      <slot></slot>
    </div>
  </div>
</template>
<style scoped lang="scss">
.panel {
  position: fixed;
  bottom: 0px;
  width: 100%;
  .panel-header {
    position: absolute;
    top: 0px;
    width: 100%;
    transform: translateY(-100%);
    z-index: -1;
    .panel-bg {
      left: 0;
      right: 0;
      position: absolute;
      width: 100%;
      height: 100vh;
      top: 0px;
      border-top-left-radius: 16px;
      border-top-right-radius: 16px;
      box-shadow: 0 0 16px 0 rgba(0, 0, 0, 0.5);
      z-index: -1;
    }
    .panel-handle {
      position: absolute;
      top: 0;
      width: 100%;
      &:after {
        content: "";
        width: 15%;
        height: 25%;
        border-radius: 9999px;
        position: absolute;
        margin: auto auto;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        background-color: rgba(60, 60, 60, 0.4);
      }
    }
  }
  .panel-body {
    overflow-y: scroll;
  }
}
</style>
<script lang="ts">
import Vue from "vue";

class performPhysicalMotion {
  private velocity: number;
  private lastTime: number;
  private complete = false;
  private target_setter: (value: number) => void;
  private force: (velocity: number, target: number) => number;
  private stopper: (velocity: number, target: number) => boolean;
  private target: number;
  constructor(
    initial_velocity: number,
    target_getter: () => number,
    target_setter: (value: number) => void,
    force: (velocity: number, target: number) => number,
    stopper: (velocity: number, target: number) => boolean = () => false
  ) {
    this.velocity = initial_velocity;
    this.target = target_getter();
    this.target_setter = target_setter;
    this.force = force;
    this.stopper = stopper;
    this.lastTime = performance.now();
    requestAnimationFrame(() => this.loop());
  }
  public stop() {
    this.complete = true;
  }
  public loop() {
    const now = performance.now();
    const delay = now - this.lastTime;
    this.lastTime = now;
    this.target = this.target + this.velocity * delay;
    this.target_setter(this.target);
    const f = this.force(this.velocity, this.target);
    this.velocity = this.velocity + f * delay;
    if (this.stopper(this.velocity, this.target)) this.complete = true;
    if (Math.abs(f) < 1e-5 && this.velocity < 1e-5) this.complete = true;
    if (!this.complete) {
      requestAnimationFrame(() => this.loop());
    }
  }
}

export default Vue.extend({
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
  data() {
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
      anim: null as any
    };
  },
  mounted() {
    const that = this;
    document.addEventListener("mousemove", event => {
      that.mm(event);
    });
    document.addEventListener("mouseup", event => {
      that.me(event);
    });
  },

  methods: {
    get_pos(event: any) {
      if (event instanceof MouseEvent) {
        return event;
      }
      return event.touches[0];
    },

    moveTo(deltaY: number, start_x: number, start_s: number) {
      const height =
        (this.$refs.body as HTMLElement).offsetHeight - this.reservedHeight;
      const scale = height / 100;
      if (deltaY > 0) {
        const next_x = start_x + deltaY / scale;
        const overflow = next_x > 100 ? next_x - 100 : 0;
        const next_s = start_s + overflow * scale;
        const body = this.$refs.body as HTMLElement;
        const max_s = body.scrollHeight - body.offsetHeight;
        body.scrollTop = Math.min(next_s, max_s);
        this.x = Math.min(next_x, 100);
      } else {
        const next_s = start_s + deltaY;
        const overflow = next_s < 0 ? -next_s : 0;
        const next_x = start_x - overflow / scale;
        this.x = Math.max(next_x, 0);
        (this.$refs.body as HTMLElement).scrollTop = Math.max(next_s, 0);
      }
    },
    touch_mm(e: any) {
      e.cancelable && e.preventDefault();
      this.mm(e);
    },
    mm(e: any) {
      if (!this.is_active) return;
      const time = performance.now();
      if (e.screenX === 0 && e.screenY === 0) return;
      const event = this.get_pos(e);
      this.last_event = {
        pageX: event.pageX,
        pageY: event.pageY,
        time,
        vX:
          (event.pageX - this.last_event.pageX) / (time - this.last_event.time),
        vY:
          (event.pageY - this.last_event.pageY) / (time - this.last_event.time)
      };
      const deltaY = -(event.pageY - this.startpt.pageY);
      this.moveTo(deltaY, this.start_x, this.start_s);
    },
    ms(e: any) {
      if (this.anim) this.anim.stop();
      this.is_active = true;
      this.startpt = this.get_pos(e);
      this.start_x = this.x;
      this.start_s = (this.$refs.body as Element).scrollTop;
    },
    me(e: any) {
      this.is_active = false;
      const time = performance.now();
      if (this.x > 0 && this.x < 100) {
        const velocity =
          time - this.last_event.time < 30 ? -this.last_event.vY : 0;
        const height =
          (this.$refs.body as HTMLElement).offsetHeight - this.reservedHeight;
        const scale = height / 100;
        this.anim = new performPhysicalMotion(
          velocity,
          () => this.x * scale,
          val => {
            this.x = val < 0 ? 0 : Math.min(Math.round(val) / scale, 100);
          },
          (v, x) => {
            const K = 0.001 / scale;
            const half = 50 * scale;
            const elasticForce =
              (half - Math.abs(x - half)) * K * (x > half ? 1 : -1);
            const c = 2 * K ** 0.5;
            const viscousFriction = -v * 0.8 * c;
            return elasticForce + viscousFriction;
          },
          (_, x) => x < 0 || x / scale > 100
        );
      } else if (
        time - this.last_event.time < 30 &&
        (this.$refs.body as HTMLElement).scrollTop > 0
      ) {
        const velocity = -this.last_event.vY;
        const target = this.$refs.body as HTMLElement;
        const maxScroll = target.scrollHeight - target.offsetHeight;
        const f = 0.002;
        this.anim = new performPhysicalMotion(
          velocity,
          () => target.scrollTop,
          val => {
            target.scrollTop = val < 0 ? 0 : Math.min(val, maxScroll);
          },
          (v, _) => (v > 0 ? -1 : 1) * 0.002,
          (v, s) => s < 0 || s > maxScroll || Math.abs(v) < 0.1
        );
      }
    },
    toggle() {
      if (this.x > 50) {
        this.toggleDown();
      } else {
        this.toggleUp();
      }
    },
    toggleUp() {
      if (this.anim) this.anim.stop();
      const height =
        (this.$refs.body as HTMLElement).offsetHeight - this.reservedHeight;
      const scale = height / 100;
      this.anim = new performPhysicalMotion(
        0,
        () => this.x * scale,
        val => {
          this.x = val < 0 ? 0 : Math.min(Math.round(val) / scale, 100);
        },
        (v, x) => {
          const K = 0.0005 / scale;
          const target = 100 * scale;
          const elasticForce = (target - x) * K;
          const c = 2 * K ** 0.5;
          const viscousFriction = -v * 0.8 * c;
          return elasticForce + viscousFriction;
        },
        (_, x) => x < 0 || x / scale > 100
      );
    },
    toggleDown() {
      if (this.anim) this.anim.stop();
      const height =
        (this.$refs.body as HTMLElement).offsetHeight - this.reservedHeight;
      const scale = height / 100;
      this.anim = new performPhysicalMotion(
        0,
        () => this.x * scale,
        val => {
          this.x = val < 0 ? 0 : Math.min(Math.round(val) / scale, 100);
        },
        (v, x) => {
          const K = 0.0005 / scale;
          const elasticForce = -x * K;
          const c = 2 * K ** 0.5;
          const viscousFriction = -v * 0.8 * c;
          return elasticForce + viscousFriction;
        },
        (_, x) => x < 0 || x / scale > 100
      );
      (this.$refs.body as HTMLElement).scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }
  }
});
</script>

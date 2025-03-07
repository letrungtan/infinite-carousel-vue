<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, useSlots, ref, watch, type Slots, type VNode } from 'vue';
import { chevronUp } from './assets/icons.ts';

// Define the props with TypeScript interfaces
interface Props {
  itemPerSlide?: number;
  itemPerMove?: number;
  duration?: number;
  className?: string;
  showPagination?: boolean;
  showNavigation?: boolean;
  infinite?: boolean;
  infiniteOnWipe?: boolean;
  noBoundaries?: boolean;
  autoplay?: boolean;
  autoplayInterval?: number;
  autoplayDirection?: 'forward' | 'backward';
  height?: string
}

const props = withDefaults(defineProps<Props>(), {
  itemPerSlide: 1,
  itemPerMove: 1,
  duration: 500,
  className: '',
  showPagination: true,
  showNavigation: true,
  infinite: true,
  infiniteOnWipe: false,
  noBoundaries: false,
  autoplay: false,
  autoplayInterval: 2000,
  autoplayDirection: 'forward',
  height: ''
});

const emit = defineEmits<{
  (event: 'itemChange', value: number): void;
  (event: 'slideChange', value: number): void;
}>();

const slots: Slots = useSlots();
const slotsDefault: VNode[] = slots?.default?.() || [];
const fgt: VNode | undefined = slotsDefault.find((item: VNode) => item.type.toString() === 'Symbol(v-fgt)');
const list: VNode[] = fgt && fgt.children ? (fgt.children as VNode[]) : slotsDefault;

const viewportRef = ref<HTMLElement | null>(null);

interface State {
  currentItem: number;
  viewportWidth: number;
  disableTransition: boolean;
  sliding: boolean;
  translateXOnTouch: number;
  autoplayInterval: number;
}

const state = reactive<State>({
  currentItem: 0,
  viewportWidth: 0,
  disableTransition: true,
  sliding: false,
  translateXOnTouch: 0,
  autoplayInterval: 0,
});

let transitionEndPromiseResolver: (value: void | PromiseLike<void>) => void

// Computed properties
const currentSlide = computed({
  get(): number {
    return Math.ceil(state.currentItem / props.itemPerSlide);
  },
  set(value: number) {
    state.currentItem = value * props.itemPerSlide;
  },
});

const trackStyle = computed(() => {
  const translateX = -(state.currentItem + totalClone.value) * (state.viewportWidth / props.itemPerSlide) + state.translateXOnTouch;
  return {
    transform: `translate3D(${translateX}px, 0, 0)`,
    transition: state.disableTransition ? 'none' : `${props.duration / 1000}s`,
  };
});

const viewportStyle = computed(() => {  
  return {
    aspectRatio: !props.height ? '16/9' : 'unset',
    height: !props.height ? 'unset' : props.height
  };
});

const onTransitionEnd = () => {
  transitionEndPromiseResolver?.();
};

const itemStyle = computed(() => ({
  minWidth: `${100 / props.itemPerSlide}%`,
  maxWidth: `${100 / props.itemPerSlide}%`,
}));

const totalItem = computed(() => list.length);
const totalSlide = computed(() => Math.ceil(list.length / props.itemPerSlide));
const totalClone = computed(() => props.itemPerMove * Math.ceil(props.itemPerSlide / props.itemPerMove));
const isBlockPrev = computed(() => !props.infinite && state.currentItem <= 0);
const isBlockNext = computed(() => !props.infinite && state.currentItem >= totalItem.value - props.itemPerSlide);

// Methods
const prev = async (forceSlide?: boolean, noInfinite?: boolean): Promise<void> => {
  if ((state.sliding && !forceSlide) || isBlockPrev.value) return;

  if (state.currentItem > -props.itemPerSlide) {
    if (!props.noBoundaries && state.currentItem - props.itemPerMove < 0 && state.currentItem > 0) {
      state.currentItem = 0;
    } else {
      state.currentItem -= props.itemPerMove;
    }

    state.sliding = true;
    await new Promise<void>((resolve) => (transitionEndPromiseResolver = resolve));
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    state.sliding = false;

    if (!noInfinite && state.currentItem <= -props.itemPerSlide) {
      state.disableTransition = true;
      state.currentItem += totalItem.value;
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      await nextTick();
      state.disableTransition = false;
    }
  }
};

const next = async (forceSlide?: boolean, noInfinite?: boolean): Promise<void> => {
  if ((state.sliding && !forceSlide) || isBlockNext.value) return;

  if (state.currentItem <= totalItem.value - 1) {
    if (
      !props.noBoundaries &&
      state.currentItem + props.itemPerMove > totalItem.value - 1 - props.itemPerMove &&
      state.currentItem + props.itemPerSlide < totalItem.value
    ) {
      state.currentItem = totalItem.value - props.itemPerSlide;
    } else {
      state.currentItem += props.itemPerMove;
    }

    state.sliding = true;
    await new Promise<void>((resolve) => (transitionEndPromiseResolver = resolve));
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    state.sliding = false;

    if (!noInfinite && state.currentItem > totalItem.value - 1) {
      state.disableTransition = true;
      state.currentItem -= totalItem.value;
      await nextTick();
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      state.disableTransition = false;
    }
  }
};

const goToSlide = (slide: number): void => {
  if (state.sliding || slide === currentSlide.value) return;

  if (
    slide < currentSlide.value &&
    state.currentItem - props.itemPerMove < 0 &&
    state.currentItem > 0
  ) {
    state.currentItem = 0;
  } else if (
    slide > currentSlide.value &&
    state.currentItem + props.itemPerMove > totalItem.value - 1 - props.itemPerMove &&
    state.currentItem + props.itemPerSlide < totalItem.value
  ) {
    state.currentItem = totalItem.value - props.itemPerSlide;
  } else {
    currentSlide.value = slide;
  }

  state.sliding = true;
  setTimeout(() => {
    state.sliding = false;
  }, 500);
};

const isDotActive = (index: number): boolean => {
  const currentDisplaySlide = currentSlide.value < 0
    ? totalSlide.value - 1
    : currentSlide.value > totalSlide.value - 1
      ? 0
      : currentSlide.value;

  return index === currentDisplaySlide;
};

const getLoopIndex = <T>(arr: T[], index: number): T => {
  let _index = index % arr.length;
  _index = _index >= 0 ? _index : arr.length + _index;
  return arr[_index];
};

// Touch handling
let touchStartPosition: number = 0;
let touchDistant: number = 0;

const onTouchEnd = (): void => {
  state.disableTransition = false;
  state.translateXOnTouch = 0;
  touchDistant > 0 ? prev(true, false) : next(true, false);
  window.removeEventListener('touchmove', onTouchMove);
  window.removeEventListener('touchend', onTouchEnd);
};

const onTouchMove = (event: TouchEvent): void => {
  touchDistant = event.touches[0].clientX - touchStartPosition;
  state.disableTransition = true;
  state.translateXOnTouch = touchDistant;
};

const onTouchStart = (event: TouchEvent): void => {
  if (state.sliding && props.infiniteOnWipe) return;
  touchStartPosition = event.touches[0].clientX;
  window.addEventListener('touchmove', onTouchMove);
  window.addEventListener('touchend', onTouchEnd);
};

// Watchers
watch(() => state.currentItem, (to) => emit('itemChange', to));
watch(currentSlide, (to) => emit('slideChange', to));

// Lifecycle hooks
onMounted(async () => {
  if (viewportRef.value) {
    state.viewportWidth = viewportRef.value.getBoundingClientRect().width;
  }

  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  state.disableTransition = false;

  if (viewportRef.value) {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        state.viewportWidth = entry.target.getBoundingClientRect().width;
      }
    });
    resizeObserver.observe(viewportRef.value);
  }

  window.addEventListener('touchstart', onTouchStart);

  if (props.autoplay) {
    state.autoplayInterval = window.setInterval(
      () => props.autoplayDirection === 'forward' ? next() : prev(),
      props.autoplayInterval
    );
  }
});

onUnmounted(() => {
  clearInterval(state.autoplayInterval);
  window.removeEventListener('touchstart', onTouchStart);
});
</script>

<template>
  <div class="t-carousel" :class="props.className">
    <div
     class="t-carousel-viewport"
     :style="viewportStyle"
     ref="viewportRef"
    >
      <div 
        class="t-carousel-track"
        :style="trackStyle"
        @transitionend="onTransitionEnd"
      >
        <div 
          class="t-carousel-item item-clone-before" 
          :style="itemStyle"
          v-for="(_, index) in totalClone"
        >
          <component :is="getLoopIndex(list, - ( totalClone - index ))" />
        </div>
        <div 
          class="t-carousel-item"
          :class="{
            'is-active': index === state.currentItem
          }"
          :style="itemStyle"
          v-for="(item, index) in list"
          :key="index"
        >
          <component :is="item" />
        </div>
        <div 
          class="t-carousel-item item-clone-after"
          :style="itemStyle"
          v-for="(_, index) in totalClone"
        >
          <component :is="getLoopIndex(list, index)" />
        </div>
      </div>
      <div 
        v-if="list.length > 1"
        class="t-carousel-pagination"
      >
        <div 
          class="t-carousel-pagination-dot"
          :class="{
            'is-active': isDotActive(index)
          }"
          v-for="(_, index) in totalSlide"
          @click="goToSlide(index)"
        >
          <span />
        </div>
      </div>
      <div 
        v-if="list.length > 1"
        class="t-carousel-nav-left"
        :class="{
          'is-disable': isBlockPrev
        }"
        @click="() => prev()"
        v-html="chevronUp"
      />
      <div 
        v-if="list.length > 1"
        class="t-carousel-nav-right"
        :class="{
          'is-disable': isBlockNext
        }"
        @click="() => next()"
        v-html="chevronUp"
      />
    </div>
  </div>
</template>

<style lang="scss">
  .t-carousel {
    width: 100%;
    display: flex;
    align-items: center;
    &-viewport {
      overflow: hidden;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      aspect-ratio: 16 / 9;
      overflow: hidden;
    }
    &-track {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      display: flex;
      // transition: 0.5s;
      will-change: transform;
      max-height: 100%;
      min-width: 100%;
      max-width: 100%;
    }
    &-item {
      // min-width: 100%;
      // max-width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      max-height: 100%;
      > * {
        max-height: 100%;
      }
    }
    &-nav-left, &-nav-right {
      position: absolute;
      background: #00000055;
      color: #FFFFFF;
      border-radius: 50%;
      cursor: pointer;
      user-select: none;
      width: max(25px, min(40px, 6%));
      aspect-ratio: 1/1;
      display: flex;
      align-items: center;
      justify-content: center;
      svg {
        width: 45%;
        height: 45%;
      }
      &.is-disable {
        opacity: 0.5;
        cursor: default;
      }
    }
    &-pagination {
      position: absolute;
      bottom: 15px;
      display: flex;
      gap: 5px;
      &-dot {
        cursor: pointer;
        padding: 5px;
        > span {
          display: block;
          min-width: 7px;
          min-height: 7px;
          border-radius: 50%;
          background: #FFFFFFaa;
        }
        &.is-active {
          > span {
            background: #FFFFFF;
          }
        }
      }
    }
    &-nav-left {
      left: 25px;
      transform: rotate(-90deg);
    }
    &-nav-right {
      right: 25px;
      transform: rotate(90deg);
    }
  }
</style>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, useSlots, useTemplateRef } from 'vue';
import { chevronUp } from './assets/icons.ts'

const slots = useSlots();
// @ts-ignore
const slotsDefault = slots?.default?.() || []
const fgt = slotsDefault.find((item: any )=> item.type.toString() === 'Symbol(v-fgt)')
const list = fgt && fgt?.children ? fgt.children : slotsDefault
console.log('list', list);

const props = defineProps({
  itemPerSlide: {
    type: Number,
    default: 1
  },
  itemPerMove: {
    type: Number,
    default: 1
  },
  duration: {
    type: Number,
    default: 500
  },
  className: {
    type: String,
    default: ''
  },
  showPagination: {
    type: Boolean,
    default: true
  },
  showNavigation: {
    type: Boolean,
    default: true
  },
  infinite: {
    type: Boolean,
    default: true
  },
  infiniteOnWipe: {
    type: Boolean,
    default: false
  },
  noBoundaries: {
    type: Boolean,
    default: false
  },
  autoplay: {
    type: Boolean,
    default: false
  },
  autoplayInterval: {
    type: Number,
    default: 2000
  },
  autoplayDirection: {
    type: String,
    default: 'forward'
  }
})
const viewportRef = useTemplateRef('viewportRef')

const state = reactive({
  currentItem: 0,
  viewportWidth: 0,
  disableTransition: true,
  sliding: false,
  translateXOnTouch: 0,
  chevronUp,
  autoplayInterval: 0
})
let transitionEndPromiseResolver = (_?: unknown) => {}

const currentSlide = computed({
  get () {
    return Math.ceil(state.currentItem / props.itemPerSlide)
  },
  set (value) {
    state.currentItem = value * props.itemPerSlide
  }
})

const trackStyle = computed(() => {  
  const translateX = - ( state.currentItem + totalClone.value) * ( state.viewportWidth / props.itemPerSlide ) + state.translateXOnTouch
  return {
    transform: `translate3D(${translateX}px, 0, 0)`,
    transition: state.disableTransition ? 'none' : `${props.duration / 1000}s`
  }
})

const onTransitionEnd = () => {
  transitionEndPromiseResolver?.()  
}

const itemStyle = computed(() => {
  return {
    minWidth: `${100 / props.itemPerSlide}%`,
    maxWidth: `${100 / props.itemPerSlide}%`
  }
})

const totalItem = computed(() => list.length)
const totalSlide = computed(() => Math.ceil(list.length / props.itemPerSlide))
const totalClone = computed(() => props.itemPerMove * ( Math.ceil(props.itemPerSlide / props.itemPerMove )))
const isBlockPrev = computed(() => !props.infinite && state.currentItem <= 0)
const isBlockNext = computed(() => !props.infinite && state.currentItem >= totalItem.value - props.itemPerSlide )
// console.log('totalClone', totalClone.value);


const prev = async (forceSlide?: boolean, noInfinite?: boolean) => {
  if (
    state.sliding && !forceSlide
    || isBlockPrev.value
  ) {
    return
  }
  if (state.currentItem > -props.itemPerSlide) {
    if (
      !props.noBoundaries
      && state.currentItem - props.itemPerMove < 0
      && state.currentItem > 0
    ) {
      state.currentItem = 0
    } else {
      state.currentItem = state.currentItem - props.itemPerMove
    }
    state.sliding = true
    await new Promise(async resolve => transitionEndPromiseResolver = resolve)
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    state.sliding = false
    if (!noInfinite && state.currentItem <= - props.itemPerSlide) {
      state.disableTransition = true
      state.currentItem = state.currentItem + totalItem.value
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      await nextTick()
      state.disableTransition = false
    }  
  }
}

const next = async (forceSlide?: boolean, noInfinite?: boolean) => {
  if (
    state.sliding && !forceSlide
    || isBlockNext.value
  ) {
    return
  }
  if (state.currentItem <= totalItem.value - 1) {
    if (
      !props.noBoundaries
      && state.currentItem + props.itemPerMove > totalItem.value - 1 - props.itemPerMove
      && state.currentItem + props.itemPerSlide < totalItem.value
    ) { 
      state.currentItem = totalItem.value - props.itemPerSlide
    } else {
      state.currentItem = state.currentItem + props.itemPerMove
    }
    state.sliding = true
    await new Promise(async resolve => transitionEndPromiseResolver = resolve)
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    state.sliding = false
    if (!noInfinite && state.currentItem > totalItem.value - 1 ) {
      state.disableTransition = true
      state.currentItem = state.currentItem - totalItem.value
      await nextTick()
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      state.disableTransition = false
    }    
  }
}

const goToSlide = (slide: number) => {
  if (
    state.sliding 
    || slide === currentSlide.value
  ) {
    return
  }
  if (
    slide < currentSlide.value
    && state.currentItem - props.itemPerMove < 0
    && state.currentItem > 0
  ) {
    state.currentItem = 0
  } else if (
    slide > currentSlide.value
    && state.currentItem + props.itemPerMove > totalItem.value - 1 - props.itemPerMove
    && state.currentItem + props.itemPerSlide < totalItem.value
  ) {
    state.currentItem = totalItem.value - props.itemPerSlide
  } else {
    currentSlide.value = slide
  }  
  state.sliding = true
  setTimeout(async () => {
    state.sliding = false    
  }, 500)   
}

const isDotActive = (index: number) => {
  let currentDisplaySlide;
  if (currentSlide.value < 0) {
    currentDisplaySlide = totalSlide.value - 1
  } else if (currentSlide.value > totalSlide.value - 1) {
    currentDisplaySlide = 0
  } else {
    currentDisplaySlide = currentSlide.value
  }
  
  return index === currentDisplaySlide
}

const getLoopIndex = (arr: any[], index: number) => {  
  let _index = index % arr.length
  _index = _index >= 0 ? _index : arr.length + _index
  return arr[_index]
}

let touchStartPosition = 0;
let touchDistant = 0;

const onTouchEnd = () => {
  //const distant = touchStartPosition + event.touches[0].clientX
  console.log('onTouchEnd', touchDistant);
  state.disableTransition = false
  state.translateXOnTouch = 0
  if (touchDistant > 0) {
    prev(true, false)
  } else {
    next(true, false)
  }
  window.removeEventListener('touchmove', onTouchMove)
  window.removeEventListener('touchend', onTouchEnd)
}

const onTouchMove = (event: any) => {
  touchDistant = event.touches[0].clientX - touchStartPosition
  state.disableTransition = true
  state.translateXOnTouch = touchDistant
  window.addEventListener('touchend', onTouchEnd)
}

const onTouchStart = (event: any) => {
  console.log('onTouchStart');
  if (
    state.sliding
    && 
    props.infiniteOnWipe
  ) {
    return
  }
  touchStartPosition = event.touches[0].clientX
  window.addEventListener('touchmove', onTouchMove)
}

onMounted(async () => {
  if (viewportRef?.value) {
    state.viewportWidth = viewportRef.value?.getBoundingClientRect().width
  }
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  state.disableTransition = false
  if (viewportRef.value) {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        state.viewportWidth =entry.target?.getBoundingClientRect().width
      }
    });
    resizeObserver.observe(viewportRef.value);
  }
  window.addEventListener('touchstart', onTouchStart)
  if (props.autoplay) {
    state.autoplayInterval = setInterval(() => {
      props.autoplayDirection === 'forward' ? next() : prev()
    }, props.autoplayInterval)
  }
})

onUnmounted(() => {
  clearInterval(state.autoplayInterval)
})

</script>

<template>
  <div class="t-carousel" :class="props.className">
    <div
     class="t-carousel-viewport"
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
      background: #00000077;
      color: #FFFFFF;
      border-radius: 50%;
      cursor: pointer;
      user-select: none;
      width: max(25px, min(40px, 7.5vw));
      height: max(25px, min(40px, 7.5vw));
      display: flex;
      align-items: center;
      justify-content: center;
      svg {
        width: 50%;
        height: 50%;
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

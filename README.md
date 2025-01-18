# infinite-carousel-vue

A flexible, lightweight, touch & wipe support carousel library for Vue, supporting infinite loop mode.

<img src="https://raw.githubusercontent.com/letrungtan/infinite-carousel-vue/refs/heads/main/src/assets/t-carousel.png" width="335" />

## Installation
### NPM
```js
$ npm i @letrungtan/infinite-carousel-vue
```
Use the component.
```js
import { InfiniteCarousel, Slide } from '@letrungtan/infinite-carousel-vue'
```
## Usage

**Basic Usage**
```html
<InfiniteCarousel 
    :itemPerSlide="1"
    :itemPerMove="1"
    :infinite="true"
    :infiniteOnWipe="true"
>
    <Slide 
        v-for="(item, index) in ['Item 1, Item 2, Item 3']"
        :key="index"
    >
        {{ item }}
    </Slide>
</InfiniteCarousel>
```

## API

| Name | Type | Default | Description |
| :---------------- | :--------- | :----- | :-------------------------------- |
| `itemPerSlide`    | `Number`   | 1      | The number of items to show per slide.  |
| `itemPerMove`     | `Number`   | 1      | The number of items to move per slide when navigating.  |
| `duration`        | `Number`   | 500    | The duration of the transition in milliseconds.  |
| `className`       | `String`   | ''     | Optional CSS class to add custom styling to the carousel container  |
| `showPagination`  | `Boolean`  | true   | Determines whether dot pagination controls should be visible.  |
| `showNavigation`  | `Boolean`  | true   | Controls whether navigation arrows (previous/next) are displayed.  |
| `infinite`        | `Boolean`  | true   | Enables infinite scrolling. When true, the carousel will loop back to the first slide after reaching the last and vice versa.  |
| `infiniteOnWipe  `| `Boolean`  | true   | Enables infinite scroll behavior even when the user swipes manually (e.g., on mobile).  |
| `noBoundaries  `  | `Boolean`  | false  | If true, the carousel will allow scrolling past the boundaries on one move (fixed item per move). If false, it will stop at the last or first item.  |
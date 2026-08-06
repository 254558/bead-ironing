<script setup lang="ts">
import { onMounted, onUnmounted, useTemplateRef, watch } from 'vue'
import { useIroning } from '../composables/useIroning'
import { render2D } from '../composables/useRender2D'
import { eraseCell, getCellAt, placeBead, store } from '../stores/game'
import { CELL } from '../utils/color'

const canvasEl = useTemplateRef<HTMLCanvasElement>('canvasEl')
let ctx: CanvasRenderingContext2D | null = null

/** 画布位图尺寸跟随网格行列数 */
function syncCanvasSize() {
  const c = canvasEl.value
  if (!c) return
  c.width = store.cols * CELL
  c.height = store.rows * CELL
  ctx = c.getContext('2d')
  if (ctx) ctx.imageSmoothingEnabled = false
}

/** 按容器与缩放系数设置画布 CSS 尺寸（等比缩放并居中） */
function fitCanvas() {
  const c = canvasEl.value
  if (!c) return
  const wrap = c.parentElement
  const ww = wrap?.clientWidth || window.innerWidth
  const wh = wrap?.clientHeight || window.innerHeight
  const aspect = store.cols / store.rows
  let w: number
  let h: number
  if (ww / wh > aspect) {
    h = wh
    w = h * aspect
  } else {
    w = ww
    h = w / aspect
  }
  w *= store.zoom
  h *= store.zoom
  c.style.width = `${w}px`
  c.style.height = `${h}px`
}

function render() {
  if (!ctx) return
  render2D(ctx, canvasEl.value!)
}

function getCanvasPos(e: MouseEvent) {
  const c = canvasEl.value!
  const rect = c.getBoundingClientRect()
  return {
    x: (e.clientX - rect.left) * (c.width / rect.width),
    y: (e.clientY - rect.top) * (c.height / rect.height),
  }
}

function onMove(e: MouseEvent) {
  const p = getCanvasPos(e)
  store.mouse.x = p.x
  store.mouse.y = p.y
  if (store.mode === 'design' && store.mouse.down) placeBead(p.x, p.y)
  render()
}

function onDown(e: MouseEvent) {
  if (e.button === 2) return
  const p = getCanvasPos(e)
  store.mouse.x = p.x
  store.mouse.y = p.y
  store.mouse.down = true
  if (store.mode === 'design') placeBead(p.x, p.y)
  render()
}

function onUp() {
  store.mouse.down = false
}

function onLeave() {
  store.mouse.x = -1
  store.mouse.y = -1
  store.mouse.down = false
  render()
}

function onContext(e: MouseEvent) {
  if (store.mode !== 'design') return
  const p = getCanvasPos(e)
  const cell = getCellAt(p.x, p.y)
  if (cell) {
    eraseCell(cell.r, cell.c)
    render()
  }
}

function onWheel(e: WheelEvent) {
  if (store.mode === 'view3d') return
  e.preventDefault()
  store.zoom = Math.max(0.3, Math.min(12, store.zoom * (e.deltaY < 0 ? 1.15 : 0.87)))
  fitCanvas()
  render()
}

// 熨烫动画循环：仅 ironing 模式运行
const { start: startIronLoop, stop: stopIronLoop } = useIroning(() => render())

watch(
  () => store.mode,
  (m) => {
    if (m === 'ironing') startIronLoop()
    else stopIronLoop()
  },
)

// 网格尺寸变化 → 重置位图；窗口 resize → 重新适配
watch(
  [() => store.cols, () => store.rows],
  () => {
    syncCanvasSize()
    fitCanvas()
    render()
  },
)

watch(
  () => store.resizeTick,
  () => {
    fitCanvas()
    render()
  },
)

onMounted(() => {
  syncCanvasSize()
  fitCanvas()
  render()
  canvasEl.value?.addEventListener('wheel', onWheel, { passive: false })
})

onUnmounted(() => {
  stopIronLoop()
  canvasEl.value?.removeEventListener('wheel', onWheel)
})
</script>

<template>
  <div class="scroll-wrap">
    <canvas
      ref="canvasEl"
      class="canvas-pixel"
      :class="{
        'canvas-hidden': store.mode === 'view3d',
        'iron-cursor': store.mode === 'ironing',
      }"
      @mousemove="onMove"
      @mousedown="onDown"
      @mouseup="onUp"
      @mouseleave="onLeave"
      @contextmenu.prevent="onContext"
    />
  </div>
</template>

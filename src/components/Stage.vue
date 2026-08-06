<script setup lang="ts">
import { onMounted, onUnmounted, useTemplateRef } from 'vue'
import { setupGrid, showStatus, store } from '../stores/game'
import BoardPanel from './BoardPanel.vue'
import CRTOverlay from './CRTOverlay.vue'
import IronProgress from './IronProgress.vue'
import PixelCanvas from './PixelCanvas.vue'
import StatusBar from './StatusBar.vue'
import View3D from './View3D.vue'

const root = useTemplateRef<HTMLDivElement>('root')
let resizeTimer: ReturnType<typeof setTimeout> | undefined

/** 按容器尺寸重建网格，并通知画布/3D 适配 */
function measure() {
  const el = root.value
  const w = el?.clientWidth || window.innerWidth
  const h = el?.clientHeight || window.innerHeight - 70
  setupGrid(w, h)
  store.resizeTick++
}

function onWindowResize() {
  clearTimeout(resizeTimer)
  resizeTimer = setTimeout(measure, 300)
}

onMounted(() => {
  measure()
  showStatus('CLICK/DRAG TO PLACE')
  window.addEventListener('resize', onWindowResize)
})

onUnmounted(() => window.removeEventListener('resize', onWindowResize))
</script>

<template>
  <div ref="root" class="canvas-wrap">
    <PixelCanvas />
    <View3D />
    <BoardPanel />
    <CRTOverlay />
    <StatusBar />
    <IronProgress />
  </div>
</template>

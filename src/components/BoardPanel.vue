<script setup lang="ts">
import { onUnmounted, ref } from 'vue'
import { deleteBoard, loadBoard, moveBoard, setBoardPanel, store } from '../stores/game'
import type { SavedBoard } from '../types'

/** 当前正在拖拽的磁贴 id（用于提升 z-index / 光标态） */
const dragId = ref<string | null>(null)
let dragStart = { x: 0, y: 0 }
let dragMoved = false
/** 上一次拖拽结束时间，用于抑制拖拽刚结束后的双击误触 */
let lastDragEnd = 0

/** 基于 id 生成稳定的轻微旋转角（-4°~4°），让磁贴错落贴墙 */
function rotFor(id: string) {
  let sum = 0
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i)
  return (sum % 9) - 4
}

function magnetStyle(b: SavedBoard) {
  return {
    left: `${b.x}px`,
    top: `${b.y}px`,
    transform: `rotate(${rotFor(b.id)}deg)`,
  }
}

function onMouseDown(e: MouseEvent, b: SavedBoard) {
  if (e.button !== 0) return // 仅左键
  dragId.value = b.id
  dragStart = { x: e.clientX, y: e.clientY }
  dragMoved = false
  // move/up 挂到 window：鼠标移出磁贴也能持续跟踪拖拽
  window.addEventListener('mousemove', onWindowMove)
  window.addEventListener('mouseup', onWindowUp)
}

function onWindowMove(e: MouseEvent) {
  const id = dragId.value
  const b = id ? store.savedBoards.find((x) => x.id === id) : undefined
  if (!b) return
  const dx = e.clientX - dragStart.x
  const dy = e.clientY - dragStart.y
  // 位移超过 4px 才算拖拽（区分点击）
  if (!dragMoved && Math.abs(dx) + Math.abs(dy) > 4) dragMoved = true
  if (dragMoved) {
    b.x = Math.max(0, b.x + dx)
    b.y = Math.max(0, b.y + dy)
    dragStart = { x: e.clientX, y: e.clientY }
  }
}

function onWindowUp() {
  const id = dragId.value
  if (id && dragMoved) {
    const b = store.savedBoards.find((x) => x.id === id)
    if (b) moveBoard(b.id, b.x, b.y)
    lastDragEnd = Date.now()
  }
  dragId.value = null
  window.removeEventListener('mousemove', onWindowMove)
  window.removeEventListener('mouseup', onWindowUp)
}

function onDblClick(b: SavedBoard) {
  if (Date.now() - lastDragEnd < 350) return // 刚拖完，不算双击
  loadBoard(b.id)
}

onUnmounted(() => {
  window.removeEventListener('mousemove', onWindowMove)
  window.removeEventListener('mouseup', onWindowUp)
})
</script>

<template>
  <div class="board-panel" :class="{ show: store.showBoardPanel }">
    <header class="board-panel-head">
      <h2 class="board-panel-title">作 品 墙</h2>
      <button class="board-panel-close" @click="setBoardPanel(false)">✕</button>
    </header>

    <p v-if="store.savedBoards.length === 0" class="board-panel-empty">
      还没有作品<br>先在画布上拼一个，点「保 存」贴上来吧
    </p>

    <div
      v-for="b in store.savedBoards"
      :key="b.id"
      class="fridge-magnet"
      :class="{ dragging: dragId === b.id }"
      :style="magnetStyle(b)"
      @mousedown="onMouseDown($event, b)"
      @dblclick="onDblClick(b)"
    >
      <img class="magnet-thumb" :src="b.thumb" :alt="b.name">
      <span class="magnet-name">{{ b.name }}</span>
      <button
        class="magnet-del"
        title="撕下删除"
        @mousedown.stop
        @click.stop="deleteBoard(b.id)"
      >
        ✕
      </button>
    </div>
  </div>
</template>


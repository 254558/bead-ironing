<script setup lang="ts">
import { deleteBoard, loadBoard, setBoardPanel, store } from '../stores/game'

/** 格式化保存时间，如「2026/08/06 14:30」 */
function formatTime(ts: number) {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
</script>

<template>
  <div class="board-panel" :class="{ show: store.showBoardPanel }">
    <div class="board-panel-inner">
      <header class="board-panel-head">
        <h2 class="board-panel-title">作 品 面 板</h2>
        <button class="board-panel-close" @click="setBoardPanel(false)">✕</button>
      </header>

      <div v-if="store.savedBoards.length === 0" class="board-panel-empty">
        <p>还没有作品</p>
        <p>先在画布上拼一个，点「保 存」贴上来吧</p>
      </div>

      <div v-else class="board-card-grid">
        <div v-for="b in store.savedBoards" :key="b.id" class="board-card">
          <img
            class="board-card-thumb"
            :src="b.thumb"
            :alt="b.name"
            :style="{ aspectRatio: `${b.cols} / ${b.rows}` }"
          >
          <p class="board-card-name">{{ b.name }}</p>
          <p class="board-card-time">{{ formatTime(b.savedAt) }}</p>
          <div class="board-card-actions">
            <button class="board-btn board-btn-load" @click="loadBoard(b.id)">载 入</button>
            <button class="board-btn board-btn-del" @click="deleteBoard(b.id)">删 除</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

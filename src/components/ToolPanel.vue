<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { importImage } from '../composables/useImageImport'
import { clearAll, hasBeads, hasMelt, saveBoard, setBoardPanel, store, switchMode } from '../stores/game'

const fileInput = useTemplateRef<HTMLInputElement>('fileInput')

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) importImage(file)
  input.value = ''
}
</script>

<template>
  <div class="sidebar-tools">
    <button
      class="mode-btn"
      :class="{ active: store.mode === 'design' }"
      @click="switchMode('design')"
    >
      设<br>计
    </button>
    <button
      class="mode-btn"
      :class="{ active: store.mode === 'ironing' }"
      :disabled="!hasBeads"
      @click="switchMode('ironing')"
    >
      熨<br>烫
    </button>
    <button
      class="mode-btn"
      :class="{ active: store.mode === 'view3d' }"
      :disabled="!hasMelt"
      @click="switchMode('view3d')"
    >
      3D
    </button>
    <button class="mode-btn btn-import" @click="fileInput?.click()">
      导<br>入<br>图<br>片
    </button>
    <button class="mode-btn btn-save" :disabled="!hasBeads" @click="saveBoard()">
      保<br>存
    </button>
    <button class="mode-btn btn-panel" @click="setBoardPanel(true)">
      面<br>板
    </button>
    <button class="mode-btn btn-clear" @click="clearAll()">
      清<br>空
    </button>
    <input ref="fileInput" type="file" accept="image/*" class="file-input" @change="onFileChange">
  </div>
</template>

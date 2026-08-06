import { computed, reactive } from 'vue'
import type { Cell, IronProgress, Mode, MouseState } from '../types'
import { CELL, COLORS, DISPLAY_CELL } from '../utils/color'

function createGrid(cols: number, rows: number): Cell[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ color: null, melt: 0 })),
  )
}

/** 全局共享状态：网格 / 模式 / 鼠标 / 进度等 */
export const store = reactive({
  cols: 30,
  rows: 30,
  grid: createGrid(30, 30) as Cell[][],
  mode: 'design' as Mode,
  zoom: 1,
  mouse: { x: -1, y: -1, down: false } as MouseState,
  selectedColor: COLORS[0],
  isEraser: false,
  status: '',
  statusVisible: false,
  progress: {
    avg: 0, fused: 0, burned: 0, count: 0,
    fillColor: '#41a6f6', label: '熨烫进度',
  } as IronProgress,
  /** 窗口 resize 后 +1，通知画布/3D 重新适配 */
  resizeTick: 0,
})

/** 存在任意珠子（熨烫按钮可用） */
export const hasBeads = computed(() =>
  store.grid.some((row) => row.some((c) => c.color !== null)),
)
/** 存在已开始熔融的珠子（3D 按钮可用） */
export const hasMelt = computed(() =>
  store.grid.some((row) => row.some((c) => c.color !== null && c.melt > 0.01)),
)

let statusTimer: ReturnType<typeof setTimeout> | undefined

export function showStatus(text: string) {
  store.status = text
  store.statusVisible = true
  clearTimeout(statusTimer)
  statusTimer = setTimeout(() => {
    store.statusVisible = false
  }, 3500)
}

/** 按容器尺寸重算行列数，尺寸变化时重建网格 */
export function setupGrid(w: number, h: number) {
  const nc = Math.max(10, Math.floor(w / DISPLAY_CELL))
  const nr = Math.max(10, Math.floor(h / DISPLAY_CELL))
  if (nc === store.cols && nr === store.rows && store.grid.length > 0) return
  store.cols = nc
  store.rows = nr
  store.grid = createGrid(nc, nr)
}

/** 图片导入时按需扩容画布（调用方随后会覆盖全部格子） */
export function expandGrid(minCols: number, minRows: number) {
  if (store.cols < minCols || store.rows < minRows) {
    store.cols = Math.max(store.cols, minCols)
    store.rows = Math.max(store.rows, minRows)
    store.grid = createGrid(store.cols, store.rows)
  }
}

export function getCellAt(x: number, y: number): { r: number; c: number } | null {
  const c = Math.floor(x / CELL)
  const r = Math.floor(y / CELL)
  return r < 0 || r >= store.rows || c < 0 || c >= store.cols ? null : { r, c }
}

/** 画布坐标放置珠子 / 橡皮擦除 */
export function placeBead(x: number, y: number) {
  const cell = getCellAt(x, y)
  if (!cell) return
  const target = store.grid[cell.r][cell.c]
  if (store.isEraser) {
    target.color = null
    target.melt = 0
  } else {
    target.color = store.selectedColor
    target.melt = 0
  }
}

export function eraseCell(r: number, c: number) {
  const cell = store.grid[r][c]
  cell.color = null
  cell.melt = 0
}

export function clearAll() {
  for (const row of store.grid)
    for (const cell of row) {
      cell.color = null
      cell.melt = 0
    }
  switchMode('design')
}

export function switchMode(m: Mode) {
  store.mode = m
  // 切回设计模式：全部珠子恢复未熔融
  if (m === 'design') {
    for (const row of store.grid)
      for (const cell of row) cell.melt = 0
  }
  showStatus(
    m === 'design' ? 'CLICK/DRAG TO PLACE' : m === 'ironing' ? 'HOLD TO IRON' : 'DRAG TO ROTATE',
  )
}

export function selectColor(hex: string) {
  store.selectedColor = hex
  store.isEraser = false
}

export function toggleEraser() {
  store.isEraser = !store.isEraser
}

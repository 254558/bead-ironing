import { computed, reactive } from 'vue'
import type { Cell, IronProgress, Mode, MouseState, SavedBoard } from '../types'
import { CELL, COLORS, DISPLAY_CELL } from '../utils/color'
import { renderThumb } from '../utils/thumbnail'

const STORAGE_KEY = 'bead-iron.savedBoards'

/** 从 localStorage 读取已保存的作品（容错：损坏/不可用时返回空列表） */
function loadSavedBoards(): SavedBoard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const list = JSON.parse(raw)
    if (!Array.isArray(list)) return []
    // 旧版本数据没有 x/y 位置：按索引错落补默认落点，保证不互相叠压
    return (list as SavedBoard[]).map((b, i) => ({
      ...b,
      x: typeof b.x === 'number' ? b.x : 20 + (i % 4) * 132,
      y: typeof b.y === 'number' ? b.y : 20 + Math.floor(i / 4) * 122,
    }))
  } catch {
    return []
  }
}

function persistBoards() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store.savedBoards))
  } catch {
    /* 存储超限等场景静默失败 */
  }
}

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
  /** 已保存到作品面板的成品（localStorage 持久化） */
  savedBoards: loadSavedBoards(),
  /** 作品面板显示开关（仿 three-container 的 .show 切换） */
  showBoardPanel: false,
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

/* ---------- 作品面板（localStorage 持久化） ---------- */

/** 把当前画布保存为一件作品（含缩略图），并打开面板即时反馈 */
export function saveBoard() {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const name = `作品 ${store.savedBoards.length + 1}`
  const grid = store.grid.map((row) => row.map((cell) => ({ ...cell })))
  // 离屏 canvas 生成缩略图 PNG
  const canvas = document.createElement('canvas')
  canvas.width = store.cols * 2
  canvas.height = store.rows * 2
  const ctx = canvas.getContext('2d')
  if (ctx) renderThumb(ctx, grid, store.cols, store.rows, 2)
  // 初始落点：按已有数量错落排布（间距大于磁贴尺寸，避免叠压），之后可自由拖拽
  const n = store.savedBoards.length
  store.savedBoards.push({
    id,
    name,
    cols: store.cols,
    rows: store.rows,
    grid,
    thumb: canvas.toDataURL('image/png'),
    savedAt: Date.now(),
    x: 24 + (n % 4) * 132,
    y: 24 + Math.floor(n / 4) * 122,
  })
  persistBoards()
  store.showBoardPanel = true
  showStatus(`已保存「${name}」到作品墙`)
}

/** 把面板中的一件作品整表载入画布（保留熔融度，不走 switchMode） */
export function loadBoard(id: string) {
  const board = store.savedBoards.find((b) => b.id === id)
  if (!board) return
  store.cols = board.cols
  store.rows = board.rows
  store.grid = board.grid.map((row) => row.map((cell) => ({ ...cell })))
  store.mode = 'design' // 直接赋值：避免 switchMode 清零 melt
  store.showBoardPanel = false
  showStatus(`已载入「${board.name}」`)
}

export function deleteBoard(id: string) {
  store.savedBoards = store.savedBoards.filter((b) => b.id !== id)
  persistBoards()
}

/** 拖拽结束后更新冰箱贴在墙上的位置并持久化 */
export function moveBoard(id: string, x: number, y: number) {
  const board = store.savedBoards.find((b) => b.id === id)
  if (!board) return
  board.x = Math.max(0, Math.round(x))
  board.y = Math.max(0, Math.round(y))
  persistBoards()
}

export function setBoardPanel(show: boolean) {
  store.showBoardPanel = show
}

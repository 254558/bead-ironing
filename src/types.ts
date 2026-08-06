/** 单个珠子的状态 */
export interface Cell {
  /** 颜色（调色板 hex），null 表示空格 */
  color: string | null
  /** 熔融程度 0~1 */
  melt: number
}

export type Mode = 'design' | 'ironing' | 'view3d'

export interface MouseState {
  x: number
  y: number
  down: boolean
}

export interface IronProgress {
  avg: number
  fused: number
  burned: number
  count: number
  fillColor: string
  label: string
}

/** 保存在作品面板上的一个成品 */
export interface SavedBoard {
  id: string
  /** 自动生成的作品名，如「作品 1」 */
  name: string
  cols: number
  rows: number
  grid: Cell[][]
  /** 缩略图 PNG dataURL */
  thumb: string
  savedAt: number
}

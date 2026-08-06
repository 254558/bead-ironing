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

import type { Cell } from '../types'
import { shade } from './color'

/**
 * 把拼豆网格绘制成小缩略图（每格 1px，按 scale 放大），供保存作品时生成 PNG。
 * 不依赖 game store，避免循环导入；只画底板与珠子纯色，不画网格线/光标。
 */
export function renderThumb(
  ctx: CanvasRenderingContext2D,
  grid: Cell[][],
  cols: number,
  rows: number,
  scale = 2,
) {
  ctx.imageSmoothingEnabled = false
  ctx.fillStyle = '#0d0d1a' // 底板色
  ctx.fillRect(0, 0, cols * scale, rows * scale)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c]
      if (!cell.color) continue
      const m = cell.melt
      let color = cell.color
      if (m > 0.85) color = shade(color, -0.5)
      else if (m > 0.3) color = shade(color, -0.12)
      ctx.fillStyle = color
      ctx.fillRect(c * scale, r * scale, scale, scale)
    }
  }
}

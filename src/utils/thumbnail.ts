import type { Cell } from '../types'
import { shade } from './color'

/**
 * 把拼豆网格绘制成缩略图 PNG：只包含珠子实际占据的区域（裁剪到图案边界），
 * 背景透明、无底板方框。每格按 scale 绘制，scale 由内容尺寸动态计算
 * （最长边约 maxSize 像素，整数倍，clamp 2~6）。
 * 不依赖 game store，避免循环导入。
 */
export function renderThumb(
  ctx: CanvasRenderingContext2D,
  grid: Cell[][],
  maxSize = 100,
) {
  const rows = grid.length
  const cols = grid[0]?.length ?? 0
  // 计算内容边界（珠子实际占据的行列范围）
  let minR = rows, minC = cols, maxR = -1, maxC = -1
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!grid[r][c].color) continue
      if (r < minR) minR = r
      if (r > maxR) maxR = r
      if (c < minC) minC = c
      if (c > maxC) maxC = c
    }
  }
  // 空图案：不绘制任何内容
  if (maxR < 0) {
    ctx.canvas.width = 0
    ctx.canvas.height = 0
    return
  }
  const cw = maxC - minC + 1
  const ch = maxR - minR + 1
  const scale = Math.max(2, Math.min(6, Math.floor(maxSize / Math.max(cw, ch))))
  ctx.canvas.width = cw * scale
  ctx.canvas.height = ch * scale
  ctx.imageSmoothingEnabled = false
  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      const cell = grid[r][c]
      if (!cell.color) continue
      const m = cell.melt
      let color = cell.color
      if (m > 0.85) color = shade(color, -0.5)
      else if (m > 0.3) color = shade(color, -0.12)
      ctx.fillStyle = color
      ctx.fillRect((c - minC) * scale, (r - minR) * scale, scale, scale)
    }
  }
}

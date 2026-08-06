import type { Cell } from '../types'
import { shade } from './color'

/**
 * 把拼豆网格绘制成缩略图 PNG：只包含珠子实际占据的区域（裁剪到图案边界），
 * 背景透明、无底板方框。每颗珠子按主画布的画法绘制（圆形拼豆 / 熔融扁珠），
 * 因此图案边缘呈现拼豆本身的圆形轮廓，而不是矩形色块。
 * scale 由内容尺寸动态计算（最长边约 maxSize 像素，整数倍，clamp 4~24），
 * 保证缩略图自然分辨率 ≥96px，磁贴按 1:1 显示不放大、不模糊。
 * 不依赖 game store，避免循环导入。
 */
export function renderThumb(
  ctx: CanvasRenderingContext2D,
  grid: Cell[][],
  maxSize = 96,
) {
  const rows = grid.length
  const cols = grid[0]?.length ?? 0
  // 计算内容边界（珠子实际占用的行列范围）
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
  const scale = Math.max(4, Math.min(24, Math.round(maxSize / Math.max(cw, ch))))
  ctx.canvas.width = cw * scale
  ctx.canvas.height = ch * scale
  ctx.imageSmoothingEnabled = false
  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      const cell = grid[r][c]
      if (!cell.color) continue
      const cx = (c - minC + 0.5) * scale
      const cy = (r - minR + 0.5) * scale
      const m = cell.melt
      let color = cell.color
      if (m > 0.85) color = shade(color, -0.5)
      else if (m > 0.3) color = shade(color, -0.12)
      ctx.fillStyle = color
      if (m >= 0.3) {
        // 熔融扁珠：圆角方块（近似主画布熔融形态）
        const bs = scale * 0.92
        const rr = Math.max(1, Math.floor(scale * 0.28))
        ctx.beginPath()
        ctx.roundRect(cx - bs / 2, cy - bs / 2, bs, bs, rr)
        ctx.fill()
      } else {
        // 圆形拼豆（半径比例与主画布一致：BEAD_R/CELL = 6/14）
        const R = scale * 0.43
        ctx.beginPath()
        ctx.arc(cx, cy, R, 0, Math.PI * 2)
        ctx.fill()
        // 左上高光
        ctx.fillStyle = shade(color, 0.35)
        const hs = Math.max(1, Math.round(scale * 0.21))
        ctx.fillRect(Math.round(cx - R / 2), Math.round(cy - R / 2), hs, hs)
        // 珠孔
        ctx.fillStyle = '#0d0d1a'
        ctx.beginPath()
        ctx.arc(cx, cy, R * 0.32, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }
}

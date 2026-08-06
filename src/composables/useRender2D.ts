import { getCellAt, store } from '../stores/game'
import { BEAD_R, BURN, CELL, FUSE_MAX, IRON_RADIUS, beadHash, shade } from '../utils/color'

/**
 * 2D 渲染主函数：网格底、珠子（含熔融形态）、设计悬停提示、熨斗光标。
 * 由 PixelCanvas 在事件与动画帧时调用，纯命令式绘制。
 */
export function render2D(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
  const { cols, rows, grid, mouse, mode } = store

  // 背景 + 网格线 + 定位点
  ctx.fillStyle = '#0d0d1a'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#151523'
  for (let i = 1; i < cols; i++) {
    ctx.fillRect(i * CELL, 0, 1, canvas.height)
    ctx.fillRect(0, i * CELL, canvas.width, 1)
  }
  ctx.fillStyle = '#252540'
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      ctx.fillRect(c * CELL + CELL / 2 - 1, r * CELL + CELL / 2 - 1, 2, 2)

  // 珠子
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c]
      if (!cell.color) continue
      const cx = c * CELL + CELL / 2
      const cy = r * CELL + CELL / 2
      const m = cell.melt
      let color = cell.color
      if (m > BURN) color = shade(color, -0.5)
      else if (m > FUSE_MAX) color = shade(color, -0.12)

      if (m >= 0.3) {
        // 熔融扁珠
        const bh = beadHash(r, c)
        const asp = 0.92 + bh * 0.16
        const bs = CELL * (0.85 + m * 0.4 + bh * 0.06)
        const w = Math.floor(bs * asp)
        const hh = Math.floor(bs / asp)
        const hw = w / 2
        const h2 = hh / 2
        const rr = Math.max(2, Math.floor(m * CELL * 0.2 + bh * 3))
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.roundRect(cx - hw, cy - h2, w, hh, rr)
        ctx.fill()
        ctx.save()
        ctx.beginPath()
        ctx.roundRect(cx - hw, cy - h2, w, hh, rr)
        ctx.clip()
        ctx.fillStyle = shade(color, 0.35)
        ctx.fillRect(cx - hw, cy - h2, w, 2)
        ctx.fillRect(cx - hw, cy - h2, 2, hh)
        ctx.fillStyle = shade(color, -0.25)
        ctx.fillRect(cx - hw, cy + h2 - 2, w, 2)
        ctx.fillRect(cx + hw - 2, cy - h2, 2, hh)
        ctx.restore()
      } else {
        // 圆形珠
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(cx, cy, BEAD_R, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = shade(color, 0.35)
        ctx.fillRect(cx - Math.floor(BEAD_R / 2), cy - Math.floor(BEAD_R / 2), 3, 3)
        ctx.fillStyle = '#0d0d1a'
        ctx.beginPath()
        ctx.arc(cx, cy, BEAD_R * 0.32, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  // 设计模式：悬停虚线提示
  if (mode === 'design' && mouse.x >= 0) {
    const cell = getCellAt(mouse.x, mouse.y)
    if (cell) {
      const cx = cell.c * CELL + CELL / 2
      const cy = cell.r * CELL + CELL / 2
      ctx.strokeStyle =
        store.isEraser || grid[cell.r][cell.c].color ? '#ef7d57' : store.selectedColor
      ctx.lineWidth = 1
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.arc(cx, cy, BEAD_R + 1, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
    }
  }

  // 熨烫模式：旋转的熨斗光标
  if (mode === 'ironing' && mouse.x >= 0) {
    ctx.save()
    ctx.translate(mouse.x, mouse.y)
    ctx.rotate(-Math.PI / 4)
    const hw = IRON_RADIUS * 2.5
    const hh = IRON_RADIUS * 2.3
    const hd = 5
    const bR = hw / 2
    const ibR = (hw - hd * 2) / 2
    const hdlW = IRON_RADIUS * 0.4
    const hdlL = IRON_RADIUS * 3.5
    const hdlX = -hdlW / 2
    ctx.fillStyle = '#333c57'
    ctx.fillRect(hdlX, hh / 2 - hd, hdlW, hdlL)
    ctx.fillStyle = '#94b0c2'
    ctx.fillRect(hdlX + 2, hh / 2 - hd, hdlW - 4, hdlL)
    ctx.fillStyle = '#f4f4f4'
    ctx.fillRect(hdlX + 2, hh / 2 - hd, 2, hdlL)
    ctx.fillStyle = '#333c57'
    ctx.beginPath()
    ctx.roundRect(-hw / 2, -hh / 2, hw, hh, [4, 4, bR, bR])
    ctx.fill()
    ctx.fillStyle = mouse.down ? '#b0b0bc' : '#94b0c2'
    ctx.beginPath()
    ctx.roundRect(-hw / 2 + hd, -hh / 2 + hd, hw - hd * 2, hh - hd * 2, [3, 3, ibR, ibR])
    ctx.fill()
    ctx.fillStyle = '#f4f4f4'
    ctx.fillRect(-hw / 2 + hd, -hh / 2 + hd, hw - hd * 2, 2)
    ctx.fillRect(-hw / 2 + hd, -hh / 2 + hd, 2, hh - hd * 2 - ibR)
    ctx.fillStyle = '#566c86'
    ctx.fillRect(hw / 2 - hd - 2, -hh / 2 + hd, 2, hh - hd * 2 - ibR)
    if (mouse.down) {
      ctx.fillStyle = 'rgba(255,205,117,0.2)'
      ctx.beginPath()
      ctx.roundRect(-hw / 2 + hd, -hh / 2 + hd, hw - hd * 2, hh - hd * 2, [3, 3, ibR, ibR])
      ctx.fill()
    }
    ctx.restore()
  }
}

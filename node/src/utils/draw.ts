import type { Image, SKRSContext2D } from 'canvas'

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface RoundRectOptions {
  ctx: SKRSContext2D
  rect: Rect
  radius: number
}

export interface GlassCardOptions {
  ctx: SKRSContext2D
  rect: Rect
  radius?: number
  blur?: number
  color?: string
  bgImage?: Image
  canvasSize?: { w: number; h: number }
}

export interface ImageCoverOptions {
  ctx: SKRSContext2D
  image: Image
  dest: Rect
  blur?: number
}

/**
 * 绘制圆角矩形路径
 */
export function roundRect({ ctx, rect, radius }: RoundRectOptions) {
  const { x, y, w, h } = rect
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + w - radius, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
  ctx.lineTo(x + w, y + h - radius)
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
  ctx.lineTo(x + radius, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

/**
 * 以 cover 模式绘制图片
 */
export function drawImageCover({ ctx, image, dest, blur }: ImageCoverOptions) {
  const imgW = image.width
  const imgH = image.height
  const scale = Math.max(dest.w / imgW, dest.h / imgH)
  const srcW = dest.w / scale
  const srcH = dest.h / scale
  const srcX = (imgW - srcW) / 2
  const srcY = (imgH - srcH) / 2

  if (blur) {
    ctx.filter = `blur(${blur}px)`
  }
  ctx.drawImage(image, srcX, srcY, srcW, srcH, dest.x, dest.y, dest.w, dest.h)
  if (blur) {
    ctx.filter = 'none'
  }
}

/**
 * 绘制卡片
 */
export function drawCard(options: GlassCardOptions) {
  const {
    ctx,
    rect,
    radius = 12,
    blur = 20,
    color = 'rgba(255, 255, 255, 0.7)',
    bgImage,
    canvasSize,
  } = options

  if (bgImage && canvasSize) {
    ctx.save()
    roundRect({ ctx, rect, radius })
    ctx.clip()
    drawImageCover({
      ctx,
      image: bgImage,
      dest: { x: 0, y: 0, w: canvasSize.w, h: canvasSize.h },
      blur,
    })
    ctx.restore()
  }

  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.12)'
  ctx.shadowBlur = 8
  ctx.shadowOffsetY = 2
  roundRect({ ctx, rect, radius })
  ctx.fillStyle = color
  ctx.fill()
  ctx.restore()
}

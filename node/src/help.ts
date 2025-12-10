import { createCanvas, type Image, GlobalFonts } from 'canvas'
import type { HelpList } from './types'
import {
  colorToCss,
  parseColor,
  drawCard,
  drawImageCover,
  loadImage,
} from '@/utils'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const filePath = dirname(fileURLToPath(import.meta.url))
const FONT_PATH = join(filePath, '../fonts/DouyinSansBold.ttf')

// 配置常量
const WIDTH = 600
const PADDING = 24
const MAIN_TITLE_SIZE = 32
const TITLE_SIZE = 26
const NAME_SIZE = 14
const DESC_SIZE = 12
const ICON_SIZE = 20
const CARD = { w: 0, h: 72, gap: 12, padding: 12, radius: 12 }
const COLS = 3
const SCALE = 2

// 默认颜色
const COLOR = {
  bg: 'rgba(245, 245, 250, 1)',
  card: 'rgba(255, 255, 255, 0.7)',
  text: 'rgba(50, 50, 60, 1)',
  desc: 'rgba(80, 80, 90, 0.78)',
  title: 'rgba(0, 0, 0, 1)',
}

/**
 * 生成帮助图片
 */
export async function help(options: HelpList): Promise<Buffer> {
  const { title, theme, list } = options
  GlobalFonts.registerFromPath(FONT_PATH, 'DouyinSansBold')

  const height = calcHeight(options)
  const canvas = createCanvas(WIDTH * SCALE, height * SCALE)
  const ctx = canvas.getContext('2d')
  ctx.scale(SCALE, SCALE)

  let bgImage: Image | undefined
  if (theme?.backgroundImage) {
    try {
      bgImage = await loadImage(theme.backgroundImage)
      drawImageCover({
        ctx,
        image: bgImage,
        dest: { x: 0, y: 0, w: WIDTH, h: height },
      })
    } catch {}
  } else {
    ctx.fillStyle = theme?.backgroundColor
      ? colorToCss(parseColor(theme.backgroundColor))
      : COLOR.bg
    ctx.fillRect(0, 0, WIDTH, height)
  }

  const cardW = (WIDTH - PADDING * 2 - CARD.gap * (COLS - 1)) / COLS
  const titleColor = theme?.titleColor
    ? colorToCss(parseColor(theme.titleColor))
    : COLOR.title

  let y = PADDING

  if (title) {
    ctx.fillStyle = titleColor
    ctx.font = `bold ${MAIN_TITLE_SIZE}px DouyinSansBold`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(title, WIDTH / 2, y)
    y += MAIN_TITLE_SIZE + PADDING
  }

  for (const group of list) {
    ctx.fillStyle = titleColor
    ctx.font = `bold ${TITLE_SIZE}px DouyinSansBold`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(group.name, PADDING, y)

    const startY = y + TITLE_SIZE + PADDING

    for (let i = 0; i < group.list.length; i++) {
      const item = group.list[i]
      const col = i % COLS
      const row = Math.floor(i / COLS)
      const cardX = PADDING + col * (cardW + CARD.gap)
      const cardY = startY + row * (CARD.h + CARD.gap)

      drawCard({
        ctx,
        rect: { x: cardX, y: cardY, w: cardW, h: CARD.h },
        radius: CARD.radius,
        color: COLOR.card,
        bgImage,
        canvasSize: { w: WIDTH, h: height },
      })

      const contentY = cardY + CARD.padding
      let nameX = cardX + CARD.padding

      if (item.icon) {
        try {
          const icon = await loadImage(item.icon)
          const iconY = contentY - (ICON_SIZE - NAME_SIZE) / 2
          ctx.drawImage(icon, cardX + CARD.padding, iconY, ICON_SIZE, ICON_SIZE)
          nameX += ICON_SIZE + 8
        } catch {}
      }

      ctx.fillStyle = COLOR.text
      ctx.font = `${NAME_SIZE}px DouyinSansBold`
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillText(item.name, nameX, contentY)

      ctx.fillStyle = COLOR.desc
      ctx.font = `${DESC_SIZE}px DouyinSansBold`
      ctx.fillText(item.desc, cardX + CARD.padding, contentY + NAME_SIZE + 8)
    }

    const rows = Math.ceil(group.list.length / COLS)
    y += TITLE_SIZE + PADDING + rows * (CARD.h + CARD.gap) - CARD.gap + PADDING
  }

  return canvas.toBuffer('image/png')
}

function calcHeight(data: HelpList): number {
  const mainH = data.title ? MAIN_TITLE_SIZE + PADDING : 0
  let h = PADDING + mainH

  for (const g of data.list) {
    const rows = Math.ceil(g.list.length / COLS)
    h += TITLE_SIZE + PADDING + rows * (CARD.h + CARD.gap) - CARD.gap + PADDING
  }
  return h
}

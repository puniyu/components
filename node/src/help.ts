import { createCanvas, type Image, type SKRSContext2D, GlobalFonts } from 'canvas'
import type { HelpList } from './types'
import {
  colorToCss,
  parseColor,
  drawCard,
  drawImageCover,
  loadImage,
  drawWrapText,
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
const CARD = { w: 0, minH: 72, gap: 12, padding: 12, radius: 12 }
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
interface CardHeight {
  height: number
  row: number
}

function calcCardHeight(
  ctx: SKRSContext2D,
  item: HelpList['list'][0]['list'][0],
  cardW: number,
): number {
  const maxTextWidth = cardW - CARD.padding * 2
  const maxNameWidth = item.icon ? maxTextWidth - ICON_SIZE - 8 : maxTextWidth

  ctx.font = `${NAME_SIZE}px DouyinSansBold`
  const nameLines = calcTextLines(ctx, item.name, maxNameWidth)
  const nameHeight = nameLines * (NAME_SIZE + 4)

  ctx.font = `${DESC_SIZE}px DouyinSansBold`
  const descLines = calcTextLines(ctx, item.desc, maxTextWidth)
  const descHeight = descLines * (DESC_SIZE + 4)

  const contentHeight = nameHeight + descHeight + 4
  const totalHeight = contentHeight + CARD.padding * 2

  return Math.max(totalHeight, CARD.minH)
}

function calcTextLines(ctx: SKRSContext2D, text: string, maxWidth: number): number {
  const words = text.split('')
  let line = ''
  let lineCount = 0

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i]
    const metrics = ctx.measureText(testLine)
    const testWidth = metrics.width

    if (testWidth > maxWidth && i > 0) {
      line = words[i]
      lineCount++
    } else {
      line = testLine
    }
  }

  lineCount++
  return lineCount
}

export async function help(options: HelpList): Promise<Buffer> {
  const { title, theme, list } = options
  GlobalFonts.registerFromPath(FONT_PATH, 'DouyinSansBold')

  const tempCanvas = createCanvas(WIDTH * SCALE, 100 * SCALE)
  const tempCtx = tempCanvas.getContext('2d')
  tempCtx.scale(SCALE, SCALE)

  const cardW = (WIDTH - PADDING * 2 - CARD.gap * (COLS - 1)) / COLS
  const groupHeights: Array<{ titleHeight: number; cardHeights: CardHeight[] }> = []

  for (const group of list) {
    const cardHeights: CardHeight[] = []
    const rowHeights = new Map<number, number>()

    for (let i = 0; i < group.list.length; i++) {
      const item = group.list[i]
      const row = Math.floor(i / COLS)
      const cardHeight = calcCardHeight(tempCtx, item, cardW)

      cardHeights.push({ height: cardHeight, row })

      const currentRowHeight = rowHeights.get(row) || 0
      rowHeights.set(row, Math.max(currentRowHeight, cardHeight))
    }

    const totalRowHeight = Array.from(rowHeights.values()).reduce(
      (sum, h) => sum + h + CARD.gap,
      0,
    ) - CARD.gap

    groupHeights.push({
      titleHeight: TITLE_SIZE + PADDING + totalRowHeight + PADDING,
      cardHeights,
    })
  }

  const mainH = title ? MAIN_TITLE_SIZE + PADDING : 0
  const height = PADDING + mainH + groupHeights.reduce((sum, g) => sum + g.titleHeight, 0)

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

  for (let groupIdx = 0; groupIdx < list.length; groupIdx++) {
    const group = list[groupIdx]
    const groupHeight = groupHeights[groupIdx]

    ctx.fillStyle = titleColor
    ctx.font = `bold ${TITLE_SIZE}px DouyinSansBold`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(group.name, PADDING, y)

    const startY = y + TITLE_SIZE + PADDING
    const rowYPositions = new Map<number, number>()
    let currentY = startY

    for (let i = 0; i < group.list.length; i++) {
      const row = Math.floor(i / COLS)
      if (!rowYPositions.has(row)) {
        rowYPositions.set(row, currentY)
        if (row > 0) {
          const prevRowMaxHeight = Math.max(
            ...groupHeight.cardHeights
              .filter(ch => ch.row === row - 1)
              .map(ch => ch.height),
          )
          currentY += prevRowMaxHeight + CARD.gap
          rowYPositions.set(row, currentY)
        }
      }
    }

    for (let i = 0; i < group.list.length; i++) {
      const item = group.list[i]
      const col = i % COLS
      const row = Math.floor(i / COLS)
      const cardX = PADDING + col * (cardW + CARD.gap)
      const cardY = rowYPositions.get(row)!
      const cardHeight = groupHeight.cardHeights[i].height

      drawCard({
        ctx,
        rect: { x: cardX, y: cardY, w: cardW, h: cardHeight },
        radius: CARD.radius,
        color: COLOR.card,
        bgImage,
        canvasSize: { w: WIDTH, h: height },
      })

      const contentY = cardY + CARD.padding
      let nameX = cardX + CARD.padding
      const maxTextWidth = cardW - CARD.padding * 2
      const maxNameWidth = item.icon ? maxTextWidth - ICON_SIZE - 8 : maxTextWidth

      ctx.font = `${NAME_SIZE}px DouyinSansBold`
      const nameLines = calcTextLines(ctx, item.name, maxNameWidth)
      const nameHeight = nameLines * (NAME_SIZE + 4)

      if (item.icon) {
        try {
          const icon = await loadImage(item.icon)
          const iconY = contentY + (nameHeight - ICON_SIZE) / 2
          ctx.drawImage(icon, cardX + CARD.padding, iconY, ICON_SIZE, ICON_SIZE)
          nameX += ICON_SIZE + 8
        } catch {}
      }

      ctx.fillStyle = COLOR.text
      ctx.font = `${NAME_SIZE}px DouyinSansBold`
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      drawWrapText({
        ctx,
        text: item.name,
        x: nameX,
        y: contentY,
        maxWidth: maxNameWidth,
        lineHeight: NAME_SIZE + 4,
      })

      ctx.fillStyle = COLOR.desc
      ctx.font = `${DESC_SIZE}px DouyinSansBold`
      drawWrapText({
        ctx,
        text: item.desc,
        x: cardX + CARD.padding,
        y: contentY + nameHeight + 4,
        maxWidth: maxTextWidth,
        lineHeight: DESC_SIZE + 4,
      })
    }

    y += groupHeight.titleHeight
  }

  return canvas.toBuffer('image/png')
}

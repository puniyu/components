import type { Color } from '../types'

/**
 * 解析颜色字符串，支持 #RGB, #RRGGBB, #AARRGGBB, rgb(), rgba() 格式
 */
export function parseColor(s: string): Color {
  const str = s.trim()

  if (str.startsWith('rgb')) {
    const inner = str
      .replace(/^rgba?\(/, '')
      .replace(/\)$/, '')
    const parts = inner.split(',').map((p) => p.trim())
    if (parts.length >= 3) {
      const r = parseInt(parts[0], 10) || 0
      const g = parseInt(parts[1], 10) || 0
      const b = parseInt(parts[2], 10) || 0
      const a = parts.length >= 4 ? parseFloat(parts[3]) : 1
      return { r, g, b, a }
    }
    return { r: 0, g: 0, b: 0, a: 1 } 
  }

  // #RGB, #RRGGBB, #AARRGGBB
  const hex = str.replace(/^#/, '')
  switch (hex.length) {
    case 3: {
      const r = parseInt(hex[0], 16) * 17
      const g = parseInt(hex[1], 16) * 17
      const b = parseInt(hex[2], 16) * 17
      return { r, g, b, a: 1 }
    }
    case 6: {
      const r = parseInt(hex.slice(0, 2), 16)
      const g = parseInt(hex.slice(2, 4), 16)
      const b = parseInt(hex.slice(4, 6), 16)
      return { r, g, b, a: 1 }
    }
    case 8: {
      const a = parseInt(hex.slice(0, 2), 16) / 255
      const r = parseInt(hex.slice(2, 4), 16)
      const g = parseInt(hex.slice(4, 6), 16)
      const b = parseInt(hex.slice(6, 8), 16)
      return { r, g, b, a }
    }
    default:
      return { r: 0, g: 0, b: 0, a: 1 }
  }
}

/**
 * 将 Color 转换为 CSS 颜色字符串
 */
export function colorToCss(color: Color): string {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`
}

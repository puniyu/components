import { GlobalFonts, Image } from 'canvas'

/**
 * 从 Buffer 注册字体
 */
export function loadFont(buffer: Buffer, family: string): void {
  GlobalFonts.register(buffer, family)
}

/**
 * 从 Buffer 加载图片
 */
export function loadImage(buffer: Buffer): Promise<Image> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = (err: unknown) => reject(err)
    image.src = buffer
  })
}

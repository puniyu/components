/**
 * 帮助项
 */
export interface HelpItem {
  /** 名称 */
  name: string
  /** 描述 */
  desc: string
  /** 图标数据 */
  icon?: Buffer
}

/**
 * 帮助分组
 */
export interface HelpGroup {
  /** 分组名称 */
  name: string
  /** 分组项列表 */
  list: HelpItem[]
}

/**
 * 主题配置（backgroundImage 与 backgroundColor 二选一）
 */
export type Theme<T = Buffer> = {
  /** 标题颜色 */
  titleColor?: string
} & (
  | { /** 背景图片数据 */ backgroundImage: T; backgroundColor?: never }
  | { /** 背景颜色（如 "#RRGGBB" 或 "#AARRGGBB"） */ backgroundColor: string; backgroundImage?: never }
  | { backgroundImage?: never; backgroundColor?: never }
)

/**
 * 帮助列表
 */
export interface HelpList<T = Buffer> {
  /** 标题 */
  title?: string
  /** 主题配置 */
  theme?: Theme<T>
  /** 帮助分组列表 */
  list: HelpGroup[]
}

/**
 * RGBA 颜色
 */
export interface Color {
  r: number
  g: number
  b: number
  a: number
}

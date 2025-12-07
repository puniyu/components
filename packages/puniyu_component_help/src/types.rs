use puniyu_skia::Color;

/// 帮助列表配置
#[derive(Debug)]
pub struct HelpList {
    pub title: Option<String>,
    pub theme: Option<Theme>,
    pub list: Vec<HelpGroup>,
}

/// 帮助分组
#[derive(Debug)]
pub struct HelpGroup {
    pub name: String,
    pub list: Vec<HelpItem>,
}

#[derive(Debug)]
pub struct HelpItem {
    pub name: String,
    pub desc: String,
    pub icon: Option<Vec<u8>>,
}

/// 背景类型
#[derive(Debug, Clone)]
pub enum Background {
    /// 图片背景
    Image(Vec<u8>),
    /// 纯色背景
    Color(Color),
}

impl Default for Background {
    fn default() -> Self {
        Self::Color(Color::from_argb(255, 245, 245, 250))
    }
}

#[derive(Debug, Clone, Default)]
pub struct Theme {
    pub background: Option<Background>,
    pub title_color: Option<Color>,
}


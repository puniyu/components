use puniyu_skia::Color;

/// 帮助列表配置
#[derive(Debug)]
pub struct HelpList {
    pub title: String,
    pub theme: Theme,
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

#[derive(Debug)]
pub struct Theme {
    pub background: Option<Vec<u8>>,
    pub background_color: Color,
    pub title_color: Color,
}

impl Default for Theme {
    fn default() -> Self {
        Self {
            background: None,
            background_color: Color::from_argb(255, 245, 245, 250),
            title_color: Color::from_argb(255, 0, 0, 0),
        }
    }
}

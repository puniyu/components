use napi_derive::napi;
use napi::bindgen_prelude::Buffer;
use puniyu_skia::Color;

/// 解析颜色字符串，支持 #RGB, #RRGGBB, #AARRGGBB, rgb(), rgba() 格式
fn parse_color(s: &str) -> Color {
    let s = s.trim();
    
    // rgb(r, g, b) 或 rgba(r, g, b, a)
    if s.starts_with("rgb") {
        let inner = s.trim_start_matches("rgba")
            .trim_start_matches("rgb")
            .trim_start_matches('(')
            .trim_end_matches(')');
        let parts: Vec<&str> = inner.split(',').map(|p| p.trim()).collect();
        if parts.len() >= 3 {
            let r = parts[0].parse().unwrap_or(0);
            let g = parts[1].parse().unwrap_or(0);
            let b = parts[2].parse().unwrap_or(0);
            let a = if parts.len() >= 4 {
                (parts[3].parse::<f32>().unwrap_or(1.0) * 255.0) as u8
            } else {
                255
            };
            return Color::from_argb(a, r, g, b);
        }
        return Color::BLACK;
    }
    
    // #RGB, #RRGGBB, #AARRGGBB
    let hex = s.trim_start_matches('#');
    match hex.len() {
        3 => {
            let r = u8::from_str_radix(&hex[0..1], 16).unwrap_or(0) * 17;
            let g = u8::from_str_radix(&hex[1..2], 16).unwrap_or(0) * 17;
            let b = u8::from_str_radix(&hex[2..3], 16).unwrap_or(0) * 17;
            Color::from_rgb(r, g, b)
        }
        6 => {
            let r = u8::from_str_radix(&hex[0..2], 16).unwrap_or(0);
            let g = u8::from_str_radix(&hex[2..4], 16).unwrap_or(0);
            let b = u8::from_str_radix(&hex[4..6], 16).unwrap_or(0);
            Color::from_rgb(r, g, b)
        }
        8 => {
            let a = u8::from_str_radix(&hex[0..2], 16).unwrap_or(255);
            let r = u8::from_str_radix(&hex[2..4], 16).unwrap_or(0);
            let g = u8::from_str_radix(&hex[4..6], 16).unwrap_or(0);
            let b = u8::from_str_radix(&hex[6..8], 16).unwrap_or(0);
            Color::from_argb(a, r, g, b)
        }
        _ => Color::BLACK,
    }
}

#[napi(object)]
pub struct HelpList {
	pub title: Option<String>,
	pub theme: Option<Theme>,
	pub list: Vec<HelpGroup>,
}

impl From<HelpList> for puniyu_component_help::HelpList {
	fn from(list: HelpList) -> Self {
		Self {
			title: list.title,
			theme: list.theme.map(|t| t.into()),
			list: list.list.into_iter().map(|group| group.into()).collect()
		}
	}
}

#[napi(object)]
pub struct HelpGroup {
	pub name: String,
	pub list: Vec<HelpItem>,
}

impl From<HelpGroup> for puniyu_component_help::HelpGroup {
	fn from(group: HelpGroup) -> Self {
		Self {
			name: group.name,
			list: group.list.into_iter().map(|item| item.into()).collect()
		}
	}
}

#[napi(object)]
pub struct HelpItem {
	pub name: String,
	pub desc: String,
	pub icon: Option<Buffer>,
}


impl From<HelpItem> for puniyu_component_help::HelpItem {
	fn from(itm: HelpItem) -> Self {
		Self {
			name: itm.name,
			desc: itm.desc,
			icon: itm.icon.map(|v| v.to_vec()),
		}
	}
}

#[napi(object)]
pub struct Theme {
	/// 背景图片数据
	pub background_image: Option<Buffer>,
	/// 背景颜色（如 "#RRGGBB" 或 "#AARRGGBB"），与 background_image 二选一
	pub background_color: Option<String>,
	/// 标题颜色
	pub title_color: Option<String>,
}

impl From<Theme> for puniyu_component_help::Theme {
	fn from(theme: Theme) -> Self {
		use puniyu_component_help::Background;

		let background = theme
			.background_image
			.map(|img| Background::Image(img.to_vec()))
			.or_else(|| theme.background_color.as_ref().map(|c| Background::Color(parse_color(c))));

		Self {
			background,
			title_color: theme.title_color.as_ref().map(|c| parse_color(c)),
		}
	}
}
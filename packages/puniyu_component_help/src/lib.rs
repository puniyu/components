mod error;
mod render;
mod types;

use puniyu_skia::{Color, EncodedImageFormat, Rect, font::FontManger, surfaces};
use puniyu_skia::textlayout::TextAlign;

pub use error::Error;
use render::{TextParams, draw_background, draw_card, draw_icon, draw_text};
pub use types::{HelpGroup, HelpItem, HelpList, Theme};

const FONT: &[u8] = include_bytes!("../fonts/DouyinSansBold.ttf");

const WIDTH: i32 = 600;
const CARD_RADIUS: f32 = 12.0;
const BLUR_SIGMA: f32 = 20.0;

/// 绘制帮助页面
///
/// # 参数
/// - `help_list`: 帮助列表配置
///
/// # 返回
/// 返回 PNG 格式图片数据
pub fn help(help_list: &HelpList) -> Result<Vec<u8>, Error> {
    const PADDING: f32 = 24.0;
    const MAIN_TITLE_FONT_SIZE: f32 = 32.0;
    const TITLE_FONT_SIZE: f32 = 26.0;
    const NAME_FONT_SIZE: f32 = 14.0;
    const DESC_FONT_SIZE: f32 = 12.0;
    const ICON_SIZE: f32 = 20.0;
    const CARD_HEIGHT: f32 = 72.0;
    const ICON_TEXT_GAP: f32 = 8.0;
    const CARD_PADDING: f32 = 12.0;
    const CARD_GAP: f32 = 12.0;
    const COLS: usize = 3;
    const FONT_FAMILY: &str = "DouyinSansBold";
    const SCALE_FACTOR: f32 = 2.0;
    const DEFAULT_CARD_COLOR: Color = Color::from_argb(180, 255, 255, 255);
    const DEFAULT_TEXT_COLOR: Color = Color::from_argb(255, 50, 50, 60);
    const DEFAULT_DESC_COLOR: Color = Color::from_argb(200, 80, 80, 90);

    let bg_color = help_list.theme.background_color;
    let main_title_height = MAIN_TITLE_FONT_SIZE + PADDING;
    let title_section_height = TITLE_FONT_SIZE + PADDING;
    let total_gap = CARD_GAP * (COLS as f32 - 1.0);
    let card_width = (WIDTH as f32 - PADDING * 2.0 - total_gap) / COLS as f32;

    let mut total_height = PADDING + main_title_height;
    for group in &help_list.list {
        let rows = group.list.len().div_ceil(COLS);
        let cards_height = rows as f32 * (CARD_HEIGHT + CARD_GAP) - CARD_GAP;
        total_height += title_section_height + cards_height + PADDING;
    }
    let height = total_height as i32;

    let scaled_width = (WIDTH as f32 * SCALE_FACTOR) as i32;
    let scaled_height = (height as f32 * SCALE_FACTOR) as i32;
    let mut surface =
        surfaces::raster_n32_premul((scaled_width, scaled_height)).ok_or(Error::Encode)?;

    let canvas = surface.canvas();
    canvas.scale((SCALE_FACTOR, SCALE_FACTOR));

    let bg_image = draw_background(canvas, help_list.theme.background.as_deref().unwrap_or(&[]), bg_color, height)?;

    let mut font_manager = FontManger::new();
    font_manager.register_font(FONT, None).unwrap();
    let font_collection = font_manager.font_collection();

    let title_color = help_list.theme.title_color;

    draw_text(
        canvas,
        &help_list.title,
        &TextParams {
            rect: Rect::from_xywh(0.0, PADDING, WIDTH as f32, MAIN_TITLE_FONT_SIZE),
            font_size: MAIN_TITLE_FONT_SIZE,
            color: title_color,
            font_family: FONT_FAMILY,
            align: TextAlign::Center,
        },
        font_collection,
    );

    let mut current_y = PADDING + main_title_height;

    for help_group in &help_list.list {
        draw_text(
            canvas,
            &help_group.name,
            &TextParams {
                rect: Rect::from_xywh(PADDING, current_y, WIDTH as f32 - PADDING * 2.0, TITLE_FONT_SIZE),
                font_size: TITLE_FONT_SIZE,
                color: title_color,
                font_family: FONT_FAMILY,
                align: TextAlign::Left,
            },
            font_collection,
        );

        let content_start_y = current_y + title_section_height;

        for (i, item) in help_group.list.iter().enumerate() {
            let col = i % COLS;
            let row = i / COLS;
            let card_x = PADDING + col as f32 * (card_width + CARD_GAP);
            let card_y = content_start_y + row as f32 * (CARD_HEIGHT + CARD_GAP);

            draw_card(
                canvas,
                Rect::from_xywh(card_x, card_y, card_width, CARD_HEIGHT),
                DEFAULT_CARD_COLOR,
                bg_image.as_ref(),
                height,
            );

            let has_icon = item.icon.as_ref().is_some_and(|v| !v.is_empty());
            let content_y = card_y + CARD_PADDING;

            let name_x = if has_icon {
                draw_icon(
                    canvas,
                    item.icon.as_deref().unwrap(),
                    card_x + CARD_PADDING,
                    content_y,
                    ICON_SIZE,
                )?;
                card_x + CARD_PADDING + ICON_SIZE + ICON_TEXT_GAP
            } else {
                card_x + CARD_PADDING
            };

            draw_text(
                canvas,
                &item.name,
                &TextParams {
                    rect: Rect::from_xywh(name_x, content_y, card_width - CARD_PADDING * 2.0, NAME_FONT_SIZE),
                    font_size: NAME_FONT_SIZE,
                    color: DEFAULT_TEXT_COLOR,
                    font_family: FONT_FAMILY,
                    align: TextAlign::Left,
                },
                font_collection,
            );

            draw_text(
                canvas,
                &item.desc,
                &TextParams {
                    rect: Rect::from_xywh(card_x + CARD_PADDING, content_y + NAME_FONT_SIZE + 8.0, card_width - CARD_PADDING * 2.0, DESC_FONT_SIZE),
                    font_size: DESC_FONT_SIZE,
                    color: DEFAULT_DESC_COLOR,
                    font_family: FONT_FAMILY,
                    align: TextAlign::Left,
                },
                font_collection,
            );
        }

        let rows = help_group.list.len().div_ceil(COLS);
        let cards_height = rows as f32 * (CARD_HEIGHT + CARD_GAP) - CARD_GAP;
        current_y += title_section_height + cards_height + PADDING;
    }

    let image = surface.image_snapshot();
    let data = image
        .encode(None, EncodedImageFormat::PNG, None)
        .ok_or(Error::Encode)?;

    Ok(data.as_bytes().to_vec())
}

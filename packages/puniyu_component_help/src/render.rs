use puniyu_skia::{
    Canvas, ClipOp, Color, Data, Image, MaskFilter, Paint, PaintStyle, RRect, Rect,
    image_filters,
    textlayout::{FontCollection, ParagraphBuilder, ParagraphStyle, TextAlign, TextStyle},
};

use crate::{Error, WIDTH, CARD_RADIUS, BLUR_SIGMA};

/// 绘制背景
pub fn draw_background(
    canvas: &Canvas,
    background_data: &[u8],
    bg_color: Color,
    height: i32,
) -> Result<Option<Image>, Error> {
    if background_data.is_empty() {
        canvas.clear(bg_color);
        return Ok(None);
    }

    let data = Data::new_copy(background_data);
    let image = Image::from_encoded(data).ok_or(Error::Decode)?;

    let img_w = image.width() as f32;
    let img_h = image.height() as f32;
    let dst_w = WIDTH as f32;
    let dst_h = height as f32;

    let scale = (dst_w / img_w).max(dst_h / img_h);
    let src_w = dst_w / scale;
    let src_h = dst_h / scale;
    let src_x = (img_w - src_w) / 2.0;
    let src_y = (img_h - src_h) / 2.0;

    let src_rect = Rect::from_xywh(src_x, src_y, src_w, src_h);
    let dst_rect = Rect::from_wh(dst_w, dst_h);

    canvas.draw_image_rect(
        &image,
        Some((&src_rect, puniyu_skia::canvas::SrcRectConstraint::Fast)),
        dst_rect,
        &Paint::default(),
    );

    Ok(Some(image))
}

/// 绘制毛玻璃卡片
pub fn draw_card(
    canvas: &Canvas,
    rect: Rect,
    color: Color,
    bg_image: Option<&Image>,
    canvas_height: i32,
) {
    let rrect = RRect::new_rect_xy(rect, CARD_RADIUS, CARD_RADIUS);

    if let Some(image) = bg_image {
        canvas.save();
        canvas.clip_rrect(rrect, ClipOp::Intersect, true);

        let img_w = image.width() as f32;
        let img_h = image.height() as f32;
        let dst_w = WIDTH as f32;
        let dst_h = canvas_height as f32;

        let scale = (dst_w / img_w).max(dst_h / img_h);
        let src_w = dst_w / scale;
        let src_h = dst_h / scale;
        let src_x = (img_w - src_w) / 2.0;
        let src_y = (img_h - src_h) / 2.0;

        let src_rect = Rect::from_xywh(src_x, src_y, src_w, src_h);
        let dst_rect = Rect::from_wh(dst_w, dst_h);

        let blur_filter = image_filters::blur((BLUR_SIGMA, BLUR_SIGMA), None, None, None);
        let mut blur_paint = Paint::default();
        blur_paint.set_image_filter(blur_filter);

        canvas.draw_image_rect(
            image,
            Some((&src_rect, puniyu_skia::canvas::SrcRectConstraint::Fast)),
            dst_rect,
            &blur_paint,
        );

        canvas.restore();
    }

    let mut paint = Paint::default();
    paint.set_color(color);
    paint.set_style(PaintStyle::Fill);
    paint.set_anti_alias(true);

    let shadow_paint = {
        let mut p = Paint::default();
        p.set_color(Color::from_argb(30, 0, 0, 0));
        p.set_mask_filter(MaskFilter::blur(puniyu_skia::BlurStyle::Normal, 8.0, false));
        p
    };
    canvas.draw_rrect(rrect, &shadow_paint);
    canvas.draw_rrect(rrect, &paint);
}

/// 绘制图标
pub fn draw_icon(
    canvas: &Canvas,
    icon_data: &[u8],
    x: f32,
    y: f32,
    size: f32,
) -> Result<(), Error> {
    let png_data = convert_png(icon_data, size as u32)?;
    let data = Data::new_copy(&png_data);
    let image = Image::from_encoded(data).ok_or(Error::Decode)?;

    let dst_rect = Rect::from_xywh(x, y + (size - image.height() as f32) / 2.0, size, size);
    let src_rect = Rect::from_wh(image.width() as f32, image.height() as f32);

    canvas.draw_image_rect(
        &image,
        Some((&src_rect, puniyu_skia::canvas::SrcRectConstraint::Fast)),
        dst_rect,
        &Paint::default(),
    );

    Ok(())
}

/// 将图标转换为 PNG 格式
fn convert_png(icon_data: &[u8], size: u32) -> Result<Vec<u8>, Error> {
    use image::ImageReader;
    use std::io::Cursor;

    // 尝试解析为 SVG
    if let Ok(tree) = resvg::usvg::Tree::from_data(icon_data, &resvg::usvg::Options::default()) {
        let mut pixmap = resvg::tiny_skia::Pixmap::new(size, size).ok_or(Error::Encode)?;
        let scale = size as f32 / tree.size().width().max(tree.size().height());
        let transform = resvg::tiny_skia::Transform::from_scale(scale, scale);
        resvg::render(&tree, transform, &mut pixmap.as_mut());
        return pixmap.encode_png().map_err(|_| Error::Encode);
    }

    // 其他格式使用 image crate
    let img = ImageReader::new(Cursor::new(icon_data))
        .with_guessed_format()
        .map_err(|_| Error::Decode)?
        .decode()
        .map_err(|_| Error::Decode)?;

    let resized = img.resize_exact(size, size, image::imageops::FilterType::Lanczos3);

    let mut buf = Vec::new();
    resized
        .write_to(&mut Cursor::new(&mut buf), image::ImageFormat::Png)
        .map_err(|_| Error::Encode)?;

    Ok(buf)
}

pub struct TextParams<'a> {
    pub rect: Rect,
    pub font_size: f32,
    pub color: Color,
    pub font_family: &'a str,
    pub align: TextAlign,
}

pub fn draw_text(
    canvas: &Canvas,
    text: &str,
    params: &TextParams,
    font_collection: &FontCollection,
) {
    let mut text_style = TextStyle::new();
    text_style.set_font_size(params.font_size);
    text_style.set_color(params.color);
    text_style.set_font_families(&[params.font_family]);

    let mut paragraph_style = ParagraphStyle::new();
    paragraph_style.set_text_style(&text_style);
    paragraph_style.set_text_align(params.align);

    let mut builder = ParagraphBuilder::new(&paragraph_style, font_collection);
    builder.add_text(text);

    let mut paragraph = builder.build();
    paragraph.layout(params.rect.width());
    paragraph.paint(canvas, (params.rect.x(), params.rect.y()));
}

use thiserror::Error;

/// 帮助页面绘制错误
#[derive(Debug, Error)]
pub enum Error {
    #[error("解码失败")]
    Decode,
    #[error("编码失败")]
    Encode,
}

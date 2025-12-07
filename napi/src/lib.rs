mod types;

use napi::bindgen_prelude::Buffer;
use napi_derive::napi;

#[napi]
pub fn help(help: types::HelpList) -> napi::Result<Buffer> {
    puniyu_component_help::help(&help.into())
        .map(|v| v.into())
        .map_err(|e| napi::Error::from_reason(e.to_string()))
}
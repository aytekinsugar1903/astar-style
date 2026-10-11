WEYRA local browser image engine

U2NETP model: U²-Net by Xuebin Qin et al.
Source: https://github.com/xuebinqin/U-2-Net
Model conversion distribution: https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2netp.onnx
License: Apache-2.0 (U2NET-LICENSE.txt)

ONNX Runtime Web: Microsoft, MIT (ONNX-LICENSE.txt).
Runtime version is pinned in package-lock.json; the .js, .mjs and .wasm files
here are from that package's dist directory and must be updated together.

Photo content is processed in browser memory, never sent to an inference API.
Only these static files are downloaded when the user requests cleanup.
This is salient foreground extraction, not garment-class detection or virtual try-on.
Expo Go uses the manual crop path; browser-only capability is explicitly labelled.

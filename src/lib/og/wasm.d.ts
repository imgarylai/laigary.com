// The Cloudflare Vite plugin provides .wasm imports as pre-compiled
// WebAssembly.Module values (workerd forbids compiling wasm from bytes at
// runtime, so static module imports are the only option in production).
declare module "*.wasm" {
  const module: WebAssembly.Module;
  export default module;
}

// Vite `?inline` imports resolve to a base64 data URI string.
declare module "*.ttf?inline" {
  const dataUri: string;
  export default dataUri;
}

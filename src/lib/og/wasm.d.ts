// The Cloudflare Vite plugin provides .wasm imports as pre-compiled
// WebAssembly.Module values (workerd forbids compiling wasm from bytes at
// runtime, so static module imports are the only option in production).
declare module "*.wasm" {
  const module: WebAssembly.Module;
  export default module;
}

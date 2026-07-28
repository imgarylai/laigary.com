// Stands in for any `*.css?url` import under vitest (wired up by `cssUrlStub`
// in vitest.config.ts).
//
// Vite only mints the hashed asset URL during a real build, so outside one the
// import evaluates to "" and __root's shell renders
// `<link rel="stylesheet" href="">` — an empty `href` React warns about on
// every single render, which was 36 of the suite's console warnings.
//
// `undefined` and not a plausible URL like "/assets/styles.css": React 19 treats
// a `<link rel="stylesheet">` with an href as a suspensey resource and holds the
// commit until the sheet loads, which under jsdom is never — every route test
// then renders an empty container. Dropping the attribute entirely leaves
// nothing to warn about and nothing to wait for, and the stylesheet is not
// something any test asserts on.
export default undefined;

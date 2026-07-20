// Test stub for the `cloudflare:workers` virtual module (aliased in
// vitest.config.ts). Query tests mock `drizzle-orm/d1`, so the binding value
// here is never actually used — this only makes `import { env }` resolvable
// under Node/Vitest.
export const env = {} as Record<string, unknown>;

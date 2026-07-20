// Public barrel for the admin mutation server functions. Admin forms (#30)
// import the `*Fn` server functions from here; the `*Impl` functions and zod
// schemas are exported from the per-domain modules for unit testing.
export { createPostFn, updatePostFn, deletePostFn } from "./posts";
export { createTagFn, updateTagFn, deleteTagFn } from "./tags";
export { upsertPageFn } from "./pages";
export {
  createSectionFn,
  updateSectionFn,
  deleteSectionFn,
  createNoteFn,
  updateNoteFn,
  deleteNoteFn,
} from "./interview";
export { updateSettingsFn } from "./settings";

export type { ActionResult } from "./_shared";

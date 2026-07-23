// Public barrel — route loaders and tests import from `@/server/public`.
// Internal helpers (renderMd) stay in _shared and are not re-exported; the
// tested helpers below are.

export { DEFAULT_SITE_NAME, pageChrome, pickSocial, slugInput } from "./_shared";

export {
  blogShellImpl,
  blogShellFn,
  homeDataImpl,
  homeDataFn,
  postsDataImpl,
  postsDataFn,
  postDataImpl,
  postDataFn,
  tagsDataImpl,
  tagsDataFn,
  tagDataImpl,
  tagDataFn,
  pageDataImpl,
  pageDataFn,
} from "./blog";

export {
  mapInterviewSections,
  interviewShellImpl,
  interviewShellFn,
  searchInterviewNotesImpl,
  searchInterviewNotesFn,
  interviewDataImpl,
  interviewDataFn,
  sectionDataImpl,
  sectionDataFn,
  noteDataImpl,
  noteDataFn,
} from "./interview";

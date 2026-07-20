// Public barrel for the data access layer. Internal helpers (_db, _tags) are
// intentionally not re-exported — call sites should use the typed query
// functions below.

export type { PostTag } from "./_tags";

export type { PublicPost, PublicPostDetail, AdminPost } from "./posts";
export {
  getPublishedPosts,
  getPostBySlug,
  getAdminPosts,
  getTagsWithCounts,
  createPost,
  updatePost,
  deletePost,
  PostConflictError,
  PostNotFoundError,
} from "./posts";

export type { Tag, TagWithUsage, UsedByItem } from "./tags";
export {
  getTagsWithUsage,
  createTag,
  updateTag,
  deleteTag,
  TagConflictError,
  TagNotFoundError,
} from "./tags";

export type { InterviewNoteWithTags, AdminInterviewNote } from "./interview";
export {
  getInterviewSections,
  getInterviewSectionBySlug,
  getInterviewNoteCountsBySection,
  getRecentInterviewNotes,
  getInterviewNotesBySection,
  getTagsInSection,
  getAdminInterviewNotes,
  getInterviewNote,
  getInterviewNoteById,
  createSection,
  updateSection,
  deleteSection,
  createNote,
  updateNote,
  deleteNote,
  SectionConflictError,
  SectionNotFoundError,
  NoteConflictError,
  NoteNotFoundError,
} from "./interview";

export { getPageBySlug, getAllPages, upsertPage } from "./pages";

export { getSiteSettings, getSiteSetting, updateSiteSettings } from "./site";

export { recordUpload, UploadConflictError, type UploadInput } from "./uploads";

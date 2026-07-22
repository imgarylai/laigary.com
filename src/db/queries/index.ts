// Public barrel for the data access layer. Internal helpers (_db, _tags) are
// intentionally not re-exported — call sites should use the typed query
// functions below.

export type { PostTag } from "./_tags";

export type { PublicPost, PublicPostDetail, AdminPost, AdminPostDetail } from "./posts";
export {
  getPublishedPosts,
  getPostBySlug,
  getAdminPosts,
  getAllAdminPosts,
  getAdminPostById,
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
  getAllTags,
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
  searchPublishedInterviewNotes,
  searchAdminInterviewNotes,
  getTagsInSection,
  getAdminInterviewNotes,
  getAllAdminInterviewNotes,
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

export { getPageBySlug, getAllPages, getPagesList, upsertPage, type PageListItem } from "./pages";

export { getSiteSettings, getSiteSetting, updateSiteSettings } from "./site";

export { getSitemapData, type SitemapData } from "./sitemap";

export { recordUpload, UploadConflictError, type UploadInput } from "./uploads";

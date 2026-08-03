// Public barrel for the data access layer. Internal helpers (_db, _tags) are
// intentionally not re-exported — call sites should use the typed query
// functions below.

export type { PostTag } from "./_tags";

// Scheduling. `livePosts`/`liveNotes` stay internal (they are SQL fragments for
// the query layer's own use); what callers outside it need is when the next
// scheduled item comes due, which is what bounds the edge cache.
export { getNextScheduledPublishAt } from "./_visibility";

export type {
  PublicPost,
  PublicPostDetail,
  AdminPost,
  AdminPostDetail,
  FeedPost,
  AdjacentPost,
} from "./posts";
export {
  getPublishedPosts,
  getFeedPosts,
  getAdjacentPosts,
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
  getTagBySlug,
  getAllTags,
  createTag,
  updateTag,
  deleteTag,
  TagConflictError,
  TagNotFoundError,
} from "./tags";

export type {
  InterviewNoteWithTags,
  AdminInterviewNote,
  PublishedNoteIndexEntry,
  NoteByTag,
} from "./interview";
export {
  getInterviewSections,
  getInterviewSectionBySlug,
  getPublishedNoteIndex,
  getPublishedNotesByTag,
  getInterviewNoteCountsBySection,
  getRecentInterviewNotes,
  getInterviewNotesBySection,
  getPinnedInterviewNotes,
  searchPublishedInterviewNotes,
  searchAdminInterviewNotes,
  getTagsInSection,
  getAdminInterviewNotes,
  ADMIN_NOTES_PAGE_SIZE,
  isAdminNoteSort,
  type AdminNoteSort,
  getInterviewNote,
  getInterviewNoteById,
  getInterviewNoteIdBySlug,
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

export type { PublicWork, PublicWorkDetail, AdminWork, AdminWorkDetail } from "./works";
export {
  getPublishedWorks,
  getWorkBySlug,
  getAdminWorks,
  getAllAdminWorks,
  getAdminWorkById,
  createWork,
  updateWork,
  deleteWork,
  WorkConflictError,
  WorkNotFoundError,
} from "./works";

export {
  getPageBySlug,
  getAllPages,
  getPagesList,
  upsertPage,
  deletePage,
  PageNotFoundError,
  type PageListItem,
} from "./pages";

export { getSiteSettings, getSiteSetting, updateSiteSettings } from "./site";

export { getSitemapData, type SitemapData } from "./sitemap";

export { getDashboardStats, type DashboardStats } from "./stats";

export { recordUpload, UploadConflictError, type UploadInput } from "./uploads";

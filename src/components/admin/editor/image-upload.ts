// Pasting a screenshot is how images actually get into a technical post, and
// until now it did nothing — the only route was the dialog (#176). This adds the
// fast path for paste and drag-drop; ImageUploadDialog stays for the cases that
// want cropping or a deliberate file pick.
//
// Extension comes from @tiptap/react, which re-exports @tiptap/core — pnpm does
// not expose the latter transitively (same route code-block.ts takes).
import { Extension } from "@tiptap/react";
import { Plugin, PluginKey, type EditorState } from "@tiptap/pm/state";
import { Decoration, DecorationSet, type EditorView } from "@tiptap/pm/view";
import { toast } from "sonner";
import { compressImage, uploadFile } from "@/lib/upload-client";

export type ImageUploadMessages = {
  /** Shown in the placeholder while the bytes are in flight. */
  uploading: string;
  /** Fallback toast when the failure carries no message of its own. */
  failed: string;
  /** Toast when the upload never settles at all. */
  timedOut: string;
};

/**
 * How long an upload may run before the placeholder gives up.
 *
 * Not belt-and-braces: an upload that neither resolves nor rejects leaves a
 * permanent "Uploading..." badge in the document, clearable only by reloading.
 * `fetch` has no default timeout, so a stalled PUT to storage does exactly
 * that. Generous on purpose — compressImage caps uploads at 1MB and the whole
 * round trip is normally a second or two, so this bounds the pathological case
 * rather than policing merely slow ones.
 */
const UPLOAD_TIMEOUT_MS = 60_000;

function withTimeout<T>(work: Promise<T>, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), UPLOAD_TIMEOUT_MS);
    work.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

const uploadKey = new PluginKey<DecorationSet>("imageUpload");

/** Identifies one in-flight upload's placeholder. */
type UploadId = symbol;

type UploadAction =
  | { add: { id: UploadId; pos: number; label: string } }
  | { remove: { id: UploadId } };

/**
 * The image files carried by a paste or a drop, if any.
 *
 * Copying an image out of a web page puts both the file and an `<img>` in
 * `text/html` on the clipboard. Preferring the file means the bytes land in our
 * own R2 rather than hotlinking someone else's server.
 */
export function imageFilesFrom(data: DataTransfer | null | undefined): File[] {
  if (!data?.files) return [];
  return Array.from(data.files).filter((file) => file.type.startsWith("image/"));
}

/** How many uploads are still in flight — the placeholders currently shown. */
export function pendingUploadCount(state: EditorState): number {
  const set = uploadKey.getState(state);
  return set ? set.find().length : 0;
}

function placeholderWidget(label: string): HTMLElement {
  const el = document.createElement("span");
  el.className =
    "mx-0.5 inline-flex animate-pulse items-center rounded-sm border border-dashed px-1.5 py-0.5 align-middle text-xs text-muted-foreground";
  el.textContent = label;
  return el;
}

/** Where a given upload's placeholder sits now, or null if it is gone. */
function findPlaceholder(state: EditorState, id: UploadId): number | null {
  const set = uploadKey.getState(state);
  const found = set?.find(undefined, undefined, (spec) => spec.imageUploadId === id);
  return found?.length ? found[0].from : null;
}

/**
 * Upload one file and drop the resulting image where its placeholder ended up.
 *
 * The placeholder is a widget decoration rather than a real node on purpose: a
 * node would be part of the document, so the in-flight state would serialize
 * into the markdown handed to the form, and a ⌘S mid-upload would persist a
 * `blob:` URL that means nothing after a reload. A decoration never serializes,
 * and it still maps through every transaction — so typing, or pasting a second
 * image, moves it correctly instead of stranding the image at a stale offset.
 */
async function uploadAt(
  view: EditorView,
  file: File,
  pos: number,
  messages: ImageUploadMessages,
): Promise<void> {
  const id: UploadId = Symbol("imageUpload");
  view.dispatch(
    view.state.tr.setMeta(uploadKey, {
      add: { id, pos, label: messages.uploading },
    } satisfies UploadAction),
  );

  try {
    // The timeout wraps compression too: that is where the hang was seen, and
    // it is upstream of any network request.
    const url = await withTimeout(
      (async () => uploadFile(await compressImage(file)))(),
      messages.timedOut,
    );
    const at = findPlaceholder(view.state, id);
    // Gone means the user deleted the surrounding region while it uploaded.
    // Inserting anyway would put the image somewhere they were not looking.
    if (at === null) return;
    view.dispatch(
      view.state.tr
        .replaceRangeWith(at, at, view.state.schema.nodes.image.create({ src: url }))
        .setMeta(uploadKey, { remove: { id } } satisfies UploadAction),
    );
  } catch (err) {
    view.dispatch(view.state.tr.setMeta(uploadKey, { remove: { id } } satisfies UploadAction));
    toast.error(err instanceof Error ? err.message : messages.failed);
  }
}

function imageUploadPlugin(messages: ImageUploadMessages) {
  return new Plugin<DecorationSet>({
    key: uploadKey,
    state: {
      init: () => DecorationSet.empty,
      apply(tr, set) {
        // Map first: the placeholder has to follow the text it was dropped into.
        let next = set.map(tr.mapping, tr.doc);
        const action = tr.getMeta(uploadKey) as UploadAction | undefined;
        if (action && "add" in action) {
          const { id, pos, label } = action.add;
          next = next.add(tr.doc, [
            Decoration.widget(pos, () => placeholderWidget(label), { imageUploadId: id }),
          ]);
        }
        if (action && "remove" in action) {
          next = next.remove(
            next.find(undefined, undefined, (spec) => spec.imageUploadId === action.remove.id),
          );
        }
        return next;
      },
    },
    props: {
      decorations: (state) => uploadKey.getState(state),

      handlePaste(view, event) {
        const files = imageFilesFrom(event.clipboardData);
        // No image on the clipboard: fall through so text and rich text paste
        // exactly as they did before.
        if (!files.length) return false;
        event.preventDefault();
        for (const file of files) void uploadAt(view, file, view.state.selection.from, messages);
        return true;
      },

      handleDrop(view, event, _slice, moved) {
        // `moved` is a node being dragged inside the editor, not a file arriving
        // from outside; ProseMirror already knows how to handle that one.
        if (moved) return false;
        const files = imageFilesFrom(event.dataTransfer);
        if (!files.length) return false;
        event.preventDefault();
        // Drop where the pointer is, not where the caret happens to be.
        // posAtCoords returns null when the point is outside the editable area
        // — dropping on the pane's padding — and the caret is the best guess.
        const at =
          view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos ??
          view.state.selection.from;
        for (const file of files) void uploadAt(view, file, at, messages);
        return true;
      },
    },
  });
}

export const ImageUpload = Extension.create<{ messages: ImageUploadMessages }>({
  name: "imageUpload",
  addOptions() {
    return {
      messages: {
        uploading: "Uploading…",
        failed: "Upload failed",
        timedOut: "Upload timed out",
      },
    };
  },
  addProseMirrorPlugins() {
    return [imageUploadPlugin(this.options.messages)];
  },
});

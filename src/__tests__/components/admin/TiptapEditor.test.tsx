// @vitest-environment happy-dom
//
// The client-only wrapper around the Tiptap editor. Three lines of component,
// but they are the thing keeping the editor chunk out of the Worker SSR bundle
// — Tiptap plus KaTeX is enough to push the build past Cloudflare's 3 MiB
// free-plan limit, and the failure mode is a deploy that stops working rather
// than a test that goes red. `mounted` gating is what enforces it, so the SSR
// pass is asserted here and not left to the comment above the component.

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { TiptapEditor } from "@/components/admin/TiptapEditor";

// The real impl pulls in the whole editor; the wrapper's job is only to decide
// WHEN it mounts and to pass its props straight through.
const impl = vi.hoisted(() => vi.fn());
vi.mock("@/components/admin/TiptapEditorImpl", () => ({
  default: (props: { value: string; onChange: (v: string) => void; showPreview: boolean }) => {
    impl(props);
    return <div data-testid="impl" data-preview={String(props.showPreview)} />;
  },
}));

const props = { value: "# hello", onChange: () => {}, showPreview: false };

afterEach(cleanup);

describe("TiptapEditor", () => {
  it("renders only a placeholder on the server", () => {
    // No `data-testid="impl"` in the SSR output means the lazy chunk was never
    // reached during the server render.
    const html = renderToString(<TiptapEditor {...props} />);

    expect(html).not.toContain('data-testid="impl"');
    expect(html).toContain('data-slot="skeleton"');
  });

  it("mounts the editor in the browser and forwards its props", async () => {
    render(<TiptapEditor {...props} showPreview />);

    expect(await screen.findByTestId("impl")).toBeTruthy();
    expect(impl).toHaveBeenCalledWith(
      expect.objectContaining({ value: "# hello", showPreview: true }),
    );
  });
});

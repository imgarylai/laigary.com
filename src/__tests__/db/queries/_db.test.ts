// @vitest-environment node

import { describe, it, expect, vi } from "vitest";
import { runBatch, type Db } from "@/db/queries/_db";

describe("runBatch", () => {
  it("does not touch the database when there is nothing to write", async () => {
    // The mutations build their write list conditionally, so a caller can end
    // up with an empty one. Drizzle's `batch` rejects an empty tuple outright,
    // hence the guard — this pins it so a future caller can rely on it.
    const batch = vi.fn();
    await runBatch({ batch } as unknown as Db, []);
    expect(batch).not.toHaveBeenCalled();
  });
});

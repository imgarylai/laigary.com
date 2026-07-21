import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { type ActionResult } from "./_shared";

// Settings are a free-form key/value map; updateSiteSettings upserts each entry.
export const settingsSchema = z.record(z.string(), z.string());
export type SettingsInput = z.infer<typeof settingsSchema>;

export async function updateSettingsImpl(values: SettingsInput): Promise<ActionResult> {
  // Dynamic import keeps the D1 query layer out of the client bundle (the
  // settings form imports this server function).
  const { updateSiteSettings } = await import("@/db/queries");
  await updateSiteSettings(values);
  return { ok: true };
}

export const updateSettingsFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => settingsSchema.parse(data))
  .handler(({ data }) => updateSettingsImpl(data));

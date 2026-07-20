import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { updateSiteSettings } from "@/db/queries";
import { type ActionResult } from "./_shared";

// Settings are a free-form key/value map; updateSiteSettings upserts each entry.
export const settingsSchema = z.record(z.string(), z.string());
export type SettingsInput = z.infer<typeof settingsSchema>;

export async function updateSettingsImpl(values: SettingsInput): Promise<ActionResult> {
  await updateSiteSettings(values);
  return { ok: true };
}

export const updateSettingsFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => settingsSchema.parse(data))
  .handler(({ data }) => updateSettingsImpl(data));

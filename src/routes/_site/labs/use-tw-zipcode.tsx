import { createFileRoute } from "@tanstack/react-router";
import { cities, districts, useTwZipCode } from "use-tw-zipcode";
import { labsChromeFn } from "@/server/public";
import { SITE_ORIGIN } from "@/lib/json-ld";
import { canonicalLink, ogMeta } from "@/lib/og-meta";
import { TmSelect } from "@/features/terminal";
import { LabCode, LabField, LabIntro, LabPage } from "@/features/labs";
import { LABS } from "@/lib/labs";

const lab = LABS.find((l) => l.slug === "use-tw-zipcode")!;

export const Route = createFileRoute("/_site/labs/use-tw-zipcode")({
  loader: () => labsChromeFn({ data: { title: lab.pkg } }),
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: loaderData.pageTitle },
          ...ogMeta({
            title: lab.pkg,
            siteName: loaderData.siteName,
            url: `${SITE_ORIGIN}/labs/${lab.slug}`,
            image: `${SITE_ORIGIN}/api/og`,
            type: "website",
            description: lab.tagline,
          }),
        ]
      : [],
    links: canonicalLink(`${SITE_ORIGIN}/labs/${lab.slug}`),
  }),
  component: Page,
});

function Page() {
  return (
    <LabPage lab={lab}>
      <LabIntro>
        <p>
          台灣的郵遞區號是縣市加鄉鎮市區決定的，所以沒必要叫使用者自己填 ——
          讓他選完地址，號碼自己出來就好。這個 hook 只管資料與連動邏輯，不帶任何 UI 或 CSS。
        </p>
        <p>
          換縣市時區會自動重設成該縣市的第一個區，郵遞區號跟著更新。下面兩個是原生的{" "}
          <code>{"<select>"}</code>，跟 README 的範例一樣。
        </p>
      </LabIntro>
      <Playground />
    </LabPage>
  );
}

function Playground() {
  const { city, district, zipCode, handleCityChange, handleDistrictChange } = useTwZipCode();

  // The hook seeds itself with the first city, so `districts[city]` is always
  // populated — the fallback is for the frame before hydration settles rather
  // than a real empty case.
  const districtOptions = districts[city] ?? [];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
        <LabField label="縣市">
          <TmSelect
            aria-label="縣市"
            value={city}
            onChange={(e) => void handleCityChange(e.target.value)}
          >
            {cities.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </TmSelect>
        </LabField>

        <LabField label="鄉鎮市區">
          <TmSelect
            aria-label="鄉鎮市區"
            value={district}
            onChange={(e) => void handleDistrictChange(e.target.value)}
          >
            {districtOptions.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </TmSelect>
        </LabField>

        <LabField label="郵遞區號">
          <div className="flex h-9 items-center border border-tm-accent px-4 text-lg text-tm-accent tabular-nums">
            {zipCode || "—"}
          </div>
        </LabField>
      </div>

      <LabCode
        code={`import { useTwZipCode, cities, districts } from "use-tw-zipcode";

const { city, district, zipCode, handleCityChange, handleDistrictChange } =
  useTwZipCode();

// city     → ${JSON.stringify(city)}
// district → ${JSON.stringify(district)}
// zipCode  → ${JSON.stringify(zipCode)}`}
      />
    </>
  );
}

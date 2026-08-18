import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useCountryList } from "use-country-list-zh";
import { labsChromeFn } from "@/server/public";
import { SITE_ORIGIN } from "@/lib/json-ld";
import { canonicalLink, ogMeta } from "@/lib/og-meta";
import { TmButton, TmEmpty, TmInput } from "@/features/terminal";
import { LabCode, LabField, LabIntro, LabOptions, LabPage } from "@/features/labs";
import { LABS } from "@/lib/labs";

const lab = LABS.find((l) => l.slug === "use-country-list-zh")!;

const SORTS = [
  { value: "zh", label: "筆畫" },
  { value: "en", label: "英文字母" },
  { value: "zhuyin", label: "注音" },
] as const;

type SortBy = (typeof SORTS)[number]["value"];

const TOP_LIST = ["TW", "US", "JP"];

// The hook returns all 244 countries when the query is empty, and every one of
// them would be server-rendered into the document (~175 KB of markup) for a box
// that shows eight rows at a time. Cap what is painted and say so — narrowing by
// typing is the feature being demoed anyway.
const RENDER_LIMIT = 40;

export const Route = createFileRoute("/_site/labs/use-country-list-zh")({
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
          中文的國家選單有個老問題：使用者的鍵盤是英文的。要選「美國」得先切輸入法，
          或是在兩百多個選項裡捲。
        </p>
        <p>
          這個 hook 讓中文清單吃英文查詢 —— 打 <code>united</code> 會同時命中美國與英國，打{" "}
          <code>jp</code>、<code>日</code>、<code>Japan</code> 都能找到日本。244 個國家，headless，
          UI 你自己畫。
        </p>
      </LabIntro>
      <Playground />
    </LabPage>
  );
}

function Playground() {
  const [sortBy, setSortBy] = useState<SortBy>("zh");
  const [showFlag, setShowFlag] = useState(true);
  const [pinTop, setPinTop] = useState(true);

  const { countries, query, setQuery, selectedCountry, setSelectedCountry, getDisplayText } =
    useCountryList({ sortBy, showFlag, topList: pinTop ? TOP_LIST : [] });

  return (
    <>
      <LabField label="搜尋（中文、英文、國碼都可以）">
        <TmInput
          sigil="/"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          placeholder="united"
          aria-label="搜尋國家"
        />
      </LabField>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <LabField label="sortBy">
          <LabOptions>
            {SORTS.map((s) => (
              <TmButton
                key={s.value}
                active={sortBy === s.value}
                onClick={() => setSortBy(s.value)}
              >
                {s.label}
              </TmButton>
            ))}
          </LabOptions>
        </LabField>

        <LabField label="其他選項">
          <LabOptions>
            <TmButton active={showFlag} onClick={() => setShowFlag((v) => !v)}>
              showFlag
            </TmButton>
            <TmButton active={pinTop} onClick={() => setPinTop((v) => !v)}>
              topList
            </TmButton>
          </LabOptions>
        </LabField>
      </div>

      <div className="mt-6">
        <div className="mb-1.5 flex items-baseline justify-between text-xs text-tm-dim select-none">
          <span>
            {countries.length > RENDER_LIMIT
              ? `// ${countries.length} 個結果（顯示前 ${RENDER_LIMIT} 個，繼續打字縮小範圍）`
              : `// ${countries.length} 個結果`}
          </span>
          {selectedCountry ? (
            <span className="text-tm-accent">
              已選擇 {getDisplayText(selectedCountry)} ({selectedCountry.code})
            </span>
          ) : null}
        </div>

        {countries.length === 0 ? (
          <TmEmpty>{"// 沒有符合的國家。"}</TmEmpty>
        ) : (
          // Capped height rather than paging: the list is a scrolling picker in
          // real use, and showing 244 rows would bury the options above it.
          <div className="max-h-72 overflow-y-auto border border-tm-border">
            {countries.slice(0, RENDER_LIMIT).map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => setSelectedCountry(c)}
                aria-pressed={selectedCountry?.code === c.code}
                className="grid w-full grid-cols-[1fr_auto_2.5rem] items-baseline gap-3 px-3 py-1 text-left text-sm text-tm-fg hover:bg-tm-subtle aria-pressed:bg-tm-selected"
              >
                <span>
                  {c.isTop ? <span className="text-tm-accent">★ </span> : null}
                  {getDisplayText(c)}
                </span>
                <span className="text-xs text-tm-muted">{c.nameEn}</span>
                <span className="text-xs text-tm-dim">{c.code}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <LabCode
        code={`import { useCountryList } from "use-country-list-zh";

const { countries, query, setQuery, selectedCountry, setSelectedCountry, getDisplayText } =
  useCountryList({
    sortBy: ${JSON.stringify(sortBy)},
    showFlag: ${showFlag},
    topList: ${JSON.stringify(pinTop ? TOP_LIST : [])},
  });

// query = ${JSON.stringify(query)} → ${countries.length} 個結果`}
      />
    </>
  );
}

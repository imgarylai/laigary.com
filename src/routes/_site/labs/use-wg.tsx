import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toWadeGiles } from "use-wg";
import { labsChromeFn } from "@/server/public";
import { SITE_ORIGIN } from "@/lib/json-ld";
import { canonicalLink, ogMeta } from "@/lib/og-meta";
import { TmButton, TmInput } from "@/features/terminal";
import { LabCode, LabField, LabIntro, LabOptions, LabPage } from "@/features/labs";
import { LABS } from "@/lib/labs";

const lab = LABS.find((l) => l.slug === "use-wg")!;

const TONES = [
  { value: "superscript", label: "上標 t'ai²" },
  { value: "number", label: "數字 tai2" },
  { value: "none", label: "不標" },
] as const;

type ToneFormat = (typeof TONES)[number]["value"];

const SAMPLES = ["台灣", "高雄", "銀行", "Hello 世界!"];

export const Route = createFileRoute("/_site/labs/use-wg")({
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
          威妥瑪拼音是台灣護照、地名、老招牌上的那套羅馬拼音 —— 高雄是 Kaohsiung 不是 Gaoxiong。
          規則在 1859 年就定了，但幾乎沒有現成的程式庫做這件事。
        </p>
        <p>
          打開 <code>urlSafe</code> 會得到純 ASCII、沒有聲調的輸出，可以直接當網址。 這個站的文章
          slug 就是這樣產生的。
        </p>
        <p>
          要把中文姓名轉成護照用的拼法，用{" "}
          <Link to="/tools/wade-giles-name" className="text-tm-accent no-underline hover:underline">
            中文姓名轉威妥瑪拼音
          </Link>
          ，那頁多處理了姓名斷詞與破音姓氏，並且跟漢語拼音並排比對。
        </p>
      </LabIntro>
      <Playground />
    </LabPage>
  );
}

function Playground() {
  const [text, setText] = useState("台灣");
  const [toneFormat, setToneFormat] = useState<ToneFormat>("superscript");
  const [urlSafe, setUrlSafe] = useState(false);
  const [capitalize, setCapitalize] = useState(false);
  const [allPolyphones, setAllPolyphones] = useState(false);

  const polyphoneMode = allPolyphones ? "all" : "auto";

  // `toWadeGiles` walks a dictionary per character, so it is memoised rather
  // than re-run on every render. The options object is built inside the memo to
  // keep the dep list honest.
  const result = useMemo(
    () => toWadeGiles(text, { toneFormat, urlSafe, capitalize, polyphoneMode }),
    [text, toneFormat, urlSafe, capitalize, polyphoneMode],
  );

  return (
    <>
      <LabField label="輸入中文">
        <TmInput
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          placeholder="台灣"
          aria-label="要轉換的中文字"
        />
      </LabField>

      <LabOptions>
        {SAMPLES.map((s) => (
          <TmButton key={s} active={s === text} onClick={() => setText(s)}>
            {s}
          </TmButton>
        ))}
      </LabOptions>

      <div className="mt-6 border border-tm-accent px-4 py-3 text-xl break-words text-tm-accent">
        {result.text || <span className="text-tm-dim">—</span>}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <LabField label="toneFormat">
          <LabOptions>
            {TONES.map((tone) => (
              <TmButton
                key={tone.value}
                active={toneFormat === tone.value}
                // urlSafe forces ASCII output, so the tone choice has no
                // visible effect while it is on — disabling says that rather
                // than letting the buttons look broken.
                disabled={urlSafe}
                onClick={() => setToneFormat(tone.value)}
              >
                {tone.label}
              </TmButton>
            ))}
          </LabOptions>
        </LabField>

        <LabField label="其他選項">
          <LabOptions>
            <TmButton active={urlSafe} onClick={() => setUrlSafe((v) => !v)}>
              urlSafe
            </TmButton>
            <TmButton active={capitalize} onClick={() => setCapitalize((v) => !v)}>
              capitalize
            </TmButton>
            <TmButton active={allPolyphones} onClick={() => setAllPolyphones((v) => !v)}>
              polyphoneMode: all
            </TmButton>
          </LabOptions>
        </LabField>
      </div>

      <div className="mt-6">
        <div className="mb-1.5 text-xs text-tm-dim select-none">{"// result.segments"}</div>
        <div className="border border-tm-border">
          {result.segments.map((seg, i) => (
            <div
              // Segments have no stable id and the same character can repeat, so
              // the index is the key — the list is fully rebuilt every keystroke
              // anyway.
              key={i}
              className="grid grid-cols-[2.5rem_5rem_1fr_auto] items-baseline gap-3 px-3 py-1 text-sm"
            >
              <span className="text-tm-fg">{seg.original.trim() || "␣"}</span>
              <span className="text-tm-muted">{seg.pinyin || "—"}</span>
              <span className="text-tm-accent">{seg.wadeGiles}</span>
              <span className="text-xs text-tm-dim">
                {seg.alternatives
                  ? seg.alternatives.join(" / ")
                  : seg.tone
                    ? `聲調 ${seg.tone}`
                    : ""}
              </span>
            </div>
          ))}
        </div>
      </div>

      <LabCode
        code={`import { toWadeGiles } from "use-wg";

toWadeGiles(${JSON.stringify(text)}, {
  toneFormat: ${JSON.stringify(toneFormat)},
  urlSafe: ${urlSafe},
  capitalize: ${capitalize},
  polyphoneMode: ${JSON.stringify(polyphoneMode)},
}).text;
// → ${JSON.stringify(result.text)}`}
      />
    </>
  );
}

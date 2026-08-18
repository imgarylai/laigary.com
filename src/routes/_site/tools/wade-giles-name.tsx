import { useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { labsChromeFn } from "@/server/public";
import { SITE_ORIGIN, serializeJsonLd, toolPageLd } from "@/lib/json-ld";
import { canonicalLink, ogMeta } from "@/lib/og-meta";
import { AsciiRule, PromptLine, TmButton, TmInput, TmPage } from "@/features/terminal";
import { FS_BLOG } from "@/lib/fsmap";
import { romanizeName, surnameLength } from "@/lib/name-romanization";

const DEFAULT_NAME = "王小明";

const SLUG = "wade-giles-name";
const URL = `${SITE_ORIGIN}/tools/${SLUG}`;
const TITLE = "中文姓名轉威妥瑪拼音";
const DESCRIPTION =
  "輸入中文姓名，同時得到威妥瑪拼音與漢語拼音的護照格式拼法，並排比對。護照外文姓名要跟家人一致時最需要的那個對照。";

// A tool page, not a lab: /labs/use-wg demos the package, this answers the
// question someone actually searched for. Separate URL, separate title, its own
// prose — a page titled "use-wg" was never going to be found by anyone typing
// 護照英文名字.
// The whole state lives in the URL so a refresh keeps it and a link carries
// it — the point of the page is standing at a counter with a form in front of
// you, or sending a relative the exact spelling you meant.
//
// `py` and `s` are only written once the reader overrides something, so the
// ordinary URL stays `?name=王小明` and the canonical (which is the bare path)
// has nothing competing with it.
const searchSchema = z.object({
  name: z.string().max(20).optional(),
  /** Chosen readings, `yue4-da4-wei2`. Ignored unless it matches the name. */
  py: z.string().max(120).optional(),
  /** Surname length, when the compound-surname lookup got it wrong. */
  s: z.coerce.number().int().min(1).max(4).optional(),
});

export const Route = createFileRoute("/_site/tools/wade-giles-name")({
  validateSearch: searchSchema,
  loader: () => labsChromeFn({ data: { title: TITLE } }),
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: loaderData.pageTitle },
          ...ogMeta({
            title: TITLE,
            siteName: loaderData.siteName,
            url: URL,
            image: `${SITE_ORIGIN}/api/og`,
            type: "website",
            description: DESCRIPTION,
          }),
        ]
      : [],
    links: canonicalLink(URL),
    scripts: [
      {
        type: "application/ld+json",
        children: serializeJsonLd(toolPageLd({ url: URL, title: TITLE, description: DESCRIPTION })),
      },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <TmPage narrow>
      <PromptLine>{FS_BLOG.tool.prompt({ slug: SLUG })}</PromptLine>
      <h1 className="mt-5 mb-2.5 text-2xl leading-snug font-bold">{TITLE}</h1>
      <p className="mb-6 text-sm leading-relaxed text-tm-muted">{DESCRIPTION}</p>
      <AsciiRule className="mb-6" />

      <Converter />

      <AsciiRule className="mt-10 mb-6" />
      <Explainer />
    </TmPage>
  );
}

function Converter() {
  const { name = DEFAULT_NAME, py, s } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  // `replace` throughout: typing a name is one edit, not a trail of history
  // entries to back out of one keystroke at a time.
  const update = (next: { name?: string; py?: string; s?: number }) =>
    void navigate({ search: (prev) => ({ ...prev, ...next }), replace: true });

  const readings = useMemo(() => (py ? py.split("-") : undefined), [py]);
  const result = useMemo(() => romanizeName(name, { splitAt: s, readings }), [name, s, readings]);

  const trimmed = name.replace(/\s+/g, "");
  const characters = [...trimmed];
  const autoSplit = trimmed ? surnameLength(trimmed) : 1;
  const split = s ?? autoSplit;

  // Only characters whose readings actually spell differently are worth asking
  // about — 王 is WANG either way. The index rides along because a name can
  // repeat a character (娜娜), so the character itself is not an identity.
  const choices =
    result?.chars.map((c, i) => ({ ...c, index: i })).filter((c) => c.options.length > 1) ?? [];

  return (
    <>
      <div className="mb-1.5 text-xs text-tm-dim select-none">{"// 中文姓名"}</div>
      <TmInput
        sigil="姓名"
        value={name}
        onChange={(e) =>
          // A new name invalidates both overrides: a split and a reading list
          // chosen for the old one would mangle this one.
          update({ name: e.target.value, py: undefined, s: undefined })
        }
        spellCheck={false}
        autoComplete="off"
        placeholder={DEFAULT_NAME}
        aria-label="中文姓名"
      />

      {characters.length > 1 && (
        <div className="mt-3 flex flex-wrap items-baseline gap-2">
          <span className="text-xs text-tm-dim select-none">{"// 姓氏字數"}</span>
          {[1, 2].map((n) => (
            <TmButton
              key={n}
              active={split === n}
              disabled={n >= characters.length}
              onClick={() => update({ s: n === autoSplit ? undefined : n, py: undefined })}
            >
              {n} 字{n === autoSplit ? "（自動）" : ""}
            </TmButton>
          ))}
        </div>
      )}

      {result && (
        <>
          {choices.length > 0 && (
            <div className="mt-5 space-y-3">
              <div className="text-xs text-tm-dim select-none">
                {"// 破音字 —— 選你名字實際的讀音"}
              </div>
              {choices.map((c) => (
                <div key={c.index} className="flex flex-wrap items-center gap-2">
                  <span className="w-6 shrink-0 text-base text-tm-fg">{c.char}</span>
                  {c.options.map((option) => (
                    <TmButton
                      key={option.pinyin}
                      active={option.pinyin === c.chosen.pinyin}
                      onClick={() =>
                        update({
                          py: result.chars
                            .map((other, i) =>
                              i === c.index ? option.pinyin : other.chosen.pinyin,
                            )
                            .join("-"),
                        })
                      }
                    >
                      {option.zhuyin}
                      <span className="text-tm-dim">
                        {option.wadeGiles.replace(/'/g, "").toUpperCase()}
                      </span>
                    </TmButton>
                  ))}
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 grid grid-cols-[3.5rem_1fr_1fr] gap-x-4 gap-y-2 text-sm">
            <span />
            <span className="text-tm-accent">威妥瑪拼音</span>
            <span className="text-tm-muted">漢語拼音</span>

            <span className="text-tm-dim">姓</span>
            <span className="text-base text-tm-fg">{result.wadeGiles.surname}</span>
            <span className="text-base text-tm-muted">{result.hanyuPinyin.surname}</span>

            {result.givenNameChars && (
              <>
                <span className="text-tm-dim">名</span>
                <span className="text-base text-tm-fg">{result.wadeGiles.givenName}</span>
                <span className="text-base text-tm-muted">{result.hanyuPinyin.givenName}</span>
              </>
            )}
          </div>

          <div className="mt-4 border border-tm-accent px-4 py-3">
            <div className="mb-1 text-xs text-tm-dim select-none">{"// 護照填寫格式"}</div>
            <div className="text-lg break-words text-tm-accent">{result.wadeGiles.passport}</div>
          </div>

          {result.hasUmlaut && (
            <p className="mt-3 text-xs leading-relaxed text-tm-warn">
              這個姓名含有 ü 的音（呂、女、綠⋯⋯）。護照只印 ASCII，漢語拼音欄寫成 YU（呂 →
              LYU），威妥瑪則是單純的 U（呂 → LU）。這一項送件前請跟外交部確認。
            </p>
          )}

          <p className="mt-4 text-xs text-tm-dim">
            這一頁的網址帶著你輸入的姓名與讀音，重新整理不會不見，也可以直接分享。
          </p>
        </>
      )}
    </>
  );
}

// The prose is not filler around the tool — it is the half that answers the
// question people arrive with (which system, and why my family's spelling
// differs from what the form suggests). The tool is why they stay.
function Explainer() {
  return (
    <div className="space-y-6 text-sm leading-relaxed text-tm-muted">
      <section>
        <h2 className="mb-2 text-base text-tm-fg">護照外文姓名可以用哪幾種拼音？</h2>
        <p>
          外交部領事事務局接受五種：<strong className="text-tm-fg">漢語拼音</strong>、
          <strong className="text-tm-fg">威妥瑪（Wade-Giles）拼音</strong>、通用拼音、國音第二式、
          耶魯拼音。2009 年起申請表預設的是漢語拼音，但五種都合法，你可以指定要用哪一種。
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-base text-tm-fg">那為什麼台灣的護照上大多是威妥瑪？</h2>
        <p>
          因為存量。2002
          年以前發的護照全部是威妥瑪，換發時可以沿用原本的拼法，所以那批拼寫一直留著。
          結果是姓氏幾乎全面威妥瑪 —— 陳是 CHEN、蔡是 TSAI、許和徐都是 HSU、謝是 HSIEH、張是 CHANG。
          換成漢語拼音會變成 CAI、XU、XIE、ZHANG，那在台灣護照上幾乎看不到。
        </p>
        <p className="mt-2">
          地名也一樣：Taipei、Kaohsiung、Keelung、Hsinchu、Taitung、Kinmen
          全都不是漢語拼音。名字的部分倒是在鬆動，沒有家族前例的新申請人多半直接用預設的漢語拼音。
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-base text-tm-fg">什麼時候應該選威妥瑪？</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>家裡已經有人的護照是威妥瑪，你要跟他一致 —— 這是最常見的原因</li>
          <li>換發舊護照，想沿用原本的拼法</li>
          <li>學歷證件、既有的英文簽名、發表過的論文已經用了某個拼法</li>
        </ul>
        <p className="mt-2">
          同一戶籍內兄弟姊妹的外文姓氏應該一致，所以先去看家人護照上的姓怎麼拼，再回來對照 ——
          上面兩欄並排就是為了這件事。
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-base text-tm-fg">這頁的拼法怎麼來的</h2>
        <p>
          威妥瑪的轉換用的是{" "}
          <Link to="/labs/use-wg" className="text-tm-accent no-underline hover:underline">
            use-wg
          </Link>
          ，我寫的開源套件，也是 npm 上唯一做威妥瑪的。破音姓氏（解讀 ㄒㄧㄝˋ 不是 ㄐㄧㄝˇ、曾讀
          ㄗㄥ 不是 ㄘㄥˊ）另外走姓氏字典處理。
        </p>
        <p className="mt-2">
          <strong className="text-tm-fg">這是參考工具，不是官方系統。</strong>
          罕見的破音姓氏可能判斷錯，遇到就用上面的「姓氏字數」自己調。送件前請以外交部領事事務局的
          中文姓名英譯系統為準。
        </p>
      </section>
    </div>
  );
}

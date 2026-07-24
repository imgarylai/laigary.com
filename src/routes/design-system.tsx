import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useTheme } from "next-themes";
import {
  ListIcon,
  MagnifyingGlassIcon,
  MonitorIcon,
  MoonIcon,
  SunIcon,
  TranslateIcon,
  XIcon,
} from "@phosphor-icons/react";
import { AsciiRule, Kbd, PromptLine, TmButton } from "@/features/terminal";

// Living design-system reference. Standalone (not under the blog shell, not in
// any nav) and directly visitable at /design-system. noindex keeps it unlisted.
// Built with the same tokens/components it documents, so it stays in sync.
export const Route = createFileRoute("/design-system")({
  head: () => ({
    meta: [{ title: "Design Language" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: DesignSystem,
});

// The `--tm-*` palette (mirrors src/styles/terminal.css). Documented for both
// themes at once, so the hexes are literal rather than theme-reactive.
const TOKENS: [name: string, role: string][] = [
  ["--tm-bg", "背景 / page background"],
  ["--tm-fg", "主要文字 / primary text"],
  ["--tm-accent", "強調色 / links, active"],
  ["--tm-muted", "次要文字 / secondary, $ prompt"],
  ["--tm-dim", "第三層文字 / tertiary"],
  ["--tm-subtle", "卡片 / input 底色"],
  ["--tm-soft", "code block 底色"],
  ["--tm-border", "邊框 / rules"],
  ["--tm-warn", "警告 / WIP status"],
];
const DARK: Record<string, string> = {
  "--tm-bg": "#0b0d0c",
  "--tm-fg": "#d4d4d4",
  "--tm-accent": "#7ee787",
  "--tm-muted": "#6b7280",
  "--tm-dim": "#9ca3af",
  "--tm-subtle": "#111312",
  "--tm-soft": "#161917",
  "--tm-border": "#1f2422",
  "--tm-warn": "#f0883e",
};
const LIGHT: Record<string, string> = {
  "--tm-bg": "#fafaf7",
  "--tm-fg": "#1a1a1a",
  "--tm-accent": "#1f6feb",
  "--tm-muted": "#6b6b6b",
  "--tm-dim": "#444444",
  "--tm-subtle": "#f0f0eb",
  "--tm-soft": "#f5f5f0",
  "--tm-border": "#d4d4d0",
  "--tm-warn": "#b45309",
};

const PRINCIPLES: [string, string][] = [
  [
    "01 · flat, always",
    "沒有陰影、沒有 glassmorphism、沒有 elevation。深度用邊框與間距，不用光影。",
  ],
  ["02 · one typeface", "全站只有 JetBrains Mono。等寬字是版面的骨架，不是裝飾。"],
  ["03 · terminal is the metaphor", "路徑、$ 提示行、cd / ls / cat 導航是導覽語言，不是花招。"],
  ["04 · ASCII over chrome", "用 ─ 分隔線與 ## 標題前綴，不用彩色橫幅或粗重卡片。"],
  ["05 · restraint", "一個強調色。兩套主題。沒有多餘的圖示、統計。少即是多。"],
  ["06 · quietly bilingual", "正式站用 i18n，一次一種語言（zh-TW / en），server 端決定 locale。"],
];

const TYPE_SCALE: [px: string, label: string, size: number, weight: number, muted?: boolean][] = [
  ["22", "標題 h1 title", 22, 700],
  ["18", "section h1", 18, 600],
  ["15", "## h2 heading", 15, 600],
  ["13.5", "body / 內文", 13.5, 400],
  ["12.5", "secondary 次要文字", 12.5, 400, true],
  ["11", "$ prompt / meta", 11, 400, true],
  ["10.5", "micro / tags", 10.5, 400, true],
];

const SPACES = [4, 6, 8, 12, 16, 20, 24, 32, 40, 64, 80];

const DO = [
  "用邊框與間距分層",
  "從 fsmap 衍生所有 prompt / 路徑字串",
  "強調色只用在互動與 accent，不鋪滿",
  "ASCII 尺當分隔線",
  "layout 用 Tailwind utility、terminal 顏色用 tm-* token",
];
const DONT = [
  "加 box-shadow / 漸層 / 圓角卡片描邊",
  "混入第二種字體或 emoji",
  "硬寫路徑字串或 inline hex",
  "用 <hr> 取代 ASCII 尺",
  "一個畫面塞超過一種強調色",
];

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="mt-11">
      <h2 className="mb-1 text-lg font-semibold">
        <span className="mr-2.5 text-tm-accent">##</span>
        {title}
      </h2>
      {note && <p className="mb-4 max-w-2xl text-sm text-tm-muted">{note}</p>}
      {children}
    </section>
  );
}

function Card({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="border border-dashed border-tm-border px-4 py-3.5">
      {label && <p className="mb-2.5 text-xs text-tm-muted">{label}</p>}
      {children}
    </div>
  );
}

function Swatch({ token, hex, onLight }: { token: string; hex: string; onLight: boolean }) {
  return (
    <div
      className="border"
      style={{
        background: onLight ? "#fafaf7" : "#0b0d0c",
        borderColor: token === "--tm-border" ? hex : onLight ? "#d4d4d0" : "#1f2422",
      }}
    >
      <div className="h-[52px]" style={{ background: hex }} />
      <div className="flex flex-col gap-px px-2.5 py-2 text-xs">
        <span style={{ color: onLight ? "#1a1a1a" : "#d4d4d4" }}>{token}</span>
        <span style={{ color: onLight ? "#6b6b6b" : "#6b7280" }}>{hex}</span>
      </div>
    </div>
  );
}

const THEME_ORDER = ["system", "light", "dark"] as const;
const THEME_ICON = { system: MonitorIcon, light: SunIcon, dark: MoonIcon };

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const mode = mounted ? ((theme ?? "system") as (typeof THEME_ORDER)[number]) : "system";
  const Icon = THEME_ICON[mode] ?? MonitorIcon;
  return (
    <TmButton
      type="button"
      size="icon"
      title={`theme: ${mode}`}
      onClick={() => setTheme(THEME_ORDER[(THEME_ORDER.indexOf(mode) + 1) % THEME_ORDER.length])}
    >
      <Icon size={15} />
    </TmButton>
  );
}

function DesignSystem() {
  return (
    <div className="tm-root">
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-tm-border bg-tm-bg px-3.5">
        <div className="flex items-center gap-3.5">
          <span className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-[#ff5f57]" />
            <span className="size-2.5 rounded-full bg-[#febc2e]" />
            <span className="size-2.5 rounded-full bg-[#28c840]" />
          </span>
          <span className="text-sm text-tm-accent">~/design-language.md</span>
          <span className="text-sm text-tm-dim">$</span>
        </div>
        <ThemeToggle />
      </header>

      <div className="mx-auto max-w-4xl px-8 pt-8 pb-24 max-sm:px-4">
        <PromptLine>$ cat ./design-language.md</PromptLine>
        <h1 className="mt-3.5 mb-1 text-2xl font-bold tracking-[-0.01em]">Design Language</h1>
        <p className="mb-1.5 text-sm text-tm-muted">
          Unconstrained 的視覺系統 — terminal /
          dev-forward，flat、monospace。設計與工程交接的單一參考。
        </p>
        <AsciiRule className="mt-2" />

        <Section title="Principles" note="六個不變的原則。任何新元件都要通得過。">
          <div className="grid grid-cols-2 gap-2.5 max-sm:grid-cols-1">
            {PRINCIPLES.map(([lab, body]) => (
              <Card key={lab} label={lab}>
                <span className="text-sm text-tm-muted">{body}</span>
              </Card>
            ))}
          </div>
        </Section>

        <Section title="Color — Dark (default)" note="預設主題。深墨綠黑底 + 終端機綠強調色。">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2.5">
            {TOKENS.map(([token]) => (
              <Swatch key={token} token={token} hex={DARK[token]} onLight={false} />
            ))}
          </div>
        </Section>

        <Section title="Color — Light" note="淺色主題。暖白紙底 + GitHub 藍強調色。">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2.5">
            {TOKENS.map(([token]) => (
              <Swatch key={token} token={token} hex={LIGHT[token]} onLight />
            ))}
          </div>
        </Section>

        <Section
          title="Typography"
          note="JetBrains Mono, ui-monospace, monospace。Base 13px / line-height 1.65。"
        >
          <div className="grid grid-cols-2 gap-2.5 max-sm:grid-cols-1">
            <Card label="type scale (px)">
              {TYPE_SCALE.map(([px, label, size, weight, muted], i) => (
                <div
                  key={px}
                  className="flex items-baseline gap-3.5 py-1.5"
                  style={{
                    borderBottom:
                      i < TYPE_SCALE.length - 1 ? "1px dashed var(--tm-border)" : undefined,
                  }}
                >
                  <span className="w-[62px] shrink-0 text-xs text-tm-dim">{px}</span>
                  <span
                    className={muted ? "text-tm-muted" : undefined}
                    style={{ fontSize: size, fontWeight: weight }}
                  >
                    {label}
                  </span>
                  <span className="ml-auto shrink-0 text-xs text-tm-muted">{weight}</span>
                </div>
              ))}
            </Card>
            <Card label="weights">
              <div className="flex flex-col gap-0.5">
                <div style={{ fontWeight: 400 }}>400 regular — body, prompts, meta</div>
                <div style={{ fontWeight: 500 }}>500 medium — occasional emphasis</div>
                <div style={{ fontWeight: 600 }}>600 semibold — headings, labels</div>
                <div style={{ fontWeight: 700 }}>700 bold — page titles only</div>
              </div>
              <p className="mt-4 mb-2.5 text-xs text-tm-muted">italic</p>
              <div className="text-tm-dim italic">// 英文副標與註解用斜體 · asides in italic</div>
            </Card>
          </div>
        </Section>

        <Section
          title="Spacing"
          note="無嚴格 scale，但這些值反覆出現。頁面 padding：桌面 32px、行動版 16px。"
        >
          <Card>
            {SPACES.map((v) => (
              <div key={v} className="flex items-center gap-3 py-1">
                <span className="w-[46px] shrink-0 text-xs text-tm-dim">{v}px</span>
                <span className="h-3 bg-tm-accent opacity-50" style={{ width: v }} />
              </div>
            ))}
          </Card>
        </Section>

        <Section
          title="Rules & borders"
          note="兩種邊框、兩種 ASCII 尺。分隔線是設計語言的一部分 — 不要換成 <hr>。"
        >
          <div className="grid grid-cols-2 gap-2.5 max-sm:grid-cols-1">
            <Card label="borders">
              <div className="mb-2.5 border border-tm-border px-2.5 py-2 text-sm">
                1px solid var(--tm-border) — 主容器 / 卡片 / 輸入框
              </div>
              <div className="border border-dashed border-tm-border px-2.5 py-2 text-sm">
                1px dashed var(--tm-border) — 列表列分隔 / 次要區塊
              </div>
            </Card>
            <Card label="ascii rules">
              <AsciiRule className="mb-2" />
              <AsciiRule thick />
            </Card>
          </div>
        </Section>

        <Section title="Components" note="站上重複出現的模式。全部用同一套 token 與間距。">
          <p className="mt-4 mb-2 text-xs text-tm-muted">buttons & icon buttons</p>
          <Card>
            <div className="flex flex-wrap items-center gap-2">
              <TmButton size="icon">
                <MagnifyingGlassIcon size={15} />
              </TmButton>
              <TmButton size="icon">
                <SunIcon size={15} />
              </TmButton>
              <TmButton size="icon">
                <ListIcon size={15} />
              </TmButton>
              <TmButton size="icon">
                <XIcon size={15} />
              </TmButton>
              <TmButton size="sm">
                <TranslateIcon size={15} /> en
              </TmButton>
              <span className="h-4 w-px bg-tm-border" />
              <TmButton size="sm">
                <MagnifyingGlassIcon size={15} /> <Kbd className="text-tm-dim">⌘K</Kbd>
              </TmButton>
            </div>
          </Card>

          <p className="mt-5 mb-2 text-xs text-tm-muted">tags</p>
          <Card>
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1.5 text-xs text-tm-muted">--tags</span>
              {["#生活", "#隨筆", "#讀書筆記", "#工具"].map((tag) => (
                <span key={tag} className="text-xs text-tm-accent">
                  {tag}
                </span>
              ))}
            </div>
          </Card>

          <p className="mt-5 mb-2 text-xs text-tm-muted">post row (archive / listing)</p>
          <div className="border border-dashed border-tm-border px-2 py-0.5">
            {[
              ["04-18", "關於安靜的早晨", "6m"],
              ["04-09", "讀《快思慢想》— 我們以為的理性", "11m"],
            ].map(([d, title, r]) => (
              <div
                key={title}
                className="grid grid-cols-[60px_1fr_48px] items-baseline gap-3 border-b border-dashed border-tm-border py-2 text-sm last:border-0"
              >
                <span className="text-tm-muted">{d}</span>
                <span>{title}</span>
                <span className="text-right text-xs text-tm-dim">{r}</span>
              </div>
            ))}
          </div>

          <p className="mt-5 mb-2 text-xs text-tm-muted">code block</p>
          <div className="border border-tm-border bg-tm-subtle">
            <div className="flex items-center justify-between border-b border-tm-border px-2.5 py-1.5 text-xs text-tm-muted">
              <span>$ cat snippet.ts</span>
            </div>
            <pre className="m-0 overflow-auto px-3.5 py-3 text-sm leading-[1.6] text-tm-fg">
              {`const add = (a, b) => a + b;\n// availability heuristic in production\nif (incident.type === "oom") team.assume("memory leak");`}
            </pre>
          </div>

          <p className="mt-5 mb-2 text-xs text-tm-muted">command palette (⌘K)</p>
          <div className="max-w-lg border border-tm-border bg-tm-bg">
            <div className="flex items-center gap-2 border-b border-tm-border px-3.5 py-2.5">
              <MagnifyingGlassIcon size={14} className="text-tm-accent" />
              <span className="text-sm text-tm-muted">search posts, tags, pages…</span>
            </div>
            {[
              ["cd ~", "home"],
              ["cd ./posts", "all posts"],
              ["cat ./posts/on-quiet-mornings.md", "關於安靜的早晨"],
            ].map(([label, hint], i, arr) => (
              <div
                key={label}
                className="border-b border-dashed border-tm-border px-3.5 py-2.5 text-sm text-tm-fg last:border-0"
                style={{ borderBottom: i === arr.length - 1 ? "0" : undefined }}
              >
                {label} <span className="ml-2 text-tm-dim">— {hint}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Iconography"
          note="互動 icon 用 Phosphor（Icon 後綴 API）；terminal glyph（$ # → ← ⌘K）保留字符。macOS traffic-light dots 是唯一的彩色點綴。"
        >
          <Card>
            <div className="flex flex-wrap gap-4 text-tm-fg">
              {[
                [<MagnifyingGlassIcon key="s" size={18} />, "search"],
                [<SunIcon key="su" size={18} />, "light"],
                [<MoonIcon key="m" size={18} />, "dark"],
                [<MonitorIcon key="mo" size={18} />, "system"],
                [<ListIcon key="l" size={18} />, "menu"],
                [<XIcon key="x" size={18} />, "close"],
                [<TranslateIcon key="t" size={18} />, "locale"],
              ].map(([icon, label]) => (
                <span key={label as string} className="flex flex-col items-center gap-1.5">
                  {icon}
                  <small className="text-xs text-tm-dim">{label as string}</small>
                </span>
              ))}
              {[
                ["$", "prompt"],
                ["#", "tag / heading"],
                ["→", "nav / more"],
                ["←", "back"],
                ["⌘K", "palette"],
              ].map(([glyph, label]) => (
                <span key={label} className="flex flex-col items-center gap-1.5 text-xl">
                  {glyph}
                  <small className="text-xs text-tm-dim">{label}</small>
                </span>
              ))}
            </div>
          </Card>
        </Section>

        <Section title="Do / Don't">
          <div className="grid grid-cols-2 gap-2.5 max-sm:grid-cols-1">
            <div className="border border-tm-border px-3.5 py-3">
              <p className="mb-2 text-xs text-tm-accent">✓ do</p>
              <ul className="m-0 list-disc pl-4">
                {DO.map((x) => (
                  <li key={x} className="mb-1.5 text-sm text-tm-muted">
                    {x}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border border-tm-border px-3.5 py-3">
              <p className="mb-2 text-xs text-tm-warn">✕ don't</p>
              <ul className="m-0 list-disc pl-4">
                {DONT.map((x) => (
                  <li key={x} className="mb-1.5 text-sm text-tm-muted">
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        <div className="mt-14 border-t border-tm-border pt-4 text-xs leading-[1.9] text-tm-muted">
          <AsciiRule thick className="mb-2.5" />
          這頁本身就照著它描述的系統做。
          <span className="text-tm-dim italic">
            {" "}
            This page is built with the system it documents.
          </span>
        </div>
      </div>
    </div>
  );
}

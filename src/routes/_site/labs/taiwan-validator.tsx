import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  parseNationalId,
  parseResidentCertificate,
  validateBusinessNumber,
  validateCitizenCertificate,
  validateEInvoiceDonationCode,
  validateEInvoiceMobileBarcode,
  validateLandlinePhone,
  validateLicensePlate,
  validateMobilePhone,
  validateNHICard,
  validatePassport,
  validatePostalCode,
  validateUniformInvoice,
} from "taiwan-validator";
import { labsChromeFn } from "@/server/public";
import { SITE_ORIGIN } from "@/lib/json-ld";
import { canonicalLink, ogMeta } from "@/lib/og-meta";
import { TmButton, TmDirList, TmEmpty, TmInput } from "@/features/terminal";
import { LabCode, LabField, LabIntro, LabOptions, LabPage } from "@/features/labs";
import { LABS } from "@/lib/labs";

const lab = LABS.find((l) => l.slug === "taiwan-validator")!;

// Every check the package exposes, in one table. `call` is the source text for
// the snippet below the results, so the code shown is literally the function
// that produced the row — it cannot describe an API that no longer exists,
// because this file stops compiling first.
//
// ponytail: no validator-type picker. Running all of them on every keystroke is
// both less UI and a better demo — 13 pure regex/checksum calls on one short
// string is nothing, and seeing which ones a value satisfies is the answer
// people actually came for. Revisit if the package ever grows a slow check.
const CHECKS = [
  {
    label: "身分證字號",
    run: (v: string) => parseNationalId(v),
    call: (v: string) => `parseNationalId(${JSON.stringify(v)})`,
    detail: (r: ReturnType<typeof parseNationalId>) =>
      [r.gender === "male" ? "男" : r.gender === "female" ? "女" : null, r.region]
        .filter(Boolean)
        .join(" · "),
  },
  {
    label: "居留證號碼",
    run: (v: string) => parseResidentCertificate(v),
    call: (v: string) => `parseResidentCertificate(${JSON.stringify(v)})`,
    detail: (r: ReturnType<typeof parseResidentCertificate>) =>
      [
        r.format === "new" ? "新式" : r.format === "old" ? "舊式" : null,
        r.gender === "male" ? "男" : r.gender === "female" ? "女" : null,
        r.region,
      ]
        .filter(Boolean)
        .join(" · "),
  },
  {
    label: "統一編號",
    run: validateBusinessNumber,
    call: (v: string) => `validateBusinessNumber(${JSON.stringify(v)})`,
  },
  {
    label: "統一發票號碼",
    run: validateUniformInvoice,
    call: (v: string) => `validateUniformInvoice(${JSON.stringify(v)})`,
  },
  {
    label: "手機號碼",
    run: validateMobilePhone,
    call: (v: string) => `validateMobilePhone(${JSON.stringify(v)})`,
  },
  {
    label: "市話號碼",
    run: validateLandlinePhone,
    call: (v: string) => `validateLandlinePhone(${JSON.stringify(v)})`,
  },
  {
    label: "郵遞區號",
    run: validatePostalCode,
    call: (v: string) => `validatePostalCode(${JSON.stringify(v)})`,
  },
  {
    label: "車牌號碼",
    run: (v: string) => validateLicensePlate(v, { detectType: true }),
    call: (v: string) => `validateLicensePlate(${JSON.stringify(v)}, { detectType: true })`,
    detail: (r: ReturnType<typeof validateLicensePlate>) => r.plateType ?? "",
  },
  {
    label: "自然人憑證",
    run: validateCitizenCertificate,
    call: (v: string) => `validateCitizenCertificate(${JSON.stringify(v)})`,
  },
  {
    label: "健保卡號",
    run: validateNHICard,
    call: (v: string) => `validateNHICard(${JSON.stringify(v)})`,
  },
  {
    label: "護照號碼",
    run: validatePassport,
    call: (v: string) => `validatePassport(${JSON.stringify(v)})`,
  },
  {
    label: "手機條碼",
    run: validateEInvoiceMobileBarcode,
    call: (v: string) => `validateEInvoiceMobileBarcode(${JSON.stringify(v)})`,
  },
  {
    label: "愛心碼",
    run: validateEInvoiceDonationCode,
    call: (v: string) => `validateEInvoiceDonationCode(${JSON.stringify(v)})`,
  },
] as const;

const SAMPLES = [
  "A123456789",
  "A800000014",
  "22099131",
  "AB12345678",
  "0912345678",
  "AAA-0001",
  "/ABC+123",
];

export const Route = createFileRoute("/_site/labs/taiwan-validator")({
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
          台灣的每一種號碼都有自己的檢查碼規則 ——
          身分證的加權和、統編的乘積、發票的格式。這個套件把它們全部實作完，零相依、可 tree-shake。
        </p>
        <p>
          下面沒有「選擇類型」的欄位：輸入任何東西，十三種檢查會全部跑一次，通過的列出來。
          一個值可能同時是好幾種東西，這正是重點。
        </p>
      </LabIntro>
      <Playground />
    </LabPage>
  );
}

function Playground() {
  const [value, setValue] = useState("A123456789");

  const matches = useMemo(() => {
    const v = value.trim();
    if (!v) return [];
    return CHECKS.map((check) => {
      // The union of result shapes differs per check; `detail` is typed against
      // its own check's return type, so narrowing happens inside each entry.
      const result = check.run(v);
      if (!result.isValid) return null;
      const detail = "detail" in check ? check.detail(result as never) : "";
      return { label: check.label, detail, call: check.call(v) };
    }).filter((m) => m !== null);
  }, [value]);

  return (
    <>
      <LabField label="輸入任何台灣的號碼">
        <TmInput
          value={value}
          onChange={(e) => setValue(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          placeholder="A123456789"
          aria-label="輸入要驗證的號碼"
        />
      </LabField>

      <LabOptions>
        {SAMPLES.map((s) => (
          <TmButton key={s} active={s === value} onClick={() => setValue(s)}>
            {s}
          </TmButton>
        ))}
      </LabOptions>

      <div className="mt-6">
        <div className="mb-1.5 text-xs text-tm-dim select-none">{"// 通過的檢查"}</div>
        {matches.length === 0 ? (
          <TmEmpty>{"// 沒有任何一種格式通過。"}</TmEmpty>
        ) : (
          <TmDirList>
            {matches.map((m) => (
              <div key={m.label} className="col-span-full grid grid-cols-subgrid py-1">
                <span className="whitespace-nowrap text-tm-accent">✓ {m.label}</span>
                <span className="text-sm text-tm-fg max-sm:col-span-full">{m.detail}</span>
                <span />
              </div>
            ))}
          </TmDirList>
        )}
      </div>

      <LabCode
        code={`import { ${matches[0] ? matches[0].call.split("(")[0] : "validateNationalId"} } from "taiwan-validator";

${matches[0]?.call ?? `validateNationalId(${JSON.stringify(value)})`};
// → ${matches[0] ? "isValid: true" : "isValid: false"}`}
      />
    </>
  );
}

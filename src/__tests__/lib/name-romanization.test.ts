// The passport-name romanizer. Cases are real spellings wherever possible —
// 呂秀蓮 is Lu Hsiu-lien and 蔡英文 is Tsai, not TS'AI — because the value of
// this module is being right about a form someone submits to a government
// office, and a self-consistent wrong answer would look identical.
import { describe, it, expect } from "vitest";
import { romanizeName, surnameLength } from "@/lib/name-romanization";

function wg(name: string, splitAt?: number) {
  return romanizeName(name, splitAt)!.wadeGiles.passport;
}
function py(name: string, splitAt?: number) {
  return romanizeName(name, splitAt)!.hanyuPinyin.passport;
}

describe("romanizeName", () => {
  it("puts the surname first and hyphenates the given name", () => {
    expect(wg("王小明")).toBe("WANG, HSIAO-MING");
    expect(py("王小明")).toBe("WANG, XIAO-MING");
  });

  it("drops the Wade-Giles apostrophe, which no passport prints", () => {
    // 蔡英文 romanises as ts'ai; passports read TSAI.
    expect(wg("蔡英文")).toBe("TSAI, YING-WEN");
    expect(wg("陳美玲")).toBe("CHEN, MEI-LING");
  });

  it("shows the two systems disagreeing, which is the reason to compare them", () => {
    expect(wg("許志安")).toBe("HSU, CHIH-AN");
    expect(py("許志安")).toBe("XU, ZHI-AN");
  });

  it("keeps a compound surname together", () => {
    expect(wg("歐陽娜娜")).toBe("OU-YANG, NA-NA");
    expect(wg("司馬中原")).toBe("SSU-MA, CHUNG-YUAN");
  });

  it("reads a polyphone surname as the surname, not as the common word", () => {
    // 解 is xiè here, not jiě; 曾 zēng, not céng; 仇 qiú, not chóu.
    expect(wg("解志強")).toBe("HSIEH, CHIH-CHIANG");
    expect(wg("曾國藩")).toBe("TSENG, KUO-FAN");
    expect(wg("仇小明")).toBe("CHIU, HSIAO-MING");
    // 單 and 區 are the two pinyin-pro's surname dictionary still misses.
    expect(wg("單志明")).toBe("SHAN, CHIH-MING");
    expect(wg("區小明")).toBe("OU, HSIAO-MING");
  });

  it("writes ü as yu rather than emitting a character a passport cannot print", () => {
    const r = romanizeName("呂秀蓮")!;
    expect(r.hanyuPinyin.passport).toBe("LYU, XIU-LIAN");
    // Wade-Giles reaches a plain u for the same character — the spelling on
    // every pre-2002 passport.
    expect(r.wadeGiles.passport).toBe("LU, HSIU-LIEN");
    expect(r.hasUmlaut).toBe(true);
  });

  it("flags the umlaut only when there is one", () => {
    expect(romanizeName("王小明")!.hasUmlaut).toBe(false);
  });

  it("treats a lone character as all surname, with no trailing comma", () => {
    expect(wg("王")).toBe("WANG");
    expect(romanizeName("王")!.givenNameChars).toBe("");
  });

  it("takes an explicit split for a surname the lookup does not know", () => {
    expect(wg("王小明", 2)).toBe("WANG-HSIAO, MING");
    // Out-of-range splits clamp rather than producing an empty surname.
    expect(wg("王小明", 0)).toBe("WANG, HSIAO-MING");
    expect(wg("王小明", 99)).toBe("WANG-HSIAO-MING");
  });

  it("ignores whitespace in the input", () => {
    expect(wg(" 王 小明 ")).toBe("WANG, HSIAO-MING");
    expect(romanizeName("   ")).toBeNull();
    expect(romanizeName("")).toBeNull();
  });
});

describe("surnameLength", () => {
  it("is 2 for a compound surname and 1 otherwise", () => {
    expect(surnameLength("歐陽娜娜")).toBe(2);
    expect(surnameLength("王小明")).toBe(1);
    expect(surnameLength("王")).toBe(1);
  });
});

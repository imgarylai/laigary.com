import { pinyin } from "pinyin-pro";
import { pinyinToWadeGiles, toWadeGiles } from "use-wg";

// Chinese name → the romanizations a Taiwan passport application accepts.
//
// Only two of the five systems MOFA lists are here: Wade-Giles, because
// nothing else on npm produces it, and Hanyu Pinyin, because it has been the
// form the application pre-selects since 2009 and the comparison is the whole
// point — someone whose family passport reads HSU needs to see that Hanyu
// Pinyin would give them XU. Tongyong, GR and Yale would each need their own
// mapping table for a fraction of the traffic.

// Compound surnames, so 歐陽娜娜 splits OU-YANG / NA-NA rather than OU /
// YANG-NA-NA. Traditional forms only — the input this sees is Taiwanese.
const COMPOUND_SURNAMES = new Set([
  "歐陽",
  "司馬",
  "諸葛",
  "上官",
  "夏侯",
  "皇甫",
  "尉遲",
  "公孫",
  "澹台",
  "令狐",
  "宇文",
  "長孫",
  "慕容",
  "司徒",
  "司空",
  "鮮于",
  "閭丘",
  "子車",
  "亓官",
  "司寇",
  "巫馬",
  "公西",
  "顓孫",
  "壤駟",
  "公良",
  "漆雕",
  "樂正",
  "宰父",
  "穀梁",
  "拓跋",
  "夾谷",
  "軒轅",
  "令狐",
  "段干",
  "百里",
  "呼延",
  "東郭",
  "南門",
  "羊舌",
  "微生",
  "梁丘",
  "左丘",
  "東門",
  "西門",
  "南宮",
  "第五",
  "赫連",
  "濮陽",
  "淳于",
  "單于",
  "太叔",
  "申屠",
  "公羊",
  "端木",
  "東方",
  "萬俟",
]);

// pinyin-pro's `mode: "surname"` handles most polyphone surnames (曾 zēng not
// céng, 解 xiè not jiě, 仇 qiú not chóu, 查 zhā not chá). These are the ones its
// dictionary still reads as the common word.
//
// ponytail: a short override list, not a complete polyphone-surname database.
// It covers what turns up in Taiwanese household registration; anything rarer
// comes out as the common reading, which is why the split is adjustable — a
// user matching a relative's passport can see and correct it. Extend the list
// when a real name proves it wrong, not speculatively.
const SURNAME_READINGS: Record<string, string> = {
  單: "shan4",
  區: "ou1",
};

export interface Romanized {
  /** Space-free, uppercase, e.g. "HSU". */
  surname: string;
  /** Syllables joined with a hyphen, e.g. "CHIH-AN". */
  givenName: string;
  /** What goes on the form: "HSU, CHIH-AN". */
  passport: string;
}

export interface NameRomanization {
  /** The characters read as the surname, after the compound-surname split. */
  surnameChars: string;
  givenNameChars: string;
  wadeGiles: Romanized;
  hanyuPinyin: Romanized;
  /**
   * The name contains a ü syllable (呂, 女, 綠…). A passport prints ASCII, so
   * the vowel has to be rewritten, and the two systems disagree on how — the
   * page surfaces this rather than quietly picking one.
   */
  hasUmlaut: boolean;
}

/**
 * How many leading characters are the surname. Compound first, then a single
 * character — the ordinary case.
 */
export function surnameLength(name: string): number {
  return COMPOUND_SURNAMES.has(name.slice(0, 2)) ? 2 : 1;
}

// A passport prints ASCII only: no tone marks, and no Wade-Giles apostrophe
// (蔡 is TSAI on the page and TSAI on the passport, never TS'AI). ü is written
// yu, the convention MOFA's own romanisation uses — 呂 becomes LYU in Hanyu
// Pinyin. Wade-Giles reaches the same character as a plain u (呂 is LU, as on
// every pre-2002 passport), so this only ever fires on the pinyin column.
function passportize(syllables: string[]): string[] {
  return syllables
    .map((s) =>
      s
        .replace(/['’ˈ]/g, "")
        .replace(/[üǖǘǚǜ]/g, "yu")
        .toUpperCase(),
    )
    .filter(Boolean);
}

const UMLAUT = /[üǖǘǚǜ]/;

function romanized(surname: string[], given: string[]): Romanized {
  const s = passportize(surname).join("-");
  const g = passportize(given).join("-");
  // A single-character input is all surname; emitting "HSU, " would look like
  // the given name failed to convert.
  return { surname: s, givenName: g, passport: g ? `${s}, ${g}` : s };
}

function hanyuSyllables(chars: string, isSurname: boolean): string[] {
  if (!chars) return [];
  const override = isSurname ? SURNAME_READINGS[chars] : undefined;
  if (override) return [override];
  return pinyin(chars, {
    // Surname mode only changes the reading of the leading characters, so it is
    // wrong to ask for it on the given name.
    mode: isSurname ? "surname" : "normal",
    toneType: "num",
    type: "array",
  });
}

function wadeGilesSyllables(chars: string, isSurname: boolean): string[] {
  if (!chars) return [];
  // The surname goes through pinyin first so it inherits pinyin-pro's surname
  // readings — use-wg has no surname mode of its own and would romanise 解 as
  // chieh (jiě) rather than hsieh (xiè). The given name goes direct, where
  // use-wg's context-aware polyphone handling is the better source.
  if (isSurname) {
    return hanyuSyllables(chars, true).map((p) => pinyinToWadeGiles(p, { toneFormat: "none" }));
  }
  return toWadeGiles(chars, { urlSafe: true }).text.split("-");
}

/**
 * Romanise a Chinese name into Wade-Giles and Hanyu Pinyin passport forms.
 *
 * `splitAt` overrides how many leading characters count as the surname; it
 * defaults to the compound-surname lookup. Callers expose it because the
 * lookup cannot know about a rare compound surname, and because a user
 * matching a relative's existing passport needs to be able to correct it.
 */
export function romanizeName(name: string, splitAt?: number): NameRomanization | null {
  const trimmed = name.replace(/\s+/g, "");
  if (!trimmed) return null;

  const at = Math.min(Math.max(splitAt ?? surnameLength(trimmed), 1), trimmed.length);
  const surnameChars = trimmed.slice(0, at);
  const givenNameChars = trimmed.slice(at);

  const hanyuSurname = hanyuSyllables(surnameChars, true);
  const hanyuGiven = hanyuSyllables(givenNameChars, false);

  return {
    surnameChars,
    givenNameChars,
    hasUmlaut: [...hanyuSurname, ...hanyuGiven].some((s) => UMLAUT.test(s)),
    wadeGiles: romanized(
      wadeGilesSyllables(surnameChars, true),
      wadeGilesSyllables(givenNameChars, false),
    ),
    hanyuPinyin: romanized(hanyuSurname.map(stripTone), hanyuGiven.map(stripTone)),
  };
}

function stripTone(syllable: string): string {
  return syllable.replace(/\d+$/, "");
}

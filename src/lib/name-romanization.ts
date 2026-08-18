import { pinyin } from "pinyin-pro";
import { pinyinToZhuyin } from "pinyin-zhuyin";
import { pinyinToWadeGiles } from "use-wg";

// Chinese name → the romanizations a Taiwan passport application accepts.
//
// Only two of the five systems MOFA lists are here: Wade-Giles, because
// nothing else on npm produces it, and Hanyu Pinyin, because it has been the
// form the application pre-selects since 2009 and the comparison is the whole
// point — someone whose family passport reads HSU needs to see that Hanyu
// Pinyin would give them XU. Tongyong, GR and Yale would each need their own
// mapping table for a fraction of the traffic.
//
// The pipeline runs one direction throughout: pinyin-pro picks the reading,
// use-wg turns that reading into Wade-Giles, pinyin-zhuyin turns it into
// Bopomofo for the reader to check against. Going through pinyin rather than
// handing the characters to use-wg directly is what makes an alternative
// reading selectable at all — which readings a character has is a pinyin fact,
// and only the person whose name it is knows which one is theirs.

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
// It only sets the DEFAULT — every character whose readings spell differently
// now offers them in Bopomofo for the reader to correct, so a miss here costs
// a click rather than a wrong answer.
const SURNAME_READINGS: Record<string, string> = {
  單: "shan4",
  區: "ou1",
};

/** One pronunciation of one character, in every form this page shows. */
export interface Reading {
  /** Numbered pinyin, e.g. "yue4". The stable identity, also used in the URL. */
  pinyin: string;
  /**
   * Bopomofo, e.g. "ㄩㄝˋ". Readings that romanise identically are merged into
   * one option and their Bopomofo joined — 王 is WANG whether read ㄨㄤˊ or
   * ㄨㄤˋ, and offering that as a choice would be noise.
   */
  zhuyin: string;
  /** Lowercase, apostrophes intact — `passportize` strips them at the end. */
  wadeGiles: string;
  /** Toneless pinyin, ü intact. */
  hanyuPinyin: string;
}

export interface CharReading {
  char: string;
  chosen: Reading;
  /**
   * Every distinct spelling this character can take, `chosen` included. Length
   * 1 means there is nothing to choose.
   */
  options: Reading[];
  isSurname: boolean;
}

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
  /** Per character, in input order. */
  chars: CharReading[];
  wadeGiles: Romanized;
  hanyuPinyin: Romanized;
  /**
   * The name contains a ü syllable (呂, 女, 綠…). A passport prints ASCII, so
   * the vowel has to be rewritten, and the two systems disagree on how — the
   * page surfaces this rather than quietly picking one.
   */
  hasUmlaut: boolean;
  /**
   * The chosen readings as `yue4-da4-wei2`, for the URL. Self-describing on
   * purpose: an index into the options list would silently mean something else
   * the day pinyin-pro reorders its dictionary, and a shared link has to
   * survive that.
   */
  pinyinKey: string;
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

function stripTone(syllable: string): string {
  return syllable.replace(/\d+$/, "");
}

function toReading(numberedPinyin: string): Reading {
  return {
    pinyin: numberedPinyin,
    zhuyin: pinyinToZhuyin(numberedPinyin),
    wadeGiles: pinyinToWadeGiles(numberedPinyin, { toneFormat: "none" }),
    hanyuPinyin: stripTone(numberedPinyin),
  };
}

/**
 * Every spelling a character can take, in dictionary order, with readings that
 * romanise identically merged — 華 is HUA as huá, huà and huā, so it becomes
 * one option carrying all three Bopomofo forms rather than three identical
 * rows the reader has to choose between for no effect.
 */
function readingOptions(char: string): Reading[] {
  const all = pinyin(char, { multiple: true, type: "array", toneType: "num" }) as string[];
  const bySpelling = new Map<string, Reading>();
  for (const p of all) {
    const reading = toReading(p);
    const key = `${reading.wadeGiles}|${reading.hanyuPinyin}`;
    const seen = bySpelling.get(key);
    if (seen) {
      if (!seen.zhuyin.includes(reading.zhuyin)) seen.zhuyin += ` / ${reading.zhuyin}`;
    } else {
      bySpelling.set(key, reading);
    }
  }
  return [...bySpelling.values()];
}

/** The reading pinyin-pro picks for each character in context. */
function defaultPinyin(chars: string, isSurname: boolean): string[] {
  if (!chars) return [];
  const override = isSurname ? SURNAME_READINGS[chars] : undefined;
  if (override) return [override];
  return pinyin(chars, {
    // Surname mode only changes the reading of the leading characters, so it
    // is wrong to ask for it on the given name.
    mode: isSurname ? "surname" : "normal",
    toneType: "num",
    type: "array",
  }) as string[];
}

export interface RomanizeOptions {
  /**
   * How many leading characters count as the surname. Defaults to the
   * compound-surname lookup, which cannot know every rare one — and a reader
   * matching a relative's passport needs to be able to correct it.
   */
  splitAt?: number;
  /**
   * Numbered pinyin per character, overriding the reading picked from context.
   * Ignored unless it has exactly one entry per character, so a stale shared
   * link falls back to the default reading instead of mangling the name.
   */
  readings?: string[];
}

/** Romanise a Chinese name into Wade-Giles and Hanyu Pinyin passport forms. */
export function romanizeName(name: string, options: RomanizeOptions = {}): NameRomanization | null {
  const trimmed = name.replace(/\s+/g, "");
  if (!trimmed) return null;

  const characters = [...trimmed];
  const at = Math.min(Math.max(options.splitAt ?? surnameLength(trimmed), 1), characters.length);
  const surnameChars = characters.slice(0, at).join("");
  const givenNameChars = characters.slice(at).join("");

  const contextual = [
    ...defaultPinyin(surnameChars, true),
    ...defaultPinyin(givenNameChars, false),
  ];
  const override =
    options.readings && options.readings.length === characters.length ? options.readings : null;

  const chars: CharReading[] = characters.map((char, i) => {
    const opts = readingOptions(char);
    const wanted = override?.[i] ?? contextual[i];
    // The wanted reading may have been merged into another option (a tone the
    // spelling does not distinguish), so fall back to matching without it.
    const chosen =
      opts.find((o) => o.pinyin === wanted) ??
      opts.find((o) => wanted && stripTone(o.pinyin) === stripTone(wanted)) ??
      (wanted ? toReading(wanted) : opts[0]);
    return { char, chosen, options: opts, isSurname: i < at };
  });

  const surnameReadings = chars.slice(0, at);
  const givenReadings = chars.slice(at);

  return {
    surnameChars,
    givenNameChars,
    chars,
    hasUmlaut: chars.some((c) => UMLAUT.test(c.chosen.hanyuPinyin)),
    wadeGiles: romanized(
      surnameReadings.map((c) => c.chosen.wadeGiles),
      givenReadings.map((c) => c.chosen.wadeGiles),
    ),
    hanyuPinyin: romanized(
      surnameReadings.map((c) => c.chosen.hanyuPinyin),
      givenReadings.map((c) => c.chosen.hanyuPinyin),
    ),
    pinyinKey: chars.map((c) => c.chosen.pinyin).join("-"),
  };
}

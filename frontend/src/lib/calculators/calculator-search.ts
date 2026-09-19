/**
 * Home-screen calculator search.
 *
 * Phrase matching alone is not enough. Registry titles are formal — "Sodium
 * Correction for Hyperglycemia", "Creatinine Clearance (Cockcroft-Gault)",
 * "Child-Pugh Score" — while people type the clinical phrasing they carry in
 * their head: "corrected sodium in hyperglycemia", "creatinine clearance
 * cockcroft", "child pugh score". A contiguous-substring match misses every one
 * of those, so a calculator that is right there in the registry reads as
 * missing and gets reported as a gap in coverage.
 *
 * So: keep the phrase ranks on top, so typing the real name still wins, and
 * fall back to per-word matching underneath. Words are compared
 * punctuation-folded ("Child-Pugh" becomes child + pugh, "(Cockcroft-Gault)"
 * becomes cockcroft + gault) and lightly stemmed, so "corrected", "correction"
 * and "corrects" all reach the same stem. Every query word has to land
 * somewhere, so adding a word narrows the list instead of emptying it.
 *
 * Two more things had to be true before a lab value could find its calculator.
 * The text is folded into one alphabet first, because the registry writes SpO₂
 * with a subscript and mixes British and American spellings, and the search
 * reads input labels last, because Child-Pugh never says "INR" anywhere a
 * reader can see. Ranks run 0-9, best first; see rankCalculator.
 */

export type SearchableCalculator = {
  title: string
  shortTitle?: string
  description?: string
  tags?: string[]
  /**
   * Searched last, and the reason a lab value finds its calculators at all.
   * Child-Pugh takes INR, bilirubin and albumin; SOFA takes PaO₂, FiO₂ and
   * platelets; none of those words appear in either title, description or tags,
   * so "bilirubin" and "fio2" used to return nothing. Indexing the inputs keeps
   * that working for calculators added later without anyone maintaining a
   * synonym list.
   */
  inputs?: readonly { label?: string }[]
}

/** Filler words that carry no clinical meaning and only ever block a match. */
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'at', 'by', 'for', 'from', 'in', 'of', 'on', 'or', 'the', 'to', 'vs', 'with',
])

/**
 * Suffixes folded so a typed "corrected" reaches a stored "correction".
 * Longest first, so "corrections" loses "ions" rather than just the "s".
 */
const SUFFIXES = ['ations', 'ation', 'ions', 'ion', 'ings', 'ing', 'ies', 'ed', 'es', 's']

/** Digits the registry writes as sub/superscripts: SpO₂, ×10³, ABCD², FEV₁. */
const SUBSCRIPT_DIGITS = '₀₁₂₃₄₅₆₇₈₉'
const SUPERSCRIPT_DIGITS = '⁰¹²³⁴⁵⁶⁷⁸⁹'

/**
 * Put the query and the registry into one alphabet before comparing anything.
 *
 * Two mismatches were hiding calculators. SpO₂, PaO₂ and FiO₂ carry a subscript
 * two, not an ASCII "2", so a typed "fio2" matched nothing at all. And the
 * registry mixes spellings — Hypoalbuminaemia, leukaemia, anaemia sit next to
 * hemoglobin and hyponatremia — so half the vocabulary was unreachable from
 * whichever spelling the reader happened to use. Folding both sides the same
 * way costs nothing: the folded text is only ever compared, never displayed.
 */
function fold(text: string): string {
  let out = ''
  for (const ch of text.toLowerCase()) {
    const sub = SUBSCRIPT_DIGITS.indexOf(ch)
    if (sub >= 0) {
      out += sub
      continue
    }
    const sup = SUPERSCRIPT_DIGITS.indexOf(ch)
    if (sup >= 0) {
      out += sup
      continue
    }
    // Both micro signs, so "umol" reaches "µmol/L".
    out += ch === 'µ' || ch === 'μ' ? 'u' : ch
  }
  return out.replace(/ae|oe/g, 'e')
}

/** Fold, then split on anything that is not a letter or digit. */
function toWords(text: string): string[] {
  return fold(text).split(/[^a-z0-9]+/).filter(Boolean)
}

/**
 * Fold a common English ending, but only when at least four characters survive.
 * That keeps short clinical words intact: "gas" does not become "ga", "pe" and
 * "arc" are left alone.
 */
function stem(word: string): string {
  for (const suffix of SUFFIXES) {
    if (word.endsWith(suffix) && word.length - suffix.length >= 4) {
      return word.slice(0, word.length - suffix.length)
    }
  }
  return word
}

function stemWords(text: string): string[] {
  return toWords(text).map(stem)
}

/** Every query word must prefix-match some word in the haystack. */
function matchesEvery(queryStems: string[], haystack: string[]): boolean {
  return queryStems.every(q => haystack.some(word => word.startsWith(q)))
}

type CalculatorIndex = {
  /** Folded whole strings, for the phrase ranks. */
  title: string
  short: string
  description: string
  tagList: string[]
  /** Folded, stemmed words, for the per-word ranks. */
  name: string[]
  tags: string[]
  descriptionWords: string[]
  inputs: string[]
}

/**
 * Registry entries are module-level constants, so caching on the object keeps
 * the 80 records from being re-split on every keystroke.
 */
const indexCache = new WeakMap<SearchableCalculator, CalculatorIndex>()

function indexOf(calc: SearchableCalculator): CalculatorIndex {
  let cached = indexCache.get(calc)
  if (!cached) {
    cached = {
      title: fold(calc.title),
      short: fold(calc.shortTitle ?? ''),
      description: fold(calc.description ?? ''),
      tagList: (calc.tags ?? []).map(fold),
      name: stemWords(`${calc.title} ${calc.shortTitle ?? ''}`),
      tags: stemWords((calc.tags ?? []).join(' ')),
      descriptionWords: stemWords(calc.description ?? ''),
      inputs: stemWords((calc.inputs ?? []).map(i => i.label ?? '').join(' ')),
    }
    indexCache.set(calc, cached)
  }
  return cached
}

/** Lower is better. -1 means the calculator does not match at all. */
export function rankCalculator(calc: SearchableCalculator, query: string): number {
  const phrase = fold(query.trim())
  if (!phrase) return 0

  const { title, short, description, tagList: tags } = indexOf(calc)

  // Phrase matches first, so the exact name always outranks a loose word hit.
  if (title.startsWith(phrase)) return 0
  if (short.startsWith(phrase)) return 1
  if (tags.some(t => t.startsWith(phrase))) return 2
  if (title.includes(phrase)) return 3
  if (short.includes(phrase) || tags.some(t => t.includes(phrase))) return 4
  if (description.includes(phrase)) return 5

  // Then word by word, for the phrasings nobody writes the same way twice.
  const words = toWords(phrase)
  const meaningful = words.filter(w => !STOP_WORDS.has(w))
  // A query that is nothing but stop words still deserves its literal reading.
  const queryStems = (meaningful.length ? meaningful : words).map(stem)
  if (!queryStems.length) return -1

  const index = indexOf(calc)
  if (matchesEvery(queryStems, index.name)) return 6
  if (matchesEvery(queryStems, [...index.name, ...index.tags])) return 7
  const described = [...index.name, ...index.tags, ...index.descriptionWords]
  if (matchesEvery(queryStems, described)) return 8
  // Input labels rank last: a lab value should rescue a query that would
  // otherwise come back empty, never push a real name down the list.
  if (matchesEvery(queryStems, [...described, ...index.inputs])) return 9
  return -1
}

/** Calculators matching `query`, best match first. Empty query returns all. */
export function searchCalculators<T extends SearchableCalculator>(
  calculators: readonly T[],
  query: string,
): T[] {
  if (!query.trim()) return [...calculators]
  return calculators
    .map(calc => ({ calc, rank: rankCalculator(calc, query) }))
    .filter(entry => entry.rank >= 0)
    .sort((a, b) => a.rank - b.rank || a.calc.title.localeCompare(b.calc.title))
    .map(entry => entry.calc)
}

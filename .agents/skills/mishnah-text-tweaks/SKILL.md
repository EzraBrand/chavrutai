---
name: mishnah-text-tweaks
description: Add or modify punctuation and text replacement rules in the Mishnah Hebrew or English text processing functions. Use when the user wants to tweak how Mishnah text is displayed — changing commas to colons, periods to question marks, replacing transliterations, etc.
---

# Mishnah Text Tweaks

## File

All rules live in `client/src/lib/text-processing.ts`:

- **Hebrew rules:** `processMishnahHebrewText()` (~line 126)
- **English rules:** `processMishnahEnglishText()` (~line 174)

## How the Hebrew Processing Map Works

The function removes nikud first, then applies a chain of `.replace()` calls that transform punctuation. Rules are grouped by type:

### Comma → Colon (speech/attribution markers)
Patterns like `אומר,` → `אומר:` and `אמר רבי X,` → `אמר רבי X:`.
Used when a comma incorrectly separates a speaker from their statement.

### Comma/Period → Question Mark (interrogative phrases)
Patterns like `(איזהו X),` → `(איזהו X)?` and `(כיצד X).` → `(כיצד X)?`.
Used when a question phrase is incorrectly terminated with a comma or period instead of a question mark.

### Comma → Colon (structural markers)
Patterns like `זה הכלל,` → `זה הכלל:`.
Used when a structural phrase introduces a rule or list.

## How the English Processing Map Works

The function strips HTML, then applies replacements in three phases:

1. **Term replacements** — transliteration corrections (e.g., `Joshua` → `Yehoshua`, `Beth Hillel` → `Beit Hillel`)
2. **Punctuation corrections** — e.g., `said,` → `said:`
3. **Line splitting** — splits on sentence-ending punctuation for line-by-line display (abbreviations like `i.e.`, `e.g.`, `R'` are protected from splitting)

## Adding a New Rule

### Step 1: Identify the pattern type

The user will typically provide:
- The Hebrew/English phrase
- The current (wrong) punctuation
- The desired (correct) punctuation
- An example URL like `https://chavrutai.com/mishnah/Tractate/Chapter#Mishnah`

### Step 2: Choose the regex pattern

**Fixed phrase** (no variable words):
```js
.replace(/זה הכלל,/g, 'זה הכלל:')
```

**Phrase + variable trailing words** (one or more words follow the phrase before the punctuation):
```js
// Comma variant — exclude comma and newline from capture
.replace(/(איזהו\s+[^,\n]+),/g, '$1?')

// Period variant — exclude period and newline from capture
.replace(/(מאימתי\s+[^.\n]+)\./g, '$1?')
```

**Phrase + named element** (e.g., rabbi name):
```js
.replace(/אמר רבי ([^,\n]+),/g, 'אמר רבי $1:')
```

### Step 3: Place the rule in the correct group

- **Comma → colon** rules go with the other attribution/structural colon rules
- **Comma/Period → question mark** rules go with the other interrogative rules
- If a phrase needs both comma and period variants, add both (comma variant first, period variant after)

### Step 4: Watch for ordering

- More specific patterns must come before more general ones (e.g., `אמר לו רבי X,` before `אמר לו,` before `אמר,`)
- If a phrase already has a comma variant and you're adding a period variant, place the period variant after the comma one

## Existing Hebrew Rules Reference

### Comma → Colon
| Pattern | Example |
|---|---|
| `אומרים,` | speakers say: |
| `אומר,` | he says: |
| `אמרו לו,` | they said to him: |
| `(אמרו להם X),` | they said to them X: |
| `אמרו להם,` | they said to them: |
| `אמר להם,` | he said to them: |
| `אמר לו רבי X,` | Rabbi X said to him: |
| `אמר רבי X,` | Rabbi X said: |
| `אמר לו,` | he said to him: |
| `(אמר X),` | X said: |
| `אמר,` | he said: |
| `ואלו הן,` | and these are: |
| `(אלו X).` | these X: |
| `שני לו,` | the second to him: |
| `שלישי לו,` | the third to him: |
| `זה הכלל,` | this is the rule: |

### Comma/Period → Question Mark
| Pattern | Example |
|---|---|
| `(איזהו X),` | which is X? |
| `(איזהו X).` | which is X? |
| `(ואיזו היא X),` | and which is X? |
| `(מה בין X).` | what is between X? |
| `(כיצד X)[,.]` | how does X? |
| `כיצד.` / `כיצד,` | how? |
| `במה דברים אמורים,` | in what case? |
| `אימתי,` | when? |
| `(באיזה X),` | in which X? |
| `(באיזה X).` | in which X? |
| `(מאימתי X).` | from when X? |

## Existing English Rules Reference

### Term Replacements
`Joshua`→`Yehoshua`, `Judah`→`Yehuda`, `Yose`→`Yosei`, `Ishmael`→`Yishmael`, `Akiba`→`Akiva`, `Zadok`→`Tzadok`, `Eleazar`→`Elazar`, `Beth Hillel`→`Beit Hillel`, `Beth Shammai`→`Beit Shammai`, `R.`→`R'`, `thyself`→`yourself`, `thy`→`your`, `Mt.`→`Mount`

### Punctuation
`said,` → `said:`

## Testing

After adding a rule, visit the specific Mishnah URL the user provided to confirm the change renders correctly. The app hot-reloads on save.

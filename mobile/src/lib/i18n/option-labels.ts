/**
 * Display labels for the fixed-choice option lists in
 * backend/app/Support/MemberOptions.php.
 *
 * Those options are their own stored value — the backend validates them with
 * Rule::in() against the English strings and saves them verbatim. So this maps
 * English value -> localised label for DISPLAY ONLY; the value sent back to the
 * API must stay the English original.
 *
 * Anything not listed falls through unchanged, which is what keeps the
 * admin-managed lookups (religions, castes, states, districts, education
 * levels, qualifications, industries) working — their names come from the
 * database and are not translated here.
 */

import { DEFAULT_LOCALE, type Locale } from './translations';

const ml: Record<string, string> = {
  // Genders
  male: 'പുരുഷൻ',
  female: 'സ്ത്രീ',

  // Marital statuses
  'Never Married': 'വിവാഹം കഴിച്ചിട്ടില്ല',
  Divorced: 'വിവാഹമോചിതൻ/വിവാഹമോചിത',
  Widowed: 'വിധവ/വിഭാര്യൻ',
  'Awaiting Divorce': 'വിവാഹമോചനം കാത്തിരിക്കുന്നു',

  // On behalf of
  Self: 'സ്വയം',
  Parent: 'മാതാപിതാക്കൾ',
  Sibling: 'സഹോദരൻ/സഹോദരി',
  Relative: 'ബന്ധു',
  Friend: 'സുഹൃത്ത്',
  Guardian: 'രക്ഷിതാവ്',

  // Languages
  Hindi: 'ഹിന്ദി',
  English: 'ഇംഗ്ലീഷ്',
  Telugu: 'തെലുങ്ക്',
  Tamil: 'തമിഴ്',
  Kannada: 'കന്നഡ',
  Malayalam: 'മലയാളം',
  Marathi: 'മറാത്തി',
  Gujarati: 'ഗുജറാത്തി',
  Punjabi: 'പഞ്ചാബി',
  Bengali: 'ബംഗാളി',
  Urdu: 'ഉറുദു',
  Odia: 'ഒഡിയ',
  Assamese: 'അസമീസ്',
  Konkani: 'കൊങ്കണി',
  Sindhi: 'സിന്ധി',
  Kashmiri: 'കശ്മീരി',

  // Complexions
  'Very Fair': 'വളരെ വെളുത്ത നിറം',
  Fair: 'വെളുത്ത നിറം',
  Wheatish: 'ഗോതമ്പ് നിറം',
  'Wheatish Brown': 'ഇരുണ്ട ഗോതമ്പ് നിറം',
  Dark: 'ഇരുണ്ട നിറം',

  // Body types
  Slim: 'മെലിഞ്ഞ',
  Athletic: 'കായികക്ഷമതയുള്ള',
  Average: 'ശരാശരി',
  Heavy: 'തടിച്ച',

  // Diets
  Vegetarian: 'സസ്യാഹാരി',
  'Non-Vegetarian': 'മാംസാഹാരി',
  Eggetarian: 'മുട്ട കഴിക്കുന്ന സസ്യാഹാരി',
  Vegan: 'വീഗൻ',
  Jain: 'ജൈന ഭക്ഷണരീതി',

  // Habit levels / manglik / children acceptable
  No: 'ഇല്ല',
  Yes: 'ഉണ്ട്',
  Occasionally: 'ഇടയ്ക്കിടെ',
  "Don't Know": 'അറിയില്ല',
  "Doesn't Matter": 'പ്രശ്നമല്ല',

  // Living with
  Family: 'കുടുംബത്തോടൊപ്പം',
  Alone: 'ഒറ്റയ്ക്ക്',
  Parents: 'മാതാപിതാക്കളോടൊപ്പം',
  Relatives: 'ബന്ധുക്കളോടൊപ്പം',
  Roommates: 'റൂംമേറ്റുകളോടൊപ്പം',

  // Family values / statuses
  Traditional: 'പരമ്പരാഗതം',
  Moderate: 'മിതമായ',
  Liberal: 'ഉദാരം',
  'Middle Class': 'മധ്യവർഗം',
  'Upper Middle Class': 'ഉയർന്ന മധ്യവർഗം',
  'Rich / Affluent': 'സമ്പന്നം',

  // Malayalam stars — the backend stores the transliterated spelling; these
  // are the same names in Malayalam script.
  Ashwathi: 'അശ്വതി',
  Bharani: 'ഭരണി',
  Karthika: 'കാർത്തിക',
  Rohini: 'രോഹിണി',
  Makayiram: 'മകയിരം',
  Thiruvathira: 'തിരുവാതിര',
  Punartham: 'പുണർതം',
  Pooyam: 'പൂയം',
  Ayilyam: 'ആയില്യം',
  Makam: 'മകം',
  Pooram: 'പൂരം',
  Uthram: 'ഉത്രം',
  Atham: 'അത്തം',
  Chithira: 'ചിത്തിര',
  Chothi: 'ചോതി',
  Vishakham: 'വിശാഖം',
  Anizham: 'അനിഴം',
  Thrikketta: 'തൃക്കേട്ട',
  Moolam: 'മൂലം',
  Pooradam: 'പൂരാടം',
  Uthradam: 'ഉത്രാടം',
  Thiruvonam: 'തിരുവോണം',
  Avittam: 'അവിട്ടം',
  Chathayam: 'ചതയം',
  Pooruruttathi: 'പൂരുരുട്ടാതി',
  Uthrattathi: 'ഉത്രട്ടാതി',
  Revathi: 'രേവതി',
};

// Blood groups (A+, O-, …) are deliberately absent: they read the same in
// both languages.

const optionLabels: Record<Locale, Record<string, string>> = { en: {}, ml };

/**
 * Localised label for a stored option value, falling back to the value itself
 * when we don't ship a translation for it.
 */
export function optionLabel(locale: Locale, value: string): string {
  return optionLabels[locale][value] ?? optionLabels[DEFAULT_LOCALE][value] ?? value;
}

import { UserProfile, IncomeRange } from '../types';
import { INDIAN_STATES, POPULAR_DISTRICTS } from '../constants';

export interface ParsedEntity {
  field: string;
  value: string;
  label: string;
}

export interface VoiceParseResult {
  profile: Partial<UserProfile>;
  entities: ParsedEntity[];
  rawText: string;
}

// Spoken word to number dictionary across major Indian languages
const WORD_TO_NUMBER: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, 'twenty-one': 21, 'twenty-two': 22,
  'twenty-three': 23, 'twenty-four': 24, 'twenty-five': 25, 'twenty-six': 26, 'twenty-seven': 27,
  'twenty-eight': 28, 'twenty-nine': 29, thirty: 30, 'thirty-one': 31, 'thirty-two': 32,
  'thirty-five': 35, forty: 40, 'forty-five': 45, fifty: 50, 'fifty-five': 55, sixty: 60,
  'sixty-five': 65, seventy: 70, eighty: 80, ninety: 90,
  // Hindi & Urdu
  ek: 1, do: 2, teen: 3, chaar: 4, paanch: 5, chhah: 6, saat: 7, aath: 8, nau: 9, das: 10,
  gyarah: 11, barah: 12, terah: 13, chaudah: 14, pandrah: 15, solah: 16, satrah: 17,
  atharah: 18, unnees: 19, bees: 20, ikkees: 21, baees: 22, teyees: 23, chaubees: 24,
  pachees: 25, chhabees: 26, sattaees: 27, athaees: 28, untees: 29, tees: 30,
  paintees: 35, chalees: 40, paintalees: 45, pachaas: 50, saath: 60, sattar: 70, assi: 80, nabbe: 90,
};

// Comprehensive state mapping including English, native scripts and regional acronyms
const MULTILINGUAL_STATE_MAP: Record<string, string> = {
  // English & acronyms
  'uttar pradesh': 'Uttar Pradesh',
  'madhya pradesh': 'Madhya Pradesh',
  'andhra pradesh': 'Andhra Pradesh',
  'tamil nadu': 'Tamil Nadu',
  tamilnadu: 'Tamil Nadu',
  'west bengal': 'West Bengal',
  bengal: 'West Bengal',
  rajasthan: 'Rajasthan',
  haryana: 'Haryana',
  punjab: 'Punjab',
  delhi: 'Delhi',
  'new delhi': 'Delhi',
  maharashtra: 'Maharashtra',
  bihar: 'Bihar',
  karnataka: 'Karnataka',
  kerala: 'Kerala',
  gujarat: 'Gujarat',
  odisha: 'Odisha',
  orissa: 'Odisha',
  jharkhand: 'Jharkhand',
  chhattisgarh: 'Chhattisgarh',
  assam: 'Assam',
  goa: 'Goa',
  'himachal pradesh': 'Himachal Pradesh',
  himachal: 'Himachal Pradesh',
  uttarakhand: 'Uttarakhand',
  uttaranchal: 'Uttarakhand',
  telangana: 'Telangana',
  tripura: 'Tripura',
  manipur: 'Manipur',
  meghalaya: 'Meghalaya',
  mizoram: 'Mizoram',
  nagaland: 'Nagaland',
  sikkim: 'Sikkim',
  'arunachal pradesh': 'Arunachal Pradesh',
  arunachal: 'Arunachal Pradesh',
  'jammu & kashmir': 'Jammu and Kashmir',
  'jammu and kashmir': 'Jammu and Kashmir',
  jammu: 'Jammu and Kashmir',
  kashmir: 'Jammu and Kashmir',
  ladakh: 'Ladakh',
  chandigarh: 'Chandigarh',
  puducherry: 'Puducherry',
  pondicherry: 'Puducherry',
  'andaman and nicobar islands': 'Andaman and Nicobar Islands',
  'andaman and nicobar': 'Andaman and Nicobar Islands',
  andaman: 'Andaman and Nicobar Islands',
  'dadra and nagar haveli and daman and diu': 'Dadra and Nagar Haveli and Daman and Diu',
  'dadra and nagar haveli': 'Dadra and Nagar Haveli and Daman and Diu',
  'daman and diu': 'Dadra and Nagar Haveli and Daman and Diu',
  lakshadweep: 'Lakshadweep',

  // Regional Native Scripts
  'उत्तर प्रदेश': 'Uttar Pradesh',
  'मध्य प्रदेश': 'Madhya Pradesh',
  'आंध्र प्रदेश': 'Andhra Pradesh',
  'तमिलनाडु': 'Tamil Nadu',
  'पश्चिम बंगाल': 'West Bengal',
  'राजस्थान': 'Rajasthan',
  'हरियाणा': 'Haryana',
  'पंजाब': 'Punjab',
  'दिल्ली': 'Delhi',
  'महाराष्ट्र': 'Maharashtra',
  'बिहार': 'Bihar',
  'कर्नाटक': 'Karnataka',
  'केरल': 'Kerala',
  'गुजरात': 'Gujarat',
  'ओडिशा': 'Odisha',
  'झारखंड': 'Jharkhand',
  'छत्तीसगढ़': 'Chhattisgarh',
  'असम': 'Assam',
  'हिमाचल': 'Himachal Pradesh',
  'उत्तराखंड': 'Uttarakhand',
  'तेलंगाना': 'Telangana',
  'পশ্চিমবঙ্গ': 'West Bengal',
  'ত্রিপুরা': 'Tripura',
  'অসম': 'Assam',
  'ওড়িশা': 'Odisha',
  'తెలంగాణ': 'Telangana',
  'ఆంధ్రప్రదేశ్': 'Andhra Pradesh',
  'ఆంధ్ర': 'Andhra Pradesh',
  'ಕರ್ನಾಟಕ': 'Karnataka',
  'ತಮಿಳುನಾಡು': 'Tamil Nadu',
  'தமிழ்நாடு': 'Tamil Nadu',
  'கேரளா': 'Kerala',
  'புதுச்சேரி': 'Puducherry',
  'கர்நாடகா': 'Karnataka',
  'ஆந்திரா': 'Andhra Pradesh',
  'ગુજરાત': 'Gujarat',
  'રાજસ્થાન': 'Rajasthan',
  'ತೆಲಂಗಾಣ': 'Telangana',
  'ಕೇರಳ': 'Kerala',
  'കേരളം': 'Kerala',
  'തമിഴ്നാട്': 'Tamil Nadu',
  'ଓଡ଼ିଶା': 'Odisha',
  'ପଶ୍ଚିମବଙ୍ଗ': 'West Bengal',
  'ଆନ୍ଧ୍ରପ୍ରଦେଶ': 'Andhra Pradesh',
  'ਪੰਜਾਬ': 'Punjab',
  'ਹਰਿਆਣਾ': 'Haryana',
  'ਹਿਮਾਚਲ': 'Himachal Pradesh',
  'ਦਿੱਲੀ': 'Delhi',
  'ਚੰਡੀਗੜ੍ਹ': 'Chandigarh',
  'اتر پردیش': 'Uttar Pradesh',
  'مدھیہ پردیش': 'Madhya Pradesh',
  'بہار': 'Bihar',
  'دہلی': 'Delhi',
  'جموں و کشمیر': 'Jammu and Kashmir',
};

// Helper function to test keyword presence across ASCII and Unicode scripts safely
const containsAny = (text: string, keywords: string[]): boolean => {
  return keywords.some((kw) => {
    // If it's a short Latin word (<= 3 chars, e.g. 'sc', 'st', 'up', 'mp'), require word boundary
    if (/^[a-zA-Z]{1,3}$/.test(kw)) {
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      return regex.test(text);
    }
    return text.includes(kw.toLowerCase());
  });
};

/**
 * Calculates IncomeRange given a numeric annual income
 */
export const calculateIncomeRange = (income: number): IncomeRange => {
  if (income < 100000) return 'Below ₹1 lakh';
  if (income <= 250000) return '₹1–2.5 lakh';
  if (income <= 500000) return '₹2.5–5 lakh';
  if (income <= 1000000) return '₹5–10 lakh';
  return '₹10 lakh+';
};

/**
 * Multilingual NLP Voice Parsing Engine supporting top 11 regional Indian languages
 */
export const parseVoiceInput = (rawText: string): VoiceParseResult => {
  const text = rawText.toLowerCase().trim();
  const profile: Partial<UserProfile> = {};
  const entities: ParsedEntity[] = [];

  if (!text) {
    return { profile, entities, rawText };
  }

  // 1. ANNUAL INCOME PARSING
  let parsedIncome: number | null = null;

  // Regex for Lakhs across scripts
  const lakhMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs|laksham|latcham|laksha|লাখ|লক্ষ|ലക്ഷം|ലക്ഷ|లక్షలు|లక్ష|லட்சம்|લાખ|ಲಕ್ಷ|ଲକ୍ଷ|ਲੱਖ|لاکھ|लाख|लक्ष)/i);
  if (lakhMatch) {
    const num = parseFloat(lakhMatch[1]);
    parsedIncome = Math.round(num * 100000);
  }

  // Regex for Thousands across scripts
  if (parsedIncome === null) {
    const thousandMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:thousand|k|hazar|hazaar|aayiram|sahasram|వేలు|হাজার|ஆயிரம்|ആയിരം|હજાર|ਸਾਹਿਤ|हजार|हज़ार|ہزار|ହଜାର)/i);
    if (thousandMatch) {
      const num = parseFloat(thousandMatch[1]);
      parsedIncome = Math.round(num * 1000);
    }
  }

  // Direct numeric income
  if (parsedIncome === null) {
    const directIncomeMatch = text.match(/(?:income|salary|aamdani|kamai|earning|வருமானம்|ఆదాయం|আয়|آمدنی|ಆದಾಯ|ആദായം|આવક|ਆਮਦਨ|ଆୟ|उत्पन्न|आय)?\s*(?:is)?\s*₹?\s*(\d{5,7})\b/i);
    if (directIncomeMatch) {
      const num = parseInt(directIncomeMatch[1], 10);
      if (num >= 10000 && num <= 50000000) {
        parsedIncome = num;
      }
    }
  }

  // Multilingual spoken phrases for income amounts
  if (parsedIncome === null) {
    if (containsAny(text, ['dedh lakh', 'dedh lac', '1.5 lakh', 'দেড় লক্ষ', 'দেଢ଼ ଲକ୍ଷ', 'ఒಂದೂವರೆ ಲಕ್ಷ', 'ஒன்றரை லட்சம்', 'దెడ లక్ష', 'દોઢ લાખ', 'ਡੇਢ ਲੱਖ', 'ദെഡ് ലക്ഷം', 'ഒന്നര ലക്ഷം', 'ഒന്നര ലക്ഷ', 'ଦେଢ଼ ଲକ୍ଷ', 'ڈیڑھ لاکھ', 'दीड लाख', 'डेढ़ लाख'])) {
      parsedIncome = 150000;
    } else if (containsAny(text, ['dhai lakh', 'dhai lac', '2.5 lakh', 'আড়াই লক্ষ', 'இரண்டரை லட்சம்', 'અઢી લાખ', 'ਢਾਈ ਲੱਖ', 'ढाई लाख', 'രണ്ടര ലക്ഷം'])) {
      parsedIncome = 250000;
    } else if (containsAny(text, ['ek lakh', 'one lakh', 'এক লাখ', 'ఒక లక్ష', 'ஒரு லட்சம்', 'એક લાખ', 'ಒಂದು ಲಕ್ಷ', 'ഒരു ലക്ഷം', 'ഒരു ലക്ഷ', 'ଏକ ଲକ୍ଷ', 'ਇੱਕ ਲੱਖ', 'ایک لاکھ', 'एक लाख'])) {
      parsedIncome = 100000;
    } else if (containsAny(text, ['do lakh', 'two lakh', 'দুই লাখ', 'రెండు లక్షలు', 'இரண்டு லட்சம்', 'બે લાખ', 'ಎರಡು ಲಕ್ಷ', 'രണ്ട് ലക്ഷം', 'രണ്ടു ലക്ഷം', 'ଦୁଇ ଲକ୍ଷ', 'ਦੋ ਲੱਖ', 'دو لاکھ', 'दोन लाख', 'दो लाख'])) {
      parsedIncome = 200000;
    } else if (containsAny(text, ['teen lakh', 'three lakh', 'তিন লাখ', 'మూడు లక్షలు', 'மூன்று லட்சம்', 'ત્રણ લાખ', 'ಮೂರು ಲಕ್ಷ', 'മൂന്ന് ലക്ഷം', 'ତିନି ଲକ୍ଷ', 'ਤਿੰਨ ਲੱਖ', 'تین لاکھ', 'तीन लाख'])) {
      parsedIncome = 300000;
    } else if (containsAny(text, ['chaar lakh', 'four lakh', 'চার লাখ', 'నాలుగు లక్షలు', 'நான்கு லட்சம்', 'ચાર લાખ', 'ನಾಲ್ಕು ಲಕ್ಷ', 'നാല് ലക്ഷം', 'ଚାରି ଲକ୍ଷ', 'ਚਾਰ ਲੱਖ', 'चार लाख'])) {
      parsedIncome = 400000;
    } else if (containsAny(text, ['paanch lakh', 'five lakh', 'পাঁচ লাখ', 'ఐదు లక్షలు', 'ஐந்து லட்சம்', 'પાંચ લાખ', 'ಐದು ಲಕ್ಷ', 'അഞ്ച് ലക്ഷം', 'ପାଞ୍ଚ ଲକ୍ଷ', 'ਪੰਜ ਲੱਖ', 'पांच लाख'])) {
      parsedIncome = 500000;
    } else if (containsAny(text, ['pachaas hazar', 'fifty thousand', 'পঞ্চাশ হাজার', 'యాభై వేలు', 'ஐம்பதாயிரம்', 'પચાસ હજાર', 'ಐವತ್ತು ಸಾವಿರ', 'അമ്പതിനായിരം', 'ପଚାଶ ହଜାର', 'ਪੰਜਾਹ ਹਜ਼ਾਰ', 'پچاس ہزار', 'पन्नास हजार', 'पचास हजार'])) {
      parsedIncome = 50000;
    } else if (containsAny(text, ['assi hazar', 'eighty thousand', 'আশি হাজার', 'ఎనభై వేలు', 'எண்பதாயிரம்', 'એંસી હજાર', 'ಎಂಬತ್ತು ಸಾವಿರ', 'എൺപതിനായിരം', 'ଅଶୀ ହଜାର', 'ਅੱਸੀ ਹਜ਼ਾਰ', 'اسی ہزار', 'ऐंशी हजार', 'अस्सी हजार'])) {
      parsedIncome = 80000;
    }
  }

  if (parsedIncome !== null) {
    profile.annualIncome = parsedIncome;
    profile.incomeRange = calculateIncomeRange(parsedIncome);
    entities.push({
      field: 'annualIncome',
      value: `₹${(parsedIncome / 100000).toFixed(parsedIncome % 100000 === 0 ? 0 : 1)} Lakh / yr`,
      label: 'Income',
    });
  }

  // 2. DISABILITY / DIVYANG PARSING across 11 languages
  let capturedDisabilityPct: number | null = null;
  const disabilityKeywords = [
    'disability', 'disabled', 'handicapped', 'divyang', 'viklang', 'udid', 'physically challenged',
    'దివ్యాంగుల', 'దివ్యాంగుడు', 'மாற்றுத்திறனாளி', 'ഭിന്നശേഷി', 'ವಿಕಲಾಂಗ', 'દિવ્યાંગ', 'প্রতিবন্ধী', 'معذور',
    'ଭିନ୍ନକ୍ଷମ', 'ଦିਵਿਆਂਗ', 'अपंग', 'दिव्यांग', 'विकलांग'
  ];

  if (containsAny(text, disabilityKeywords)) {
    profile.hasDisability = true;
    profile.isDisability = true;

    const pctMatch = text.match(/(\d{1,3})\s*(?:%|percent|pratishat|ശതമാനം|சதவீதம்|శాతం|শতাংশ|ટકા|ಪ್ರತಿಶತ|ପ୍ରତିଶତ|ਪ੍ਰਤੀਸ਼ਤ|فیصد|टक्के|प्रतिशत)/i);
    if (pctMatch) {
      const pct = Math.min(Math.max(parseInt(pctMatch[1], 10), 0), 100);
      profile.disabilityPercentage = pct;
      capturedDisabilityPct = pct;
      entities.push({ field: 'hasDisability', value: `Yes (${pct}%)`, label: 'Disability' });
    } else {
      profile.disabilityPercentage = 40;
      entities.push({ field: 'hasDisability', value: 'Yes (40%)', label: 'Disability' });
    }
  }

  // 3. AGE PARSING across 11 languages
  let parsedAge: number | null = null;

  const explicitAgeMatch =
    text.match(/(?:age|umar|boyosh|vayassu|vayathu|vaya|bayasa|عمر|বয়স|వయస్సు|വയസ്സ്|ವಯಸ್ಸು|ઉંમર|ਉਮਰ|वय|ବୟସ|उम्र|age is|umar hai)\s*[:=]?\s*(\d{1,2})/i) ||
    text.match(/(\d{1,2})\s*(?:years old|year old|saal|sal|years|yr|yrs|bochhor|samvatsaralu|varudam|vayathu|varsha|varsh|varsham|barsha|বছর|సంవత్సరాలు|வருடம்|வயது|വയസ്സ്|ವರ್ಷ|વર્ષ|ਸਾਲ|سال|वर्षे|ବର୍ଷ|साल|ವರ್ಷದ|വയസ്സുള്ള)/i) ||
    text.match(/(?:i am|i'm|मैं|আমি|నేను|நான்|હું|ನಾನು|ഞാൻ|ମୁଁ|ਮੈਂ|میں|मी|எனக்கு)\s*(\d{1,2})\s*(?:years|saal|sal|old|ವರ್ಷ|வருடம்|வயது|വയസ്സ്|साल|ਸਾਲ|سال)?/i);

  if (explicitAgeMatch && explicitAgeMatch[1]) {
    const ageNum = parseInt(explicitAgeMatch[1], 10);
    if (ageNum >= 12 && ageNum <= 110 && ageNum !== capturedDisabilityPct) {
      parsedAge = ageNum;
    }
  }

  // Fallback for spoken number words
  if (parsedAge === null) {
    for (const [word, num] of Object.entries(WORD_TO_NUMBER)) {
      const wordRegex = new RegExp(`(?:age|umar|saal|years old|i am|i'm|उम्र|वय)\\s*${word}`, 'i');
      if (wordRegex.test(text) && num >= 14 && num <= 100) {
        if (!text.includes(`${word} lakh`) && !text.includes(`${word} percent`) && !text.includes(`${word} thousand`)) {
          parsedAge = num;
          break;
        }
      }
    }
  }

  if (parsedAge !== null) {
    profile.age = parsedAge;
    entities.push({ field: 'age', value: `${parsedAge} yrs`, label: 'Age' });
  }

  // 4. GENDER PARSING across 11 languages
  const femaleKeywords = [
    'female', 'woman', 'girl', 'mahila', 'aurat', 'lady', 'stri', 'stree', 'she', 'her',
    'মহিলা', 'স্ত্রী', 'మహిళ', 'స్త్రీ', 'பெண்', 'സ്ത്രീ', 'ಮಹಿಳೆ', 'સ્ત્રી', 'ਔਰਤ', 'عورت',
    'ମହିଳା', 'महिला', 'स्त्री', 'penn', 'meyeli', 'aadavalalu'
  ];
  const maleKeywords = [
    'male', 'man', 'boy', 'purush', 'aadmi', 'guy', 'he', 'him',
    'পুরুষ', 'పురుషుడు', 'ஆண்', 'പുരുഷൻ', 'ಪುರುಷ', 'પુરુષ', 'ਪੁਰਸ਼', 'مرد',
    'ପୁରୁଷ', 'पुरुष', 'aan', 'chele', 'magavadu', 'purushan'
  ];
  const otherGenderKeywords = [
    'transgender', 'trans', 'other', 'third gender', 'kinnar', 'তৃতীয় লিঙ্গ',
    'నపుంసకుడు', 'திருநங்கை', 'ഭിന്നലിംഗം', 'તૃતીય લિંગ', 'ਕਿੰਨਰ', 'किन्नर'
  ];

  if (containsAny(text, femaleKeywords)) {
    profile.gender = 'female';
    entities.push({ field: 'gender', value: 'Female', label: 'Gender' });
  } else if (containsAny(text, maleKeywords)) {
    profile.gender = 'male';
    entities.push({ field: 'gender', value: 'Male', label: 'Gender' });
  } else if (containsAny(text, otherGenderKeywords)) {
    profile.gender = 'other';
    entities.push({ field: 'gender', value: 'Other', label: 'Gender' });
  }

  // 5. MARITAL STATUS PARSING across 11 languages
  const singleKeywords = [
    'unmarried', 'single', 'single boy', 'single girl', 'avivahit', 'kunwara', 'kunwari',
    'অবিবাহিত', 'అవివాహితుడు', 'திருமணமாகாதவர்', 'അവിവാഹിതൻ', 'ಅವಿವಾಹಿತ', 'અપરિણીત',
    'ਕੁਆਰਾ', 'غیر شادی شدہ', 'ଅବିବାହିତ', 'अविवाहित'
  ];
  const marriedKeywords = [
    'married', 'vivahit', 'shaadi shuda', 'shadi shuda', 'wife', 'husband', 'pati', 'patni',
    'বিবাহিত', 'వివాహితుడు', 'వివాహిత', 'திருமணமானவர்', 'വിവാഹിതൻ', 'വിവാഹിത', 'ವಿವಾಹಿತ',
    'પરિણીત', 'ਵਿਆਹਿਆ', 'ਵਿਆਹੀ', 'شادی شدہ', 'ବିବାହିତ', 'विवाहित', 'शादीशुदा'
  ];
  const divorcedKeywords = [
    'divorced', 'talaqshuda', 'talaq', 'বিচ্ছেদ', 'విడాకులు', 'விவாகரத்து', 'വിவாHostമോചിതൻ',
    'വിచ్ಛೇದಿತ', 'છૂટાછેડા', 'ਤਲਾਕਸ਼ੁਦਾ', 'طلاق شدہ', 'ଛାଡ଼ପତ୍ର', 'घटस्फोट', 'तलाकशुदा'
  ];
  const desertedKeywords = [
    'deserted', 'abandoned', 'parityakta', 'পরিত্যক্ত', 'విడిచిపెట్టిన', 'கைவிடப்பட்ட',
    'ഉപേക്ഷിക്കപ്പെട്ട', 'ಪರಿತ್ಯಕ್ತ', 'ત્યજી દીધેલ', 'ਛੱਡਿਆ ਹੋਇਆ', 'چھوڑی ہوئی', 'ପରିତ୍ୟକ୍ତ', 'परित्यक्ता'
  ];

  if (containsAny(text, singleKeywords)) {
    profile.maritalStatus = 'single';
    entities.push({ field: 'maritalStatus', value: 'Single / Unmarried', label: 'Marital Status' });
  } else if (containsAny(text, marriedKeywords)) {
    profile.maritalStatus = 'married';
    entities.push({ field: 'maritalStatus', value: 'Married', label: 'Marital Status' });
  } else if (containsAny(text, divorcedKeywords)) {
    profile.maritalStatus = 'divorced';
    entities.push({ field: 'maritalStatus', value: 'Divorced', label: 'Marital Status' });
  } else if (containsAny(text, desertedKeywords)) {
    profile.maritalStatus = 'deserted';
    entities.push({ field: 'maritalStatus', value: 'Deserted', label: 'Marital Status' });
  }

  // 6. STATE & DISTRICT PARSING
  for (const [alias, stateName] of Object.entries(MULTILINGUAL_STATE_MAP)) {
    if (text.includes(alias.toLowerCase())) {
      profile.state = stateName;
      entities.push({ field: 'state', value: stateName, label: 'State' });
      break;
    }
  }

  if (!profile.state) {
    for (const state of INDIAN_STATES) {
      if (state !== 'All India' && text.includes(state.toLowerCase())) {
        profile.state = state;
        entities.push({ field: 'state', value: state, label: 'State' });
        break;
      }
    }
  }

  // District parsing
  const currentState = profile.state || '';
  const knownDistricts = currentState && POPULAR_DISTRICTS[currentState]
    ? POPULAR_DISTRICTS[currentState]
    : Object.values(POPULAR_DISTRICTS).flat();

  for (const dst of knownDistricts) {
    if (dst !== 'Others' && dst.length > 2 && text.includes(dst.toLowerCase())) {
      profile.district = dst;
      entities.push({ field: 'district', value: dst, label: 'District' });
      break;
    }
  }

  // 7. AREA / LOCALITY TYPE PARSING across 11 languages
  const ruralKeywords = [
    'rural', 'village', 'gaon', 'gramin', 'khet', 'gram', 'dehat', 'গ্রাম', 'గ్రామీణ',
    'கிராமம்', 'கிராமப்புறம்', 'ഗ്രാമം', 'ഗ്രാമ', 'ಗ್ರಾಮೀಣ', 'ગ્રામીણ', 'ਪਿੰਡ', 'دیہی', 'ଗ୍ରାମାଞ୍ଚଳ', 'गाव', 'ग्रामीण'
  ];
  const urbanKeywords = [
    'urban', 'city', 'metro', 'shehar', 'shahar', 'town', 'nagar', 'শহর', 'నగరం',
    'பட்டிணம்', 'நகரம்', 'നഗരം', 'നഗര', 'ನಗರ', 'શહેર', 'ਸ਼ਹਿਰ', 'شہری', 'ସହର', 'शहर'
  ];
  const semiUrbanKeywords = [
    'semi-urban', 'semi urban', 'suburban', 'kasba', 'tehsil', 'আধা শহর', 'అర్ధ పట్టణ',
    'அரை நகர்ப்புற', 'அரை நகர்ப்புறம்', 'അർദ്ധ നഗരം', 'ಅರೆ ನಗರ', 'અર્ધ શહેરી', 'ਅਰਧ ਸ਼ਹਿਰੀ', 'نیم شہری', 'ଅର୍ଦ୍ଧ ସହର'
  ];

  if (containsAny(text, ruralKeywords)) {
    profile.areaType = 'Rural';
    profile.residenceArea = 'Rural';
    entities.push({ field: 'areaType', value: 'Rural / Village', label: 'Locality' });
  } else if (containsAny(text, urbanKeywords)) {
    profile.areaType = 'Urban';
    profile.residenceArea = 'Urban';
    entities.push({ field: 'areaType', value: 'Urban / City', label: 'Locality' });
  } else if (containsAny(text, semiUrbanKeywords)) {
    profile.areaType = 'Semi-Urban';
    profile.residenceArea = 'Semi-Urban';
    entities.push({ field: 'areaType', value: 'Semi-Urban', label: 'Locality' });
  }

  // 8. SOCIAL CATEGORY PARSING across 11 languages
  const scKeywords = [
    'sc', 'scheduled caste', 'dalit', 'তফসিলি জাতি', 'ఎస్సీ', 'எஸ்சி', 'പട്ടികജാതി',
    'ಎಸ್ಸಿ', 'અનુસૂચિત જાતિ', 'ਐਸਸੀ', 'درج فہرست ذات', 'ଏସସି', 'अनुसूचित जाती', 'अनुसूचित जाति'
  ];
  const stKeywords = [
    'st', 'scheduled tribe', 'tribal', 'adivasi', 'তফসিলি উপজাতি', 'ఎస్టీ', 'எஸ்டி',
    'പട്ടികവർഗ്ഗം', 'ಎಸ್ಟಿ', 'આદિવાસી', 'ਐਸਟੀ', 'درج فہرست قبیلہ', 'ଏସଟି', 'अनुसूचित जमाती', 'अनुसूचित जनजाति', 'आदिवासी'
  ];
  const obcKeywords = [
    'obc', 'other backward', 'pichhda', 'pichhada', 'ওবিসি', 'ఓబీసీ', 'ஓபிசி', 'ഒബിസി',
    'ಒಬಿಸಿ', 'ઓબીસી', 'ਓਬੀਸੀ', 'او بی سی', 'ଓବିସି', 'इतर मागासवर्गीय', 'अन्य पिछड़ा वर्ग', 'ओबीसी'
  ];
  const ewsKeywords = [
    'ews', 'economically weaker', 'ইডব্লিউএস', 'ఈడబ్ల్యూఎస్', 'இடபிள்யூఎస్', 'இഡബ്ല്യുഎസ്',
    'ಇಡಬ್ಲ್ಯೂಎಸ್', 'ઈડબ્લ્યુએસ', 'ਈਡਬਲਯੂਐਸ', 'ای ڈبلیو ایس', 'ଇଡବ୍ଲୁଏସ', 'आर्थिक दुर्बल', 'ईडब्ल्यूएस'
  ];
  const generalKeywords = [
    'general', 'open', 'samanya', 'সাধারণ', 'జనరల్', 'பொது', 'ജനറൽ', 'ಸಾಮಾನ್ಯ',
    'સામાન્ય', 'ਜਨਰਲ', 'عام', 'ସାଧାରଣ', 'खुला प्रवर्ग', 'सामान्य'
  ];

  if (containsAny(text, scKeywords)) {
    profile.category = 'SC';
    entities.push({ field: 'category', value: 'SC', label: 'Category' });
  } else if (containsAny(text, stKeywords)) {
    profile.category = 'ST';
    entities.push({ field: 'category', value: 'ST', label: 'Category' });
  } else if (containsAny(text, obcKeywords)) {
    profile.category = 'OBC';
    entities.push({ field: 'category', value: 'OBC', label: 'Category' });
  } else if (containsAny(text, ewsKeywords)) {
    profile.category = 'EWS';
    entities.push({ field: 'category', value: 'EWS', label: 'Category' });
  } else if (containsAny(text, generalKeywords)) {
    profile.category = 'General';
    entities.push({ field: 'category', value: 'General', label: 'Category' });
  }

  // 9. MINORITY COMMUNITY PARSING across 11 languages
  const minorityKeywords = [
    'minority', 'alpsankhyak', 'muslim', 'christian', 'sikh', 'buddhist', 'jain', 'parsi',
    'সংখ্যালঘু', 'మైనారిటీ', 'சிறுபான்மையினர்', 'ന്യൂനപക്ഷം', 'ಅಲ್ಪಸಂಖ್ಯಾತ', 'લઘુમતી',
    'ਘੱਟ ਗਿਣਤੀ', 'اقلیت', 'اقلیتی', 'ଅଳ୍ପସଂଖ୍ୟକ', 'अल्पसंख्याक', 'अल्पसंख्यक'
  ];
  if (containsAny(text, minorityKeywords)) {
    profile.isMinority = true;
    entities.push({ field: 'isMinority', value: 'Yes', label: 'Minority Status' });
  }

  // 10. BPL / RATION CARD PARSING across 11 languages
  const bplKeywords = [
    'bpl', 'below poverty line', 'garib', 'ration card', 'rashan card', 'yellow card', 'bpl card', 'antyodaya',
    'বিপিএল', 'రేషన్ కార్డు', 'பிபிஎல்', 'റേഷൻ കാർഡ്', 'ಬಿಪಿಎಲ್', 'રાશન કાર્ડ', 'ਬੀਪੀਐਲ',
    'راشن کارڈ', 'ବିପିଏଲ', 'दारिद्र्य रेषेखालील', 'राशन कार्ड', 'बीपीएल'
  ];
  if (containsAny(text, bplKeywords)) {
    profile.hasBPLCard = true;
    profile.isBPL = true;
    entities.push({ field: 'hasBPLCard', value: 'Yes', label: 'BPL Card' });
  }

  // 11. EMPLOYMENT & OCCUPATION PARSING across 11 languages
  const farmerKeywords = [
    'farmer', 'kisan', 'kisan hoon', 'kheti', 'agriculture', 'farming', 'krishi', 'krishak',
    'কৃষক', 'రైతు', 'விவசாயி', 'കർഷകൻ', 'കർഷകനാണ്', 'കർഷക', 'ರೈತ', 'ખેડૂત', 'ਕਿਸਾਨ', 'کسان',
    'ଚାଷୀ', 'शेतकरी', 'shetkari', 'raithu', 'raitha', 'khedut', 'karshakan', 'uzhavar', 'vivasaayi', 'chasa', 'किसान'
  ];
  const studentKeywords = [
    'student', 'student hoon', 'padhai', 'college', 'school', 'vidyarthi', 'studying', 'university',
    'ছাত্র', 'విద్యార్థి', 'மாணவர்', 'விദ്യാർത്ഥി', 'ವಿದ್ಯಾರ್ಥಿ', 'વિદ્યાર્થી', 'ਵਿਦਿਆਰਥੀ',
    'طالب علم', 'ଛାତ୍ର', 'विद्यार्थी', 'chatra', 'chhatri', 'maanavar'
  ];
  const businessKeywords = [
    'business', 'business owner', 'businessman', 'businesswoman', 'dukan', 'dukandar', 'shopkeeper',
    'entrepreneur', 'vyapar', 'startup', 'ব্যবসা', 'వ్యాపారం', 'வியாபாரம்', 'വ്യാപാരം',
    'ವ್ಯಾಪಾರ', 'વ્યવસાય', 'ਵਪਾਰ', 'کاروبار', 'ବ୍ୟବସାୟ', 'व्यवसाय', 'व्यापारी', 'dhandho', 'vyapari', 'vanigam'
  ];
  const unemployedKeywords = [
    'unemployed', 'berozgar', 'berojgar', 'job seeker', 'looking for job', 'no job', 'unemployment',
    'বেকার', 'నిరుద్యోగి', 'வேலையில்லாதவர்', 'തൊഴിൽരഹിതൻ', 'ನಿರುದ್ಯೋಗಿ', 'નિરોજગਾਰ',
    'ਬੇਰੁਜ਼ਗਾਰ', 'بے روزگار', 'ବେକାର', 'बेरोजगार', 'बेरोज़गार'
  ];
  const selfEmployedKeywords = [
    'self-employed', 'self employed', 'swarojgar', 'freelance', 'mechanic', 'tailor', 'carpenter',
    'plumber', 'electrician', 'ಸ್ವಯಂ ಉದ್ಯೋಗಿ', 'சுயதொழில்', 'സ്വയംതൊഴിൽ', 'સ્વરોજગાર',
    'ਸਵੈ-ਰੁਜ਼ਗਾਰ', 'خود برسرروزگار', 'ସ୍ୱୟଂ ନିୟୋଜିତ', 'स्वयंरोजगार', 'स्वरोजगार'
  ];
  const homemakerKeywords = [
    'homemaker', 'housewife', 'house wife', 'grihani', 'house maker', 'গৃহিণী', 'గృహిణి',
    'இல்லத்தரசி', 'ഗൃഹനാഥ', 'ಗೃಹಿಣಿ', 'ગૃહિણી', 'ਘਰੇਲੂ ਔਰਤ', 'گھریلو خاتون', 'ଗୃହିଣୀ', 'गृहिणी', 'veetamma', 'illalu'
  ];
  const retiredKeywords = [
    'retired', 'pensioner', 'vriddha', 'senior citizen', 'অবসরপ্রাপ্ত', 'పదవీ విరమణ',
    'ஓய்வு பெற்றவர்', 'വിരമിച്ച', 'ನಿವೃತ್ತ', 'નિવૃત્ત', 'ਸੇਵਾਮੁਕਤ', 'ریٹائرڈ', 'ଅବସରପ୍ରାପ୍ତ', 'सेवानिवृत्त', 'रिटायर्ड'
  ];
  const employedKeywords = [
    'employed', 'job', 'naukri', 'working', 'service', 'employee', 'চাকরি', 'ఉద్యోగం',
    'வேலை', 'ജോലി', 'ಉದ್ಯೋಗ', 'નોકરી', 'ਨੌਕਰੀ', 'ملازمت', 'ଚାକିରି', 'नोकरी', 'नौकरी'
  ];

  if (containsAny(text, farmerKeywords)) {
    profile.employmentStatus = 'Farmer';
    profile.employmentType = 'Farmer';
    profile.occupation = 'Farmer';
    entities.push({ field: 'employmentType', value: 'Farmer', label: 'Occupation' });
  } else if (containsAny(text, studentKeywords)) {
    profile.employmentStatus = 'Student';
    profile.employmentType = 'Student';
    profile.occupation = 'Student';
    entities.push({ field: 'employmentType', value: 'Student', label: 'Occupation' });
  } else if (containsAny(text, businessKeywords)) {
    profile.employmentStatus = 'Business owner';
    profile.employmentType = 'Business owner';
    profile.occupation = 'Business Owner';
    entities.push({ field: 'employmentType', value: 'Business Owner', label: 'Occupation' });
  } else if (containsAny(text, unemployedKeywords)) {
    profile.employmentStatus = 'Unemployed';
    profile.employmentType = 'Unemployed';
    profile.occupation = 'Unemployed';
    entities.push({ field: 'employmentType', value: 'Unemployed', label: 'Occupation' });
  } else if (containsAny(text, selfEmployedKeywords)) {
    profile.employmentStatus = 'Self-employed';
    profile.employmentType = 'Self-employed';
    profile.occupation = 'Self-employed';
    entities.push({ field: 'employmentType', value: 'Self-employed', label: 'Occupation' });
  } else if (containsAny(text, homemakerKeywords)) {
    profile.employmentStatus = 'Homemaker';
    profile.employmentType = 'Homemaker';
    profile.occupation = 'Homemaker';
    entities.push({ field: 'employmentType', value: 'Homemaker', label: 'Occupation' });
  } else if (containsAny(text, retiredKeywords)) {
    profile.employmentStatus = 'Retired';
    profile.employmentType = 'Retired';
    profile.occupation = 'Retired';
    entities.push({ field: 'employmentType', value: 'Retired', label: 'Occupation' });
  } else if (containsAny(text, employedKeywords)) {
    profile.employmentStatus = 'Employed';
    const govtKeywords = ['government', 'sarkari', 'govt', 'public sector', 'psu', 'সরকারি', 'ప్రభుత్వ', 'அரசு', 'സർക്കാർ', 'ಸರ್ಕಾರಿ', 'સરકારી', 'ਸਰਕਾਰੀ', 'سرکاری', 'ସରକାରୀ', 'सरकारी'];
    const pvtKeywords = ['private', 'private job', 'pvt', 'company', 'বেসরকারি', 'ప్రైవేట్', 'தனியார்', 'സ്വകാര്യ', 'ಖಾಸಗಿ', 'ખાનગી', 'ਪ੍ਰਾਈਵੇਟ', 'نجی', 'ବେସରକାରୀ', 'खाजगी', 'प्राइवेट'];

    if (containsAny(text, govtKeywords)) {
      profile.employmentType = 'GOVERNMENT';
      entities.push({ field: 'employmentType', value: 'Govt Employee', label: 'Occupation' });
    } else if (containsAny(text, pvtKeywords)) {
      profile.employmentType = 'PRIVATE';
      entities.push({ field: 'employmentType', value: 'Private Employee', label: 'Occupation' });
    } else {
      profile.employmentType = 'Employed';
      entities.push({ field: 'employmentType', value: 'Employed', label: 'Occupation' });
    }
  }

  // Specialized occupations
  if (containsAny(text, ['driver', 'auto driver', 'truck driver', 'cab driver', 'ড্রাইভার', 'డ్రైవర్', 'டிரைவர்', 'ഡ്രൈവർ', 'ಡ್ರೈವರ್', 'ડ્રાઇવર', 'ਡਰਾਈਵਰ', 'ڈرائیور', 'ଡ୍ରାଇଭର', 'चालक', 'ड्राइवर'])) {
    profile.occupation = 'Driver';
  } else if (containsAny(text, ['teacher', 'shikshak', 'professor', 'faculty', 'শিক্ষক', 'ఉపాధ్యాయుడు', 'ஆசிரியர்', 'அധ്യാപകൻ', 'ಶಿಕ್ಷಕ', 'શિક્ષક', 'ਅਧਿਆਪਕ', 'استاد', 'ଶିକ୍ଷକ', 'शिक्षक'])) {
    profile.occupation = 'Teacher';
  } else if (containsAny(text, ['doctor', 'chikitshak', 'mbbs', 'physician', 'ডাক্তার', 'డాక్టర్', 'மருத்துவர்', 'ഡോക്ടർ', 'ವೈದ್ಯ', 'ડોક્ટર', 'ਡਾਕਟਰ', 'ڈاکٹر', 'ଡାକ୍ତର', 'वैद्य', 'डॉक्टर'])) {
    profile.occupation = 'Doctor';
  } else if (containsAny(text, ['engineer', 'software engineer', 'civil engineer', 'ইঞ্জিনিয়ার', 'ఇంజనీర్', 'பொறியாளர்', 'എഞ്ചിനീയർ', 'ಇಂಜಿನಿಯರ್', 'ઇજનેર', 'ਇੰਜੀਨੀਅਰ', 'انجینئر', 'ଇଞ୍ଜିନିୟର', 'अभियंता', 'इंजीनियर'])) {
    profile.occupation = 'Engineer';
  } else if (containsAny(text, ['construction worker', 'mazdoor', 'daily wage', 'shramik', 'daily wager', 'শ্রমিক', 'కూలీ', 'தொழிலாளி', 'തൊഴിലാളി', 'ಕಾರ್ಮಿಕ', 'શ્રમિક', 'ਮਜ਼ਦੂਰ', 'مزدور', 'ଶ୍ରମିକ', 'कामगार', 'मजदूर'])) {
    profile.occupation = 'Construction Worker';
  }

  // 12. NAME PARSING
  const nameMatch = text.match(
    /(?:my name is|mera naam|name is|মোর নাম|আমার নাম|నా పేరు|என் பெயர்|എന്റെ പേര്|ನನ್ನ ಹೆಸರು|મારું નામ|ਮੇਰਾ ਨਾਮ|میرا نام|ମୋର ନାମ|माझे नाव|मेरा नाम)\s+([a-zA-Z\u0900-\u0DFF]+(?:\s+[a-zA-Z\u0900-\u0DFF]+)?)/i
  );
  if (nameMatch && nameMatch[1]) {
    const candidate = nameMatch[1].trim();
    const noise = [
      'a', 'an', 'the', 'farmer', 'student', 'from', 'living', 'aged', 'years', 'old', 'purush', 'mahila', 'boy', 'girl',
      'hai', 'hoon', 'hu', 'છે', 'ആണ്', 'ಆಗಿದೆ', 'ఉంది', 'ஆகும்', 'হয়', 'ਹੈ', 'ہے', 'ଅଟେ', 'आहे'
    ];
    const parts = candidate.split(' ').filter((p) => !noise.includes(p.toLowerCase()));
    if (parts.length > 0 && parts[0].length > 1) {
      const formattedName = parts.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      profile.name = formattedName;
      entities.push({ field: 'name', value: formattedName, label: 'Name' });
    }
  }

  return {
    profile,
    entities,
    rawText,
  };
};

import { Scheme, DocumentRequirement, Benefit, ApplicationStep } from '../types';
import { translateGlossaryPhrase } from '../i18n/glossary';

/**
 * Standard Document Name translations across all 11 Indic languages + English
 */
export const DOCUMENT_GLOSSARY: Record<string, Record<string, string>> = {
  'Aadhaar Card': {
    'hi-IN': 'आधार कार्ड',
    'or-IN': 'ଆଧାର କାର୍ଡ଼',
    'bn-IN': 'আধার কার্ড',
    'te-IN': 'ఆధార్ కార్డు',
    'mr-IN': 'आधार कार्ड',
    'ta-IN': 'ஆதார் அட்டை',
    'gu-IN': 'આધાર કાર્ડ',
    'kn-IN': 'ಆಧಾರ್ ಕಾರ್ಡ್',
    'ml-IN': 'ആധാർ കാർഡ്',
    'pa-IN': 'ਆਧਾਰ ਕਾਰਡ',
    'ur-IN': 'آدھار کارڈ',
  },
  'Income Certificate': {
    'hi-IN': 'आय प्रमाण पत्र (सक्षम अधिकारी द्वारा)',
    'or-IN': 'ଆୟ ପ୍ରମାଣପତ୍ର (ତହସିଲଦାର/ସକ୍ଷମ ଅଧିକାରୀ)',
    'bn-IN': 'আয় শংসাপত্র',
    'te-IN': 'ఆదాయ ధృవీకరణ పత్రం',
    'mr-IN': 'उत्पन्नाचा दाखला',
    'ta-IN': 'வருமானச் சான்றிதழ்',
    'gu-IN': 'આવકનો દાખલો',
    'kn-IN': 'ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ',
    'ml-IN': 'വരുമാന സർട്ടിഫിക്കറ്റ്',
    'pa-IN': 'ਆਮਦਨ ਸਰਟੀਫਿਕੇਟ',
    'ur-IN': 'آمدنی کا سرٹیفکیٹ',
  },
  'Caste Certificate': {
    'hi-IN': 'जाति प्रमाण पत्र (SC/ST/OBC)',
    'or-IN': 'ଜାତି ପ୍ରମାଣପତ୍ର (SC/ST/OBC)',
    'bn-IN': 'জাতিগত শংসাপত্র',
    'te-IN': 'కుల ధృవీకరణ పత్రం',
    'mr-IN': 'जातीचे प्रमाणपत्र',
    'ta-IN': 'சாதிச் சான்றிதழ்',
    'gu-IN': 'જાતિનું પ્રમાણપત્ર',
    'kn-IN': 'ಜಾತಿ ಪ್ರಮಾಣಪತ್ರ',
    'ml-IN': 'ജാതി സർട്ടിഫിക്കറ്റ്',
    'pa-IN': 'ਜਾਤੀ ਸਰਟੀਫਿਕੇਟ',
    'ur-IN': 'ذات کا سرٹیفکیٹ',
  },
  'Bank Account Passbook': {
    'hi-IN': 'बैंक पासबुक / रद्द चेक (आधार से लिंक)',
    'or-IN': 'ବ୍ୟାଙ୍କ ପାସବହି / ବ୍ୟାଙ୍କ ଖାତା ବିବରଣୀ (ଆଧାର ଲିଙ୍କ୍)',
    'bn-IN': 'ব্যাঙ্ক পাসবই',
    'te-IN': 'బ్యాంక్ పాస్‌బుక్',
    'mr-IN': 'बँक पासबुक',
    'ta-IN': 'வங்கி கணக்கு புத்தகம்',
    'gu-IN': 'બેંક પાસબુક',
    'kn-IN': 'ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್',
    'ml-IN': 'ബാങ്ക് പാസ്ബുക്ക്',
    'pa-IN': 'ਬੈਂਕ ਪਾਸਬੁੱਕ',
    'ur-IN': 'بینک پاس بک',
  },
  'Ration Card / BPL Card': {
    'hi-IN': 'राशन कार्ड / बीपीएल कार्ड',
    'or-IN': 'ରାସନ କାର୍ଡ଼ / ବିପିଏଲ କାର୍ଡ଼',
    'bn-IN': 'রেশন কার্ড / বিপিএল কার্ড',
    'te-IN': 'రేషన్ కార్డు / బిపిఎల్ కార్డు',
    'mr-IN': 'रेशन कार्ड / बीपीएल कार्ड',
    'ta-IN': 'ரேஷன் அட்டை / பிபிஎல் அட்டை',
    'gu-IN': 'રેશન કાર્ડ / બીપીએલ કાર્ડ',
    'kn-IN': 'ರೇಷನ್ ಕಾರ್ಡ್ / ಬಿಪಿಎಲ್ ಕಾರ್ಡ್',
    'ml-IN': 'റേഷൻ കാർഡ് / ബിപിഎൽ കാർഡ്',
    'pa-IN': 'ਰਾਸ਼ਨ ਕਾਰਡ / ਬੀਪੀਐੱਲ ਕਾਰਡ',
    'ur-IN': 'راشن کارڈ / بی پی ایل کارڈ',
  },
  'Land Ownership Record': {
    'hi-IN': 'भू-अभिलेख / खसरा-खतौनी / पट्टा',
    'or-IN': 'ଜମି ପଟ୍ଟା / ଖତିଆନ / ରୋର (RoR)',
    'bn-IN': 'জমির রেকর্ড / খতিয়ান',
    'te-IN': 'భూమి యాజమాన్య పత్రాలు',
    'mr-IN': 'जमीन मालकी हक्क / ७/१२ उतारा',
    'ta-IN': 'நில உரிமை ஆவணங்கள் / பட்டா',
    'gu-IN': 'જમીન માલિકી દસ્તાવેજ / ૭/૧૨',
    'kn-IN': 'ಜಮೀನು ದಾಖಲೆಗಳು / ಪಹಣಿ',
    'ml-IN': 'ഭൂവുടമസ്ഥതാ രേഖകൾ',
    'pa-IN': 'ਜ਼ਮੀਨ ਦੀ ਮਲਕੀਅਤ ਦੇ ਰਿਕਾਰਡ / ਫਰਦ',
    'ur-IN': 'زمین کی ملکیت کے دستاویزات',
  },
  'Passport Size Photograph': {
    'hi-IN': 'हालिया पासपोर्ट साइज फोटो',
    'or-IN': 'ନୂତନ ପାସପୋର୍ଟ ସାଇଜ୍ ଫଟୋଗ୍ରାଫ୍',
    'bn-IN': 'পাসপোর্ট সাইজ ছবি',
    'te-IN': 'పాస్‌పోర్ట్ సైజు ఫోటో',
    'mr-IN': 'पासपोर्ट आकाराचे छायाचित्र',
    'ta-IN': 'பாஸ்போர்ட் அளவு புகைப்படம்',
    'gu-IN': 'પાસપોર્ટ સાઇઝનો ફોટો',
    'kn-IN': 'ಪಾಸ್‌ಪೋರ್ಟ್ ಅಳತೆಯ ಭಾವಚಿತ್ರ',
    'ml-IN': 'പാസ്പോർട്ട് സൈസ് ഫോട്ടോ',
    'pa-IN': 'ਪਾਸਪੋਰਟ ਸਾਈਜ਼ ਫੋਟੋ',
    'ur-IN': 'پاسپورٹ سائز تصویر',
  },
  'Educational Marksheets & Certificates': {
    'hi-IN': 'शैक्षणिक मार्कशीट एवं प्रमाण पत्र',
    'or-IN': 'ଶିକ୍ଷାଗତ ମାର୍କସିଟ୍ ଏବଂ ପ୍ରମାଣପତ୍ର (ମାଟ୍ରିକ/ଯୁକ୍ତ ୨/ଡିଗ୍ରୀ)',
    'bn-IN': 'শিক্ষাগত মার্কশিট এবং সার্টিফিকেট',
    'te-IN': 'విద్యార్హత ధృవీకరణ పత్రాలు',
    'mr-IN': 'शैक्षणिक गुणपत्रिका आणि प्रमाणपत्रे',
    'ta-IN': 'கல்வி மதிப்பெண் சான்றிதழ்கள்',
    'gu-IN': 'શૈક્ષણિક માર્કશીટ અને પ્રમાણપત્રો',
    'kn-IN': 'ಶೈಕ್ಷಣಿಕ ಅಂಕಪಟ್ಟಿಗಳು ಮತ್ತು ಪ್ರಮಾಣಪತ್ರಗಳು',
    'ml-IN': 'വിദ്യാഭ്യാസ സർട്ടിഫിക്കറ്റുകൾ',
    'pa-IN': 'ਵਿੱਦਿਅਕ ਮਾਰਕਸ਼ੀਟਾਂ ਅਤੇ ਸਰਟੀਫਿਕੇਟ',
    'ur-IN': 'تعلیمی اسناد اور مارک شیٹ',
  },
  'Residence / Domicile Certificate': {
    'hi-IN': 'निवास प्रमाण पत्र / मूल निवास',
    'or-IN': 'ସ୍ଥାୟୀ ବାସିନ୍ଦା ପ୍ରମାଣପତ୍ର (ରେସିଡେନ୍ସ ସାର୍ଟିଫିକେଟ)',
    'bn-IN': 'স্থায়ী বাসিন্দা শংসাপত্র',
    'te-IN': 'నివాస ధృవీకరణ పత్రం',
    'mr-IN': 'अधिवास प्रमाणपत्र (Domicile)',
    'ta-IN': 'இருப்பிடச் சான்றிதழ்',
    'gu-IN': 'રહેઠાણનો પુરાવો / ડોમિસાઇલ',
    'kn-IN': 'ಸ್ಥಳೀಯ ನಿವಾಸಿ ಪ್ರಮಾಣಪತ್ರ',
    'ml-IN': 'സ്ഥിരതാമസ സർട്ടിഫിക്കറ്റ്',
    'pa-IN': 'ਰਿਹਾਇਸ਼ੀ ਸਰਟੀਫਿਕੇਟ',
    'ur-IN': 'رہائشی سرٹیفکیٹ',
  },
  'Disability Certificate': {
    'hi-IN': 'दिव्यांगता प्रमाण पत्र (UDID कार्ड)',
    'or-IN': 'ଭିନ୍ନକ୍ଷମ ପ୍ରମାଣପତ୍ର / UDID କାର୍ଡ଼ (୪୦% ବା ଅଧିକ)',
    'bn-IN': 'প্রতিবন্ধকতা শংসাপত্র (UDID)',
    'te-IN': 'దివ్యాంగుల ధృవీకరణ పత్రం (UDID)',
    'mr-IN': 'दिव्यांगत्व प्रमाणपत्र / UDID कार्ड',
    'ta-IN': 'மாற்றுத்திறனாளி சான்றிதழ் (UDID)',
    'gu-IN': 'દિવ્યાંગતા પ્રમાણપત્ર / UDID',
    'kn-IN': 'ವಿಕಲಾಂಗತೆ ಪ್ರಮಾಣಪತ್ರ / UDID',
    'ml-IN': 'ഭിന്നശേഷി സർട്ടിഫിക്കറ്റ്',
    'pa-IN': 'ਦਿਵਿਆਂਗਤਾ ਸਰਟੀਫਿਕੇਟ / UDID',
    'ur-IN': 'معذوری کا سرٹیفکیٹ (UDID)',
  },
};

/**
 * Translates a document title dynamically into the target language.
 */
export const translateDocumentName = (docName: string, langCode: string = 'en-IN'): string => {
  if (!docName || langCode === 'en-IN' || langCode === 'en') return docName;

  for (const [key, map] of Object.entries(DOCUMENT_GLOSSARY)) {
    if (docName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(docName.toLowerCase())) {
      if (map[langCode]) return map[langCode];
    }
  }

  return translateGlossaryPhrase(docName, langCode);
};

/**
 * Translates standard benefit descriptions dynamically into the target language.
 */
export const translateBenefit = (benefit: Benefit, langCode: string = 'en-IN'): Benefit => {
  if (langCode === 'en-IN' || langCode === 'en') return benefit;

  return {
    ...benefit,
    title: translateGlossaryPhrase(benefit.title, langCode),
    description: translateGlossaryPhrase(benefit.description, langCode),
    type: translateGlossaryPhrase(benefit.type, langCode) as any,
  };
};

import { SCHEME_TRANSLATIONS, MINISTRY_TRANSLATIONS, STATUS_TRANSLATIONS } from '../i18n/schemeGlossary';

/**
 * Translates a full Scheme model into the user's active language.
 */
export const translateSchemeContent = (scheme: Scheme, langCode: string = 'en-IN'): Scheme => {
  if (!scheme || langCode === 'en-IN' || langCode === 'en') return scheme;

  const sid = scheme.id || scheme.slug || '';
  const slug = scheme.slug || sid || '';
  const custom = SCHEME_TRANSLATIONS[sid]?.[langCode] || SCHEME_TRANSLATIONS[slug]?.[langCode] || {};

  const translatedDocs: DocumentRequirement[] = Array.isArray(scheme.documents)
    ? scheme.documents.map((d) => ({
        ...d,
        name: translateDocumentName(d.name, langCode),
        description: translateGlossaryPhrase(d.description, langCode),
      }))
    : [];

  const translatedBenefits: Benefit[] = Array.isArray(scheme.benefits)
    ? scheme.benefits.map((b) => translateBenefit(b, langCode))
    : [];

  const translatedSteps: ApplicationStep[] = Array.isArray(scheme.applicationSteps)
    ? scheme.applicationSteps.map((s) => ({
        ...s,
        title: translateGlossaryPhrase(s.title, langCode),
        description: translateGlossaryPhrase(s.description, langCode),
      }))
    : [];

  const rawMinistry = scheme.verification?.ministryOrAuthority || '';
  const rawDept = scheme.verification?.sourceDepartment || '';

  const translatedMinistry = MINISTRY_TRANSLATIONS[rawMinistry]?.[langCode] || translateGlossaryPhrase(rawMinistry, langCode);
  const translatedDept = MINISTRY_TRANSLATIONS[rawDept]?.[langCode] || translateGlossaryPhrase(rawDept, langCode);

  return {
    ...scheme,
    name: custom.name || translateGlossaryPhrase(scheme.name, langCode),
    shortName: custom.shortName || custom.name || translateGlossaryPhrase(scheme.shortName || scheme.name, langCode),
    tagline: custom.tagline || custom.shortDescription || translateGlossaryPhrase(scheme.tagline || '', langCode),
    shortDescription: custom.shortDescription || custom.tagline || translateGlossaryPhrase(scheme.shortDescription || '', langCode),
    detailedDescription: custom.detailedDescription || custom.shortDescription || custom.tagline || scheme.detailedDescription,
    category: scheme.category,
    level: scheme.level,
    verification: scheme.verification ? {
      ...scheme.verification,
      ministryOrAuthority: translatedMinistry,
      sourceDepartment: translatedDept,
      lastUpdated: translateGlossaryPhrase(scheme.verification.lastUpdated, langCode),
    } : scheme.verification,
    documents: translatedDocs,
    benefits: translatedBenefits,
    applicationSteps: translatedSteps,
  };
};

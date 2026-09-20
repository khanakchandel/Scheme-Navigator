import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Scheme } from '../../types';
import { api, API_BASE_URL } from '../../services/api';
import { getSavedProfile } from '../../services/storageService';
import { StatusPill } from '../common/StatusPill';
import { useTranslation } from '../../hooks/useTranslation';
import { useAppStore } from '../../store/appStore';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';
import {
  findBestVoice,
  transliterateIndicToDevanagari,
  prepareSpeechUtterance,
  convertOdiaNumbersToWords,
  transliterateOdiaToRoman,
  transliteratePunjabiToRoman,
  splitIntoSpeechChunks,
} from '../../hooks/useVoiceReader';
import { translateSchemeContent } from '../../utils/schemeTranslator';
import {
  Sparkles,
  Send,
  User,
  Bot,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Compass,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  UserCheck,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  matchedSchemes?: Scheme[];
  timestamp: string;
}

const INITIAL_GREETINGS: Record<string, string> = {
  'en-IN':
    'Hello! 👋 I am **Mitra** — your personal AI Welfare & Scheme Advisor.\n\nTell me about yourself — like your **Age**, **State**, **Occupation**, or what support you need (Scholarships, Farming subsidies, Mudra loans, Healthcare, Housing), and I will find verified government welfare schemes for you.',
  'hi-IN':
    'नमस्ते! 🙏 मैं आपका **मित्र** — सरकारी योजना सलाहकार हूँ।\n\nमुझे अपने बारे में बताएं — जैसे आपकी **आयु**, **राज्य**, **व्यवसाय**, या आप किस प्रकार की योजना ढूंढ रहे हैं (छात्रवृत्ति, किसान सहायता, बिजनेस लोन, स्वास्थ्य कार्ड, आवास), और मैं आपके लिए सत्यापित सरकारी योजनाओं में से सटीक जानकारी दूंगा।',
  'or-IN':
    'ନମସ୍କାର! 🙏 ମୁଁ ଆପଣଙ୍କର **ମିତ୍ର** — ସରକାରୀ ଯୋଜନା ପରାମର୍ଶଦାତା।\n\nମୋତେ ଆପଣଙ୍କ ବିଷୟରେ କୁହନ୍ତୁ — ଯେପରିକି ଆପଣଙ୍କର **ବୟସ**, **ରାଜ୍ୟ**, **ବୃତ୍ତି**, କିମ୍ବା ଆପଣ କେଉଁ ପ୍ରକାରର ଯୋଜନା ଖୋଜୁଛନ୍ତି (ଛାତ୍ରବୃତ୍ତି, କୃଷକ ସହାୟତା, ବ୍ୟବସାୟ ଋଣ, ସ୍ୱାସ୍ଥ୍ୟ କାର୍ଡ଼, ବାର୍ଦ୍ଧକ୍ୟ ପେନସନ), ଏବଂ ମୁଁ ସଠିକ୍ ସୂଚନା ଦେବି।',
  'bn-IN':
    'নমস্কার! 🙏 আমি আপনার **মিত্র** — সরকারি প্রকল্প উপদেষ্টা।\n\nআমাকে আপনার সম্পর্কে বলুন — যেমন আপনার **বয়স**, **রাজ্য**, **পেশা**, বা আপনার কী ধরনের সাহায্য প্রয়োজন (বৃত্তি, কৃষক অনুদান, ব্যবসা ঋণ, স্বাস্থ্য কার্ড, পেনশন), এবং আমি আপনার জন্য সঠিক সরকারি প্রকল্পের তথ্য দেব।',
  'te-IN':
    'నమస్కారం! 🙏 నేను మీ **మిత్ర** — ప్రభుత్వ పథకాల సలహాదారుని.\n\nమీ గురించి నాకు చెప్పండి — మీ **వయస్సు**, **రాష్ట్రం**, **వృత్తి**, లేదా మీకు ఎలాంటి సహాయం కావాలి (స్కాలర్‌షిప్‌లు, రైతు సబ్సిడీలు, వ్యాపార రుణాలు, ఆరోగ్య కార్డు, పెన్షన్), నేను మీకు సరైన ప్రభుత్వ పథకాలను తెలియజేస్తాను.',
  'mr-IN':
    'नमस्कार! 🙏 मी आपला **मित्र** — शासकीय योजना सल्लागार आहे.\n\nमला आपल्याबद्दल सांगा — जसे आपले **वय**, **राज्य**, **व्यवसाय**, किंवा आपल्याला कोणत्या मदतीची गरज आहे (शिष्यवृत्ती, शेतकरी अनुदान, व्यवसाय कर्ज, आरोग्य कार्ड, पेन्शन), आणि मी आपल्यासाठी योग्य योजनांची माहिती देईन.',
  'ta-IN':
    'வணக்கம்! 🙏 நான் உங்கள் **மித்ரா** — அரசு நலத்திட்ட ஆலோசகர்.\n\nஉங்களைப் பற்றி என்னிடம் கூறுங்கள் — உங்கள் **வயது**, **மாநிலம்**, **தொழில்**, அல்லது உங்களுக்கு என்ன உதவி தேவை (கல்வி உதவித்தொகை, விவசாய மானியம், வணிகக் கடன், மருத்துவ அட்டை, ஓய்வூதியம்), நான் தகுதியான அரசு திட்டங்களை உங்களுக்கு வழிகாட்டுவேன்.',
  'gu-IN':
    'નમસ્તે! 🙏 હું તમારો **મિત્ર** — સરકારી યોજના સલાહકાર છું.\n\nમને તમારા વિશે જણાવો — જેમ કે તમારી **ઉંમર**, **રાજ્ય**, **વ્યવસાય**, અથવા તમને કેવા પ્રકારની સહાયની જરૂર છે (શિષ્યવૃત્તિ, ખેડૂત સહાય, બિઝનેસ લોન, આરોગ્ય કાર્ડ, પેન્શન), અને હું તમને યોગ્ય સરકારી યોજનાઓની માહિતી આપીશ.',
  'kn-IN':
    'ನಮಸ್ಕಾರ! 🙏 ನಾನು ನಿಮ್ಮ **ಮಿತ್ರ** — ಸರ್ಕಾರಿ ಯೋಜನೆಗಳ ಸಲಹೆಗಾರ.\n\nನಿಮ್ಮ ಬಗ್ಗೆ ನನಗೆ ತಿಳಿಸಿ — ನಿಮ್ಮ **ವಯಸ್ಸು**, **ರಾಜ್ಯ**, **ಉದ್ಯೋಗ**, ಅಥವಾ ನಿಮಗೆ ಯಾವ ರೀತಿಯ ನೆರವು ಬೇಕು (ವಿದ್ಯಾರ್ಥಿವೇತನ, ರೈತ ಸಬ್ಸಿಡಿ, ವ್ಯಾಪಾರ ಸಾಲ, ಆರೋಗ್ಯ ಕಾರ್ಡ್, ಪಿಂಚಣಿ), ನಾನು ನಿಖರವಾದ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳನ್ನು ಸೂಚಿಸುತ್ತೇನೆ.',
  'ml-IN':
    'നമസ്കാരം! 🙏 ഞാൻ നിങ്ങളുടെ **മിത്ര** — സർക്കാർ ക്ഷേമപദ്ധതി ഉപദേശകൻ.\n\nനിങ്ങളെക്കുറിച്ച് എന്നോട് പറയൂ — നിങ്ങളുടെ **പ്രായം**, **സംസ്ഥാനം**, **തൊഴിൽ**, അല്ലെങ്കിൽ നിങ്ങൾക്ക് എന്ത് സഹായമാണ് വേണ്ടത് (സ്കോളർഷിപ്പ്, കർഷക ആനുകൂല്യങ്ങൾ, ബിസിനസ്സ് ലോൺ, ആരോഗ്യ കാർഡ്, പെൻഷൻ), ഞാൻ അനുയോജ്യമായ സർക്കാർ പദ്ധതികൾ നിർദ്ദേശിക്കാം.',
  'pa-IN':
    'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! 🙏 ਮੈਂ ਤੁਹਾਡਾ **ਮਿੱਤਰ** — ਸਰਕਾਰੀ ਸਕੀਮ ਸਲਾਹਕਾਰ ਹਾਂ।\n\nਮੈਨੂੰ ਆਪਣੇ ਬਾਰੇ ਦੱਸੋ — ਜਿਵੇਂ ਤੁਹਾਡੀ **ਉਮਰ**, **ਰਾਜ**, **ਕਿੱਤਾ**, ਜਾਂ ਤੁਹਾਨੂੰ ਕਿਸ ਤਰ੍ਹਾਂ ਦੀ ਮਦਦ ਚਾਹੀਦੀ ਹੈ (ਸਕਾਲਰਸ਼ਿਪ, ਕਿਸਾਨ ਸਬਸਿਡੀ, ਕਾਰੋਬਾਰੀ ਕਰਜ਼ਾ, ਸਿਹਤ ਕਾਰਡ, ਪੈਨਸ਼ਨ), ਅਤੇ ਮੈਂ ਤੁਹਾਨੂੰ ਸਹੀ ਸਰਕਾਰੀ ਸਕੀਮਾਂ ਦੀ ਜਾਣਕਾਰੀ ਦੇਵਾਂਗਾ।',
  'ur-IN':
    'آداب! 🙏 میں آپ کا **متر** — سرکاری اسکیم مشیر ہوں۔\n\nمجھے اپنے بارے میں بتائیں — جیسے آپ کی **عمر**، **ریاست**، **پیشہ**، یا آپ کو کس قسم کی مدد درکار ہے (اسکالرشپ، کسان سبسڈی، کاروباری قرض، ہیلتھ کارڈ، پنشن)، اور میں آپ کے لیے درست سرکاری اسکیموں کی رہنمائی کروں گا۔',
};

const RESET_MESSAGES: Record<string, string> = {
  'en-IN': 'Hello! Chat has been reset. How can Mitra AI help you discover welfare schemes today?',
  'hi-IN': 'नमस्ते! बातचीत रीसेट कर दी गई है। आज मैं आपकी कौन सी सरकारी योजना खोजने में मदद कर सकता हूँ?',
  'or-IN': 'ନମସ୍କାର! ବାର୍ତ୍ତାଳାପ ପୁନଃସ୍ଥାପିତ ହୋଇଛି। ଆଜି ମିତ୍ର ଆପଣଙ୍କୁ କେଉଁ ସରକାରୀ ଯୋଜନା ଖୋଜିବାରେ ସାହାଯ୍ୟ କରିପାରିବ?',
  'bn-IN': 'নমস্কার! কথোপকথন রিসেট করা হয়েছে। আজ মিত্র আপনাকে কোন সরকারি প্রকল্প খুঁজতে সাহায্য করতে পারে?',
  'te-IN': 'నమస్కారం! సంభాషణ రీసెట్ చేయబడింది. ఈ రోజు మిత్ర మీకు ఏ ప్రభుత్వ పథకం కనుగొనడంలో సహాయపడగలదు?',
  'mr-IN': 'नमस्कार! संभाषण रीसेट केले गेले आहे. आज मित्र आपल्याला कोणती शासकीय योजना शोधण्यात मदत करू शकतो?',
  'ta-IN': 'வணக்கம்! உரையாடல் மீட்டமைக்கப்பட்டது. இன்று மித்ரா உங்களுக்கு எந்த அரசுத் திட்டத்தைக் கண்டறிய உதவ முடியும்?',
  'gu-IN': 'નમસ્તે! વાતચીત રીસેટ કરવામાં આવી છે. આજે મિત્ર તમને કઈ સરકારી યોજના શોધવામાં મદદ કરી શકે?',
  'kn-IN': 'ನಮಸ್ಕಾರ! ಸಂಭಾಷಣೆಯನ್ನು ಮರುಹೊಂದಿಸಲಾಗಿದೆ. ಇಂದು ಮಿತ್ರ ನಿಮಗೆ ಯಾವ ಸರ್ಕಾರಿ ಯೋಜನೆಯನ್ನು ಹುಡುಕಲು ಸಹಾಯ ಮಾಡಬಹುದು?',
  'ml-IN': 'നമസ്കാരം! സംഭാഷണം പുനഃസജ്ജമാക്കി. ഇന്ന് മിത്രയ്ക്ക് ഏത് സർക്കാർ പദ്ധതി കണ്ടെത്താൻ നിങ്ങളെ സഹായിക്കാനാകും?',
  'pa-IN': 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਗੱਲਬਾਤ ਰੀਸੈੱਟ ਕਰ ਦਿੱਤੀ ਗਈ ਹੈ। ਅੱਜ ਮਿੱਤਰ ਤੁਹਾਨੂੰ ਕਿਹੜੀ ਸਰਕਾਰੀ ਸਕੀਮ ਲੱਭਣ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹੈ?',
  'ur-IN': 'آداب! بات چیت دوبارہ ترتیب دی گئی ہے۔ آج متر آپ کو کون سی سرکاری اسکیم تلاش کرنے میں مدد کر سکتا ہے؟',
};

const FALLBACK_MESSAGES: Record<string, string> = {
  'en-IN': 'I am analyzing your request. You can also explore verified schemes directly in the directory or complete the eligibility survey.',
  'hi-IN': 'मैं आपके अनुरोध का विश्लेषण कर रहा हूँ। आप सीधे योजनाओं की सूची भी देख सकते हैं या पात्रता फॉर्म भर सकते हैं।',
  'or-IN': 'ମୁଁ ଆପଣଙ୍କ ଅନୁରୋଧର ବିଶ୍ଳେଷଣ କରୁଛି। ଆପଣ ସିଧାସଳଖ ଯୋଜନା ତାଲିକା ମଧ୍ୟ ଦେଖିପାରିବେ କିମ୍ବା ଯୋଗ୍ୟତା ଯାଞ୍ଚ କରିପାରିବେ।',
  'bn-IN': 'আমি আপনার অনুরোধ বিশ্লেষণ করছি। আপনি সরাসরি প্রকল্পের তালিকাও দেখতে পারেন বা যোগ্যতা সমীক্ষা সম্পন্ন করতে পারেন।',
  'te-IN': 'నేను మీ అభ్యర్థనను విశ్లేషిస్తున్నాను. మీరు నేరుగా పథకాల జాబితాను కూడా చూడవచ్చు లేదా అర్హత సర్వేను పూర్తి చేయవచ్చు.',
  'mr-IN': 'मी आपल्या विनंतीचे विश्लेषण करत आहे. आपण थेट योजनांची यादी देखील पाहू शकता किंवा पात्रता सर्वेक्षण पूर्ण करू शकता.',
  'ta-IN': 'நான் உங்கள் கோரிக்கையை பகுப்பாய்வு செய்கிறேன். நீங்கள் நேரடியாக திட்டங்களின் பட்டியலையும் பார்க்கலாம் அல்லது தகுதி ஆய்வை முடிக்கலாம்.',
  'gu-IN': 'હું તમારી વિનંતીનું વિશ્લેષણ કરી રહ્યો છું. તમે સીધી યોજનાઓની સૂચિ પણ જોઈ શકો છો અથવા પાત્રતા સર્વેક્ષણ પૂર્ણ કરી શકો છો.',
  'kn-IN': 'ನಾನು ನಿಮ್ಮ ವಿನಂತಿಯನ್ನು ವಿಶ್ಲೇಷಿಸುತ್ತಿದ್ದೇನೆ. ನೀವು ನೇರವಾಗಿ ಯೋಜನೆಗಳ ಪಟ್ಟಿಯನ್ನು ಸಹ ವೀಕ್ಷಿಸಬಹುದು ಅಥವಾ ಅರ್ಹತಾ ಸಮೀಕ್ಷೆಯನ್ನು ಪೂರ್ಣಗೊಳಿಸಬಹುದು.',
  'ml-IN': 'ഞാൻ നിങ്ങളുടെ അഭ്യർത്ഥന വിശകലനം ചെയ്യുകയാണ്. നിങ്ങൾക്ക് നേരിട്ട് പദ്ധതികളുടെ പട്ടിക കാണുകയോ യോഗ്യതാ സർവേ പൂർത്തിയാക്കുകയോ ചെയ്യാം.',
  'pa-IN': 'ਮੈਂ ਤੁਹਾਡੀ ਬੇਨਤੀ ਦਾ ਵਿਸ਼ਲੇਸ਼ਣ ਕਰ ਰਿਹਾ ਹਾਂ। ਤੁਸੀਂ ਸਿੱਧਾ ਸਕੀਮਾਂ ਦੀ ਸੂਚੀ ਵੀ ਵੇਖ ਸਕਦੇ ਹੋ ਜਾਂ ਯੋਗਤਾ ਸਰਵੇਖਣ ਪੂਰਾ ਕਰ ਸਕਦੇ ਹੋ।',
  'ur-IN': 'میں آپ کی درخواست کا تجزیہ کر رہا ہوں۔ آپ براہ راست اسکیموں کی فہرست بھی دیکھ سکتے ہیں یا اہلیت کا سروے مکمل کر سکتے ہیں۔',
};

const getLocalizedText = (dict: Record<string, string>, lang: string): string => {
  if (!lang) return dict['en-IN'];
  if (dict[lang]) return dict[lang];
  const prefix = lang.split('-')[0].toLowerCase();
  const foundKey = Object.keys(dict).find((k) => k.toLowerCase().startsWith(prefix));
  return (foundKey && dict[foundKey]) || dict['en-IN'];
};

const getChatPromptsByLang = (langCode: string) => {
  if (langCode.startsWith('or')) {
    return [
      { label: '🌾 କୃଷକ ଓ କୃଷି ଯୋଜନା', query: 'ମୋତେ ଚାଷୀ ଏବଂ କୃଷି ପାଇଁ ସରକାରୀ ସବସିଡି ଏବଂ ଯୋଜନା ବିଷୟରେ କୁହନ୍ତୁ' },
      { label: '🎓 ଛାତ୍ରବୃତ୍ତି ଓ ଶିକ୍ଷା ସହାୟତା', query: 'କଲେଜ ଛାତ୍ରଛାତ୍ରୀଙ୍କ ପାଇଁ କେଉଁ ସ୍କଲାରସିପ୍ ଏବଂ ଶିକ୍ଷା ସହାୟତା ଉପଲବ୍ଧ?' },
      { label: '💼 ମୁଦ୍ରା ଓ ବ୍ୟବସାୟ ଋଣ', query: 'ନୂତନ ବ୍ୟବସାୟ କିମ୍ବା ଦୋକାନ ପାଇଁ କମ୍ ସୁଧ ସରକାରୀ ଋଣ ଯୋଜନା କ’ଣ?' },
      { label: '🏥 ବିଜୁ ସ୍ୱାସ୍ଥ୍ୟ ଓ ଆୟୁଷ୍ମାନ ଭାରତ', query: 'ଆୟୁଷ୍ମାନ ଭାରତ କାର୍ଡ଼ ଏବଂ ମାଗଣା ଡାକ୍ତରଖାନା ଚିକିତ୍ସା ପାତ୍ରତା କ’ଣ?' },
      { label: '👩 ମହିଳା ଓ ଶିଶୁ କଲ୍ୟାଣ', query: 'ମହିଳା ଏବଂ ଝିଅମାନଙ୍କ ପାଇଁ ସରକାରୀ କଲ୍ୟାଣ ଏବଂ ସଞ୍ଚୟ ଯୋଜନା କ’ଣ?' },
      { label: '👵 ବାର୍ଦ୍ଧକ୍ୟ ପେନସନ ଯୋଜନା', query: 'ବରିଷ୍ଠ ନାଗରିକ ଏବଂ ବାର୍ଦ୍ଧକ୍ୟ ପେନସନ ଯୋଜନା ପାତ୍ରତା' },
    ];
  }
  if (langCode.startsWith('hi')) {
    return [
      { label: '🌾 किसान व कृषि योजनाएं', query: 'मुझे किसान और खेती के लिए सरकारी सब्सिडी और योजनाएं बताइए' },
      { label: '🎓 छात्रवृत्ति व शिक्षा सहायता', query: 'कॉलेज और 12वीं के छात्रों के लिए कौन सी सरकारी स्कॉलरशिप उपलब्ध हैं?' },
      { label: '💼 मुद्रा व बिजनेस लोन', query: 'नए बिजनेस या दुकान के लिए कम ब्याज वाली सरकारी लोन योजनाएं कौन सी हैं?' },
      { label: '🏥 आयुष्मान भारत स्वास्थ्य कार्ड', query: 'आयुष्मान भारत कार्ड और 5 लाख तक मुफ्त इलाज की पात्रता क्या है?' },
      { label: '👩 महिला एवं बाल कल्याण', query: 'महिलाओं और बेटियों के लिए सरकारी कल्याण और बचत योजनाएं कौन सी हैं?' },
      { label: '👵 वरिष्ठ नागरिक पेंशन', query: 'वृद्धावस्था और वरिष्ठ नागरिक पेंशन योजना की पात्रता क्या है?' },
    ];
  }
  if (langCode.startsWith('bn')) {
    return [
      { label: '🌾 কৃষক ও কৃষি প্রকল্প', query: 'কৃষকদের জন্য সরকারি অনুদান ও প্রকল্পের তথ্য দিন' },
      { label: '🎓 স্কলারশিপ ও শিক্ষা সাহায্য', query: 'ছাত্রছাত্রীদের জন্য কোন কোন সরকারি স্কলারশিপ রয়েছে?' },
      { label: '💼 মুদ্রা ও ব্যবসা ঋণ', query: 'নতুন ব্যবসা শুরুর জন্য স্বল্প সুদের সরকারি ঋণ প্রকল্প' },
      { label: '🏥 স্বাস্থ্যসাথী ও আয়ুষ্মান ভারত', query: 'আয়ুষ্মান ভারত কার্ড ও বিনামূল্যে চিকিৎসার যোগ্যতা' },
      { label: '👩 নারী ও শিশু কল্যাণ', query: 'মহিলা ও কন্যাদের জন্য সরকারি সঞ্চয় ও সাহায্য প্রকল্প' },
      { label: '👵 বার্ধক্য পেনশন প্রকল্প', query: 'প্রবীণ নাগরিকদের জন্য বার্ধক্য পেনশন প্রকল্পের যোগ্যতা' },
    ];
  }
  if (langCode.startsWith('te')) {
    return [
      { label: '🌾 రైతు & వ్యవసాయ పథకాలు', query: 'రైతుల కోసం ప్రభుత్వ రాయితీలు మరియు పీఎం కిసాన్ వివరాలు చెప్పండి' },
      { label: '🎓 స్కాలర్‌షిప్‌లు & విద్యా సహాయం', query: 'కళాశాల విద్యార్థుల కోసం ఏ ప్రభుత్వ స్కాలర్‌షిప్‌లు అందుబాటులో ఉన్నాయి?' },
      { label: '💼 ముద్రా & వ్యాపార రుణాలు', query: 'కొత్త వ్యాపారం లేదా దుకాణం కోసం తక్కువ వడ్డీ ప్రభుత్వ రుణాలు ఏమిటి?' },
      { label: '🏥 ఆయుష్మాన్ భారత్ హెల్త్ కార్డు', query: 'ఆయుష్మాన్ భారత్ కార్డు అర్హత మరియు ఉచిత చికిత్స వివరాలు ఏమిటి?' },
      { label: '👩 మహిళా & శిశు సంక్షేమం', query: 'మహిళలు మరియు కుమార్తెల కోసం ప్రభుత్వ పొదుపు మరియు సంక్షేమ పథకాలు' },
      { label: '👵 వృద్ధాప్య పెన్షన్ పథకాలు', query: 'వృద్ధాప్య మరియు సీనియర్ సిటిజన్ పెన్షన్ పథకం అర్హతలు' },
    ];
  }
  if (langCode.startsWith('mr')) {
    return [
      { label: '🌾 शेतकरी व कृषी योजना', query: 'शेतकऱ्यांसाठी सरकारी अनुदान आणि पीएम किसान योजनेची माहिती द्या' },
      { label: '🎓 शिष्यवृत्ती व शिक्षण सहाय्य', query: 'महाविद्यालयीन विद्यार्थ्यांसाठी कोणत्या सरकारी शिष्यवृत्ती उपलब्ध आहेत?' },
      { label: '💼 मुद्रा व व्यवसाय कर्ज', query: 'नवीन व्यवसाय किंवा दुकानासाठी कमी व्याजाची सरकारी कर्ज योजना' },
      { label: '🏥 आयुष्मान भारत आरोग्य कार्ड', query: 'आयुष्मान भारत कार्ड आणि ५ लाख मोफत उपचारांची पात्रता काय आहे?' },
      { label: '👩 महिला व बाल कल्याण', query: 'महिला आणि मुलींसाठी शासकीय बचत व कल्याणकारी योजना' },
      { label: '👵 ज्येष्ठ नागरिक पेन्शन', query: 'वृद्धापकाळ आणि ज्येष्ठ नागरिक पेन्शन योजनेची पात्रता' },
    ];
  }
  if (langCode.startsWith('ta')) {
    return [
      { label: '🌾 விவசாயம் & வேளாண் திட்டங்கள்', query: 'விவசாயிகளுக்கான அரசு மானியங்கள் மற்றும் பிஎம் கிசான் பற்றி சொல்லுங்கள்' },
      { label: '🎓 கல்வி உதவித்தொகை', query: 'கல்லூரி மாணவர்களுக்கு என்ன அரசு உதவித்தொகை கிடைக்கிறது?' },
      { label: '💼 முத்ரா & தொழில் கடன்கள்', query: 'புதிய தொழில் தொடங்க குறைந்த வட்டி அரசு கடன் திட்டங்கள் எவை?' },
      { label: '🏥 ஆயுஷ்மான் பாரத் அட்டை', query: 'ஆயுஷ்மான் பாரத் அட்டை மற்றும் இலவச மருத்துவ சிகிச்சை தகுதி என்ன?' },
      { label: '👩 பெண்கள் & குழந்தைகள் நலம்', query: 'பெண்கள் மற்றும் மகள்களுக்கான அரசு சேமிப்பு மற்றும் நலத்திட்டங்கள்' },
      { label: '👵 முதியோர் ஓய்வூதியத் திட்டம்', query: 'முதியோர் மற்றும் மூத்த குடிமக்கள் ஓய்வூதிய திட்ட தகுதிகள்' },
    ];
  }
  return [
    { label: '🌾 Kisan & Agriculture', query: 'Tell me about government farming subsidies and PM-Kisan benefits' },
    { label: '🎓 Student Scholarships', query: 'What scholarships and educational financial assistance are available for college students?' },
    { label: '💼 Business & Mudra Loans', query: 'What are low-interest government loan schemes for starting a shop or new business?' },
    { label: '🏥 Ayushman Bharat Health', query: 'How can I get an Ayushman Bharat golden card for 5 lakh free hospitalization?' },
    { label: '👩 Women & Child Welfare', query: 'What government savings and financial welfare schemes exist for women and daughters?' },
    { label: '👵 Senior Citizen Pensions', query: 'Eligibility and benefits of old age and senior citizen pension schemes' },
  ];
};

let _msgCounter = 0;
const nextMsgId = (prefix = 'msg') => `${prefix}-${Date.now()}-${++_msgCounter}`;

// Helper to strip Markdown formatting for clean voice speech synthesis
const cleanTextForSpeech = (rawText: string): string => {
  return rawText
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[-*•]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[\n\r]+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
};

// Helper to render Markdown formatting nicely
const FormattedMessage: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');

  const formatInline = (str: string): React.ReactNode => {
    const parts = str.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} className="font-bold text-inherit">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={idx} className="italic opacity-90">
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-2 text-xs sm:text-sm leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="font-bold text-sm sm:text-base text-inherit mt-2 mb-1">
              {formatInline(trimmed.replace(/^###\s+/, ''))}
            </h4>
          );
        }

        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={idx} className="font-extrabold text-base text-inherit mt-2.5 mb-1">
              {formatInline(trimmed.replace(/^##\s+/, ''))}
            </h3>
          );
        }

        if (/^[-*•]\s+/.test(trimmed)) {
          const content = trimmed.replace(/^[-*•]\s+/, '');
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 py-0.5">
              <span className="text-teal-600 font-bold shrink-0 mt-0.5">•</span>
              <span className="flex-1">{formatInline(content)}</span>
            </div>
          );
        }

        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 py-0.5">
              <span className="text-teal-700 font-bold shrink-0 text-xs mt-0.5">{numMatch[1]}.</span>
              <span className="flex-1">{formatInline(numMatch[2])}</span>
            </div>
          );
        }

        return (
          <p key={idx} className="leading-relaxed">
            {formatInline(line)}
          </p>
        );
      })}
    </div>
  );
};

export const SchemeAdvisorChat: React.FC = () => {
  const { t, langCode } = useTranslation();
  const { selectedLanguage } = useAppStore();
  const location = useLocation();

  const isHindi = langCode.startsWith('hi');
  const isOdia = langCode.startsWith('or');
  const isPunjabi = langCode.startsWith('pa');
  const activeSpeechLang = selectedLanguage?.speechCode || selectedLanguage?.code || langCode || (isOdia ? 'or-IN' : isPunjabi ? 'pa-IN' : isHindi ? 'hi-IN' : 'en-IN');

  const incomingInitialQuery = ((location.state as any)?.initialQuery as string | undefined)?.trim();

  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const list: ChatMessage[] = [
      {
        id: 'msg-init-1',
        sender: 'assistant',
        text: getLocalizedText(INITIAL_GREETINGS, activeSpeechLang),
        timestamp: 'Just now',
      },
    ];
    if (incomingInitialQuery) {
      list.push({
        id: nextMsgId('msg-user'),
        sender: 'user',
        text: incomingInitialQuery,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    }
    return list;
  });
  const [isTyping, setIsTyping] = useState<boolean>(() => Boolean(incomingInitialQuery));
  // Auto-speak is OFF by default so user is never interrupted
  const [isAutoSpeak, setIsAutoSpeak] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isSpeechPaused, setIsSpeechPaused] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const initialSentRef = useRef(false);
  const messagesRef = useRef<ChatMessage[]>(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const userProfile = getSavedProfile();
  const chatAudioRef = useRef<HTMLAudioElement | null>(null);
  const chatChunksRef = useRef<string[]>([]);
  const chatChunkIndexRef = useRef<number>(0);
  const chatSpeakingMsgIdRef = useRef<string | null>(null);
  const chatActiveUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const playChatChunkRef = useRef<(index: number, msgId: string, isFallbackRetry?: boolean) => void>(() => {});

  // Listen for speech synthesis voices loaded
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        window.speechSynthesis.getVoices();
      };
      updateVoices();
      window.speechSynthesis.addEventListener('voiceschanged', updateVoices);
      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', updateVoices);
      };
    }
  }, []);

  // Chrome 15-second speech synthesis cutoff prevention heartbeat
  useEffect(() => {
    if (!speakingMessageId || isSpeechPaused) return;

    const heartbeat = setInterval(() => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }
    }, 8000);

    return () => clearInterval(heartbeat);
  }, [speakingMessageId, isSpeechPaused]);

  // Sync initial message with language change if user hasn't chatted yet
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id.startsWith('msg-init')) {
        return [
          {
            id: 'msg-init-1',
            sender: 'assistant',
            text: getLocalizedText(INITIAL_GREETINGS, activeSpeechLang),
            timestamp: 'Just now',
          },
        ];
      }
      return prev;
    });
  }, [activeSpeechLang]);

  // Voice Input (STT) Hook
  const {
    isListening,
    transcript,
    interimTranscript,
    error: voiceError,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceRecognition({
    language: activeSpeechLang,
    continuous: true,
    interimResults: true,
    onResult: (finalText) => {
      setInputQuery(finalText);
    },
  });

  // Keep inputQuery synced with voice transcript
  useEffect(() => {
    if (transcript) {
      setInputQuery(transcript);
    }
  }, [transcript]);

  // Voice Talk / TTS Controller
  const stopSpeech = useCallback(() => {
    chatSpeakingMsgIdRef.current = null;
    chatChunksRef.current = [];
    chatChunkIndexRef.current = 0;
    chatActiveUtteranceRef.current = null;

    if (chatAudioRef.current) {
      chatAudioRef.current.pause();
      chatAudioRef.current.src = '';
      chatAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        console.warn('SpeechSynthesis cancel error:', e);
      }
    }
    setSpeakingMessageId(null);
    setIsSpeechPaused(false);
  }, []);

  const pauseSpeech = useCallback(() => {
    setIsSpeechPaused(true);
    if (chatAudioRef.current && !chatAudioRef.current.paused) {
      chatAudioRef.current.pause();
      return;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.pause();
      } catch (e) {
        console.warn('SpeechSynthesis pause error:', e);
      }
    }
  }, []);

  const resumeSpeech = useCallback(() => {
    setIsSpeechPaused(false);
    if (chatAudioRef.current && chatAudioRef.current.paused) {
      chatAudioRef.current.play().catch(console.warn);
      return;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.resume();
      } catch (e) {
        console.warn('SpeechSynthesis resume error:', e);
      }
    }
  }, []);

  const speakChatBrowserChunk = useCallback(
    (index: number, msgId: string, isFallbackRetry: boolean = false) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      const chunks = chatChunksRef.current;
      if (chatSpeakingMsgIdRef.current !== msgId || index >= chunks.length) return;

      chatChunkIndexRef.current = index;
      const text = chunks[index];

      // Resume if speech engine was paused
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const voices = window.speechSynthesis.getVoices();
      let matchedVoice: SpeechSynthesisVoice | null = null;
      let textToPronounce = '';
      let speechLang = 'en-IN';

      if (isFallbackRetry) {
        matchedVoice =
          voices.find((v) => {
            const vl = v.lang.toLowerCase().replace('_', '-');
            const vn = v.name.toLowerCase();
            return (
              vl === 'en-in' ||
              (vl.startsWith('en') &&
                (vn.includes('india') ||
                  vn.includes('heera') ||
                  vn.includes('ravi') ||
                  vn.includes('neerja') ||
                  vn.includes('prabhat')))
            );
          }) ||
          voices.find((v) => v.lang.toLowerCase().startsWith('en')) ||
          null;

        const langPrefix = activeSpeechLang.toLowerCase().split('-')[0];
        if (langPrefix === 'or') {
          textToPronounce = transliterateOdiaToRoman(convertOdiaNumbersToWords(text));
          speechLang = 'en-IN';
        } else if (langPrefix === 'pa') {
          textToPronounce = transliteratePunjabiToRoman(text);
          speechLang = 'en-IN';
        } else {
          textToPronounce = text;
          speechLang = 'en-IN';
        }
      } else {
        matchedVoice = findBestVoice(voices, activeSpeechLang);
        const prep = prepareSpeechUtterance(text, activeSpeechLang, matchedVoice);
        textToPronounce = prep.textToPronounce;
        speechLang = prep.speechLang;
      }

      const utterance = new SpeechSynthesisUtterance(textToPronounce);
      utterance.lang = speechLang;
      utterance.rate = speechRate;
      utterance.pitch = 1.0;

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      chatActiveUtteranceRef.current = utterance;

      utterance.onstart = () => {
        setSpeakingMessageId(msgId);
        setIsSpeechPaused(false);
      };

      utterance.onend = () => {
        chatActiveUtteranceRef.current = null;
        if (chatSpeakingMsgIdRef.current === msgId && chatChunkIndexRef.current === index) {
          playChatChunkRef.current(index + 1, msgId, false);
        }
      };

      utterance.onerror = (e: any) => {
        chatActiveUtteranceRef.current = null;
        if (e?.error === 'canceled' || e?.error === 'interrupted') {
          return;
        }
        console.warn('Chat SpeechSynthesis chunk error:', e);
        if (chatSpeakingMsgIdRef.current === msgId && chatChunkIndexRef.current === index) {
          if (!isFallbackRetry) {
            speakChatBrowserChunk(index, msgId, true);
            return;
          }
          playChatChunkRef.current(index + 1, msgId, false);
        }
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('SpeechSynthesis speak error:', e);
        if (!isFallbackRetry && chatSpeakingMsgIdRef.current === msgId && chatChunkIndexRef.current === index) {
          speakChatBrowserChunk(index, msgId, true);
        }
      }
    },
    [activeSpeechLang, speechRate]
  );

  const playChatChunk = useCallback(
    (index: number, msgId: string, isFallbackRetry: boolean = false) => {
      const chunks = chatChunksRef.current;

      if (chatSpeakingMsgIdRef.current !== msgId || index >= chunks.length) {
        chatSpeakingMsgIdRef.current = null;
        chatChunksRef.current = [];
        chatChunkIndexRef.current = 0;
        chatActiveUtteranceRef.current = null;
        if (chatAudioRef.current) {
          chatAudioRef.current.pause();
          chatAudioRef.current = null;
        }
        setSpeakingMessageId(null);
        setIsSpeechPaused(false);
        return;
      }

      chatChunkIndexRef.current = index;
      const text = chunks[index];

      // Stop previous audio
      if (chatAudioRef.current) {
        chatAudioRef.current.pause();
        chatAudioRef.current.src = '';
        chatAudioRef.current = null;
      }

      // ── TIER 1: HIGH-FIDELITY NEURAL AUDIO (AUTHENTIC ODIA / INDIC ACCENT) ────
      if (!isFallbackRetry && API_BASE_URL) {
        try {

          const ttsUrl = `${API_BASE_URL}/api/assistant/tts/?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(activeSpeechLang)}&rate=${speechRate}`;
          const audio = new Audio(ttsUrl);
          chatAudioRef.current = audio;

          let fallbackTriggered = false;
          let loadTimeout: any = null;

          const triggerFallback = () => {
            if (fallbackTriggered) return;
            fallbackTriggered = true;
            if (loadTimeout) clearTimeout(loadTimeout);
            if (chatAudioRef.current === audio) {
              audio.pause();
              audio.src = '';
              chatAudioRef.current = null;
            }
            if (chatSpeakingMsgIdRef.current === msgId && chatChunkIndexRef.current === index) {
              speakChatBrowserChunk(index, msgId, false);
            }
          };

          // 8-second safety timeout: give high-fidelity neural audio adequate time to buffer on fresh requests
          loadTimeout = setTimeout(() => {
            if (audio.paused && chatAudioRef.current === audio) {
              console.warn(`Chat audio loading timed out for chunk ${index}, triggering instant browser fallback`);
              triggerFallback();
            }
          }, 8000);

          // Pre-fetch next chunk in background for gapless playback
          if (index + 1 < chunks.length) {
            const nextText = chunks[index + 1];
            const nextUrl = `${API_BASE_URL}/api/assistant/tts/?text=${encodeURIComponent(nextText)}&lang=${encodeURIComponent(activeSpeechLang)}&rate=${speechRate}`;
            const prefetch = new Audio();
            prefetch.src = nextUrl;
            prefetch.preload = 'auto';
          }

          audio.onplay = () => {
            if (loadTimeout) clearTimeout(loadTimeout);
            setSpeakingMessageId(msgId);
            setIsSpeechPaused(false);
          };

          audio.onended = () => {
            if (loadTimeout) clearTimeout(loadTimeout);
            chatAudioRef.current = null;
            if (chatSpeakingMsgIdRef.current === msgId && chatChunkIndexRef.current === index) {
              playChatChunk(index + 1, msgId, false);
            }
          };

          audio.onerror = (err) => {
            if (loadTimeout) clearTimeout(loadTimeout);
            console.warn('Chat neural audio stream error, falling back to local speech synthesis for chunk', index, err);
            triggerFallback();
          };

          audio.play().catch((playErr) => {
            if (loadTimeout) clearTimeout(loadTimeout);
            console.warn('Chat neural audio playback failed, falling back to speech synthesis:', playErr);
            triggerFallback();
          });
          return;
        } catch (e) {
          console.warn('Chat neural audio init error:', e);
        }
      }

      // ── TIER 2: LOCAL BROWSER SPEECH SYNTHESIS FALLBACK ─────────────────────
      speakChatBrowserChunk(index, msgId, isFallbackRetry);
    },
    [activeSpeechLang, speechRate, speakChatBrowserChunk]
  );

  useEffect(() => {
    playChatChunkRef.current = playChatChunk;
  }, [playChatChunk]);

  const speakText = useCallback(
    (msgId: string, textToSpeak: string) => {
      stopSpeech();

      const cleaned = cleanTextForSpeech(textToSpeak);
      if (!cleaned) return;

      const chunks = splitIntoSpeechChunks(cleaned);
      if (chunks.length === 0) return;

      chatChunksRef.current = chunks;
      chatChunkIndexRef.current = 0;
      chatSpeakingMsgIdRef.current = msgId;
      setSpeakingMessageId(msgId);
      setIsSpeechPaused(false);

      playChatChunk(0, msgId, false);
    },
    [stopSpeech, playChatChunk]
  );

  const handleCopyText = (msgId: string, text: string) => {
    const textToCopy = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .trim();
    navigator.clipboard.writeText(textToCopy);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  // Stop speech on unmount
  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, [stopSpeech]);

  const scrollToBottom = () => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleClearChat = () => {
    stopSpeech();
    setMessages([
      {
        id: nextMsgId('msg-init'),
        sender: 'assistant',
        text: getLocalizedText(RESET_MESSAGES, activeSpeechLang),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const executeAIQuery = async (queryText: string) => {
    const q = queryText.trim();
    if (!q) return;

    if (isListening) {
      stopListening();
    }
    stopSpeech();
    resetTranscript();
    setIsTyping(true);

    try {
      const currentList = messagesRef.current;
      const history = currentList.slice(-10).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      const profile = getSavedProfile();
      const response = await api.askAI(q, history, profile, activeSpeechLang);

      const matchedSchemes =
        response.referencedSchemes && response.referencedSchemes.length > 0
          ? response.referencedSchemes
          : undefined;

      const botMsgId = nextMsgId('msg-bot');
      const botMsg: ChatMessage = {
        id: botMsgId,
        sender: 'assistant',
        text: response.answer,
        matchedSchemes,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);

      // Only speak if user explicitly enabled auto-speak
      if (isAutoSpeak) {
        setTimeout(() => {
          speakText(botMsgId, response.answer);
        }, 300);
      }
    } catch {
      const fallbackId = nextMsgId('msg-bot-fallback');
      const fallbackText = getLocalizedText(FALLBACK_MESSAGES, activeSpeechLang);

      const botMsg: ChatMessage = {
        id: fallbackId,
        sender: 'assistant',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);

      if (isAutoSpeak) {
        setTimeout(() => {
          speakText(fallbackId, fallbackText);
        }, 300);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = (queryText?: string) => {
    const q = (queryText || inputQuery).trim();
    if (!q || isTyping) return;

    const userMsg: ChatMessage = {
      id: nextMsgId('msg-user'),
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    executeAIQuery(q);
  };

  // Consume initialQuery from navigation state (e.g. from popup search)
  useEffect(() => {
    const initQuery = (location.state as any)?.initialQuery;
    if (initQuery && typeof initQuery === 'string' && initQuery.trim() && !initialSentRef.current) {
      initialSentRef.current = true;
      try {
        window.history.replaceState({}, document.title);
      } catch {
        // ignore
      }
      executeAIQuery(initQuery.trim());
    }
  }, [location.state]);

  const promptCategories = getChatPromptsByLang(langCode);

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-950 to-slate-950 text-white rounded-3xl p-5 sm:p-7 border border-teal-800/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-800/80 text-emerald-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {isOdia
                ? 'ମିତ୍ର AI — ସ୍ମାର୍ଟ ଯୋଜନା ପରାମର୍ଶଦାତା'
                : isHindi
                ? 'मित्र AI — स्मार्ट योजना सलाहकार'
                : 'Mitra AI — Smart Welfare Advisor'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            {isOdia ? 'ମିତ୍ର AI' : isHindi ? 'मित्र AI' : 'Mitra AI — Scheme Advisor'}
          </h2>
          <p className="text-xs sm:text-sm text-teal-100/80 max-w-xl leading-relaxed">
            {isOdia
              ? 'ଆପଣଙ୍କର ବ୍ୟକ୍ତିଗତ AI ସାଥୀ ଯିଏ ସରକାରୀ ଯୋଜନାରୁ ଆପଣଙ୍କ ଭାଷାରେ ତତକ୍ଷଣାତ ପରାମର୍ଶ ଦେଇଥାଏ।'
              : isPunjabi
              ? 'ਤੁਹਾਡਾ ਨਿੱਜੀ AI ਮਿੱਤਰ ਜੋ ਸਰਕਾਰੀ ਸਕੀਮਾਂ ਦੇ ਪੂਰੇ ਡਾਟਾਬੇਸ ਤੋਂ ਤੁਹਾਡੀ ਭਾਸ਼ਾ ਵਿੱਚ ਸਹੀ ਸਲਾਹ ਦਿੰਦਾ ਹੈ।'
              : isHindi
              ? 'आपका व्यक्तिगत AI मित्र जो सरकारी योजनाओं के पूरे डेटाबेस से आपकी भाषा में सटीक सलाह देता है।'
              : 'Your personal AI companion that provides instant eligibility insights across verified government welfare schemes.'}
          </p>
        </div>

        {/* Header Right: Verified count & Audio speed */}
        <div className="flex flex-wrap md:flex-col items-center md:items-end gap-2.5 shrink-0">
          <div className="p-2.5 rounded-2xl bg-teal-900/60 border border-teal-700/60 text-xs text-emerald-300 flex items-center gap-2 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold text-xs">
              {isOdia ? '୩,୮୬୬ ଯୋଜନା ସତ୍ୟାପିତ' : isPunjabi ? '3,866 ਪ੍ਰਮਾਣਿਤ ਸਕੀਮਾਂ' : isHindi ? '3,866 सत्यापित योजनाएं' : '3,866 verified schemes'}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/80 border border-teal-700/50 rounded-2xl px-3 py-1 text-xs text-slate-200">
            <button
              type="button"
              onClick={() => {
                if (isAutoSpeak) {
                  stopSpeech();
                }
                setIsAutoSpeak(!isAutoSpeak);
              }}
              className={`flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                isAutoSpeak ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Auto-speak incoming responses"
            >
              {isAutoSpeak ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{isOdia ? 'ସ୍ୱୟଂଚାଳିତ ସ୍ୱର' : isPunjabi ? 'ਆਟੋ-ਵਾਇਸ' : isHindi ? 'ऑटो-वॉइस' : 'Auto Voice'}</span>
            </button>
            <span className="text-slate-600">|</span>
            <button
              type="button"
              onClick={() => setSpeechRate((r) => (r === 1.0 ? 1.2 : r === 1.2 ? 0.9 : 1.0))}
              className="text-[11px] font-bold text-teal-300 hover:text-white transition-colors cursor-pointer"
              title="Change Voice Speed"
            >
              {speechRate}x
            </button>
          </div>
        </div>
      </div>

      {/* Citizen Profile Context Card (if available) */}
      {userProfile && (userProfile.state || userProfile.age || userProfile.occupation) && (
        <div className="bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-emerald-950 dark:text-emerald-200 shadow-2xs">
          <div className="flex items-center gap-2 overflow-hidden">
            <UserCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <span className="font-bold shrink-0">{isOdia ? 'ପ୍ରୋଫାଇଲ୍ ସଂଯୁକ୍ତ:' : isPunjabi ? 'ਪ੍ਰੋਫਾਈਲ ਜੁੜੀ ਹੋਈ:' : isHindi ? 'प्रोफाइल कनेक्टेड:' : 'Active Profile:'}</span>
            <span className="truncate text-emerald-800 dark:text-emerald-300">
              {[
                userProfile.state ? `📍 ${userProfile.state}` : '',
                userProfile.age ? `🎂 ${userProfile.age} ${isOdia ? 'ବର୍ଷ' : isPunjabi ? 'ਸਾਲ' : isHindi ? 'वर्ष' : 'yrs'}` : '',
                userProfile.occupation ? `💼 ${userProfile.occupation}` : '',
                userProfile.category ? `🏷️ ${userProfile.category}` : '',
              ]
                .filter(Boolean)
                .join(' • ')}
            </span>
          </div>
          <Link
            to="/eligibility"
            className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200 underline shrink-0"
          >
            {isOdia ? 'ପରିବର୍ତ୍ତନ' : isPunjabi ? 'ਬਦਲੋ' : isHindi ? 'बदलें' : 'Edit'}
          </Link>
        </div>
      )}

      {/* Suggested Quick Prompt Chips */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>{isOdia ? 'ପ୍ରମୁଖ ବିଷୟ:' : isPunjabi ? 'ਸੁਝਾਏ ਗਏ ਵਿਸ਼ੇ:' : isHindi ? 'सुझाए गए विषय:' : 'Suggested Topics:'}</span>
          </span>
          {messages.length > 1 && (
            <button
              onClick={handleClearChat}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
              title="Clear conversation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isOdia ? 'ଚାଟ୍ ରିସେଟ୍' : isPunjabi ? 'ਚੈਟ ਰੀਸੈੱਟ' : isHindi ? 'रीसेट चैट' : 'Reset Chat'}</span>
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {promptCategories.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(chip.query)}
              className="text-left text-xs font-medium bg-white dark:bg-slate-900 hover:bg-teal-50 dark:hover:bg-slate-800 hover:text-teal-950 dark:hover:text-teal-300 hover:border-teal-400 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-all cursor-pointer"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Conversation Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 min-h-[480px] flex flex-col justify-between">
        {/* Messages List */}
        <div ref={chatScrollRef} className="space-y-4 overflow-y-auto max-h-[540px] pr-2">
          {messages.map((msg) => {
            const isSpeakingThis = speakingMessageId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${
                  msg.sender === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-2xl flex items-center justify-center shrink-0 text-white font-bold text-sm shadow-2xs ${
                    msg.sender === 'user'
                      ? 'bg-slate-900'
                      : 'bg-gradient-to-br from-teal-700 to-teal-950 border border-teal-600'
                  }`}
                >
                  {msg.sender === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4 text-emerald-300" />
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`space-y-2.5 max-w-[88%] sm:max-w-[80%] rounded-3xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed relative ${
                    msg.sender === 'user'
                      ? 'bg-teal-800 dark:bg-teal-700 text-white rounded-tr-xs shadow-md'
                      : 'bg-slate-50 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 border border-slate-200/90 dark:border-slate-700/80 rounded-tl-xs shadow-2xs'
                  }`}
                >
                  {/* Formatted Markdown Message Body */}
                  <FormattedMessage text={msg.text} />

                  {/* Inline Referenced Scheme Cards (Localized) */}
                  {msg.matchedSchemes && msg.matchedSchemes.length > 0 && (
                    <div className="space-y-2 pt-2.5 border-t border-slate-200/80 dark:border-slate-700/80">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-teal-800 dark:text-teal-300">
                        <Compass className="w-3.5 h-3.5" />
                        <span>{isOdia ? 'ଅନୁଶଂସିତ ସରକାରୀ ଯୋଜନା:' : isPunjabi ? 'ਸਿਫ਼ਾਰਸ਼ ਕੀਤੀਆਂ ਸਰਕਾਰੀ ਸਕੀମਾਂ:' : isHindi ? 'अनुशंसित योजनाएं:' : 'Recommended Verified Schemes:'}</span>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        {msg.matchedSchemes.map((rawScheme) => {
                          const scheme = translateSchemeContent(rawScheme, langCode);
                          const benefit = Array.isArray(scheme.benefits) ? scheme.benefits[0] : null;

                          return (
                            <div
                              key={scheme.id || scheme.slug}
                              className="bg-white dark:bg-slate-800/95 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-500 transition-all text-left space-y-1.5 shadow-2xs"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <StatusPill type="category" value={scheme.category} size="sm" />
                                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                                  {isOdia ? '✓ ସତ୍ୟାପିତ ଯୋଜନା' : isPunjabi ? '✓ ਪ੍ਰମାଣਿਤ ਸਕୀମ' : isHindi ? '✓ सत्यापित योजना' : '✓ Verified'}
                                </span>
                              </div>

                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                                {scheme.name}
                              </h4>

                              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                                {scheme.shortDescription}
                              </p>

                              {benefit && (
                                <div className="text-[11px] font-bold text-teal-800 dark:text-emerald-400 flex items-center gap-1 pt-1 border-t border-slate-100 dark:border-slate-700">
                                  <Sparkles className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{benefit.amountOrValue || benefit.title}</span>
                                </div>
                              )}

                              <div className="pt-1 flex items-center justify-end">
                                <Link
                                  to={`/schemes/${scheme.slug}`}
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-800 dark:text-teal-400 hover:underline"
                                >
                                  <span>{isOdia ? 'ବିବରଣୀ ଦେଖନ୍ତୁ' : isPunjabi ? 'ਵੇରਵੇ ਵੇਖੋ' : isHindi ? 'विवरण देखें' : 'View Details'}</span>
                                  <ArrowRight className="w-3 h-3" />
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Message Bottom Action Bar */}
                  {msg.sender === 'assistant' ? (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60 mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        {/* Audio Listen / Pause / Stop Button */}
                        {isSpeakingThis ? (
                          <div className="flex items-center gap-1 bg-teal-100/80 dark:bg-teal-900/60 px-2 py-0.5 rounded-lg text-teal-900 dark:text-teal-200 font-medium">
                            <span className="w-1 h-3 bg-teal-600 rounded-full animate-pulse" />
                            <span className="w-1 h-4 bg-teal-600 rounded-full animate-pulse [animation-delay:0.2s]" />
                            <span className="w-1 h-2 bg-teal-600 rounded-full animate-pulse [animation-delay:0.4s]" />
                            <span className="text-[10px] font-bold mx-1">
                              {isSpeechPaused ? (isHindi ? 'रोका गया' : 'Paused') : (isHindi ? 'सुनाया जा रहा है...' : 'Playing...')}
                            </span>
                            {isSpeechPaused ? (
                              <button
                                type="button"
                                onClick={resumeSpeech}
                                className="p-0.5 hover:text-teal-950 dark:hover:text-white cursor-pointer"
                                title="Resume"
                              >
                                <Play className="w-3 h-3" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={pauseSpeech}
                                className="p-0.5 hover:text-teal-950 dark:hover:text-white cursor-pointer"
                                title="Pause"
                              >
                                <Pause className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={stopSpeech}
                              className="p-0.5 hover:text-rose-700 dark:hover:text-rose-400 cursor-pointer text-rose-600 dark:text-rose-400"
                              title="Stop"
                            >
                              <Square className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => speakText(msg.id, msg.text)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-200/70 dark:bg-slate-700 hover:bg-teal-100 dark:hover:bg-slate-600 hover:text-teal-900 dark:hover:text-white text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                            title="Listen aloud (बोलकर सुनें)"
                          >
                            <Volume2 className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
                            <span>{isOdia ? 'ଶୁଣନ୍ତୁ' : isHindi ? 'सुनें' : 'Listen'}</span>
                          </button>
                        )}

                        {/* Copy Message Button */}
                        <button
                          type="button"
                          onClick={() => handleCopyText(msg.id, msg.text)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-200/70 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                          title="Copy text"
                        >
                          {copiedMsgId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              <span className="text-emerald-700 dark:text-emerald-400 font-bold">{isOdia ? 'କପି ହେଲା!' : isPunjabi ? 'ਕਾਪੀ ਹੋ ਗਿਆ!' : isHindi ? 'कॉपी हुआ!' : 'Copied!'}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                              <span>{isOdia ? 'କପି' : isPunjabi ? 'ਕਾਪੀ' : isHindi ? 'कॉपी' : 'Copy'}</span>
                            </>
                          )}
                        </button>
                      </div>

                      <span className="text-[10px] text-slate-400 dark:text-slate-500">{msg.timestamp}</span>
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-300 dark:text-slate-500 text-right">{msg.timestamp}</div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Clean Modern Typing / Thinking Indicator */}
          {isTyping && (
            <div className="flex items-start gap-3 pl-1 animate-in fade-in">
              <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-teal-700 to-teal-950 flex items-center justify-center shrink-0 text-white shadow-2xs">
                <Bot className="w-4 h-4 text-emerald-300" />
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-xs px-4 py-3 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2 shadow-2xs">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-teal-600 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-teal-600 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-teal-600 animate-bounce [animation-delay:0.4s]" />
                </div>
                <span className="font-medium text-slate-700 dark:text-slate-300 ml-1">
                  {isOdia
                    ? 'ମିତ୍ର AI ବିଶ୍ଳେଷଣ କରୁଛି...'
                    : isPunjabi
                    ? 'ਮਿੱਤਰ AI ਸੋਚ ਰਿਹਾ ਹੈ...'
                    : isHindi
                    ? 'मित्र AI सोच रहा है...'
                    : 'Mitra AI is thinking...'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Real-time Voice Transcript Live Pill (While Mic is active) */}
        {isListening && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-2xl p-3 flex items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-2 text-xs text-rose-900 dark:text-rose-200 font-bold overflow-hidden">
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
              </span>
              <span className="shrink-0">{isOdia ? 'ଶୁଣୁଛି...' : isPunjabi ? 'ਸੁਣ ਰਿਹਾ ਹਾਂ... ਬੋଲੋ:' : isHindi ? 'सुन रहा हूँ... बोलिए:' : 'Listening... Speak now:'}</span>
              <span className="italic truncate text-rose-700 dark:text-rose-300 font-normal">
                {interimTranscript || transcript || (isOdia ? 'ଆପଣଙ୍କ ପ୍ରଶ୍ନ କୁହନ୍ତୁ...' : isPunjabi ? 'ਆਪਣੀ ਭାਸ਼ਾ ਵਿੱਚ ਬୋਲੋ...' : isHindi ? 'अपनी भाषा में बोलें...' : 'Speak your question...')}
              </span>
            </div>
            <button
              type="button"
              onClick={stopListening}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shrink-0 cursor-pointer shadow-xs"
            >
              {isOdia ? 'ସମାପ୍ତ କରନ୍ତୁ' : isPunjabi ? 'ਰੋਕੋ' : isHindi ? 'रोकें' : 'Done'}
            </button>
          </div>
        )}

        {/* Voice Error Notification */}
        {voiceError && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between gap-2">
            <span>{voiceError}</span>
            <button
              type="button"
              onClick={resetTranscript}
              className="font-bold underline text-amber-900 dark:text-amber-300 cursor-pointer"
            >
              OK
            </button>
          </div>
        )}

        {/* Input Bar with Voice Input (Mic) and Text Send */}
        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputQuery);
            }}
            className="flex items-center gap-2"
          >
            {/* Voice Input Mic Button */}
            <button
              type="button"
              onClick={() => {
                if (isListening) {
                  stopListening();
                } else {
                  resetTranscript();
                  startListening();
                }
              }}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                isListening
                  ? 'bg-rose-600 border-rose-700 text-white shadow-lg ring-4 ring-rose-300 dark:ring-rose-900/60 animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-500 text-teal-800 dark:text-teal-400 shadow-2xs'
              }`}
              title={
                isListening
                  ? 'Listening... Click to stop'
                  : isOdia
                  ? 'ମାଇକ୍ ସହିତ କୁହନ୍ତୁ (Voice Input)'
                  : isPunjabi
                  ? 'ਮਾਈਕ ਨਾਲ ਬੋਲੋ (Voice Input)'
                  : isHindi
                  ? 'माइक से बोलें (Voice Input)'
                  : 'Click to speak in your language (Voice Input)'
              }
            >
              {isListening ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Text Input Field */}
            <input
              type="text"
              placeholder={
                isListening
                  ? isOdia ? 'ଶୁଣୁଛି... କୁହନ୍ତୁ...' : isPunjabi ? 'ਸੁਣ ਰਿਹਾ ਹਾਂ... ਬੋਲੋ...' : isHindi ? 'सुन रहा हूँ... बोलिए...' : 'Listening... Speak now...'
                  : isOdia
                  ? 'ଆପଣଙ୍କ ଭାଷାରେ ଯେକୌଣସି ପ୍ରଶ୍ନ ପଚାରନ୍ତୁ କିମ୍ବା ମାଇକ୍ ବଟନ୍ ଦବାନ୍ତୁ...'
                  : isPunjabi
                  ? 'ਆਪਣੀ ਭାਸ਼ਾ ਵਿੱਚ ਕੋਈ ਵੀ ਸਵਾਲ ਪੁੱਛੋ ਜਾਂ ਮਾਈਕ ਦਬਾ ਕੇ ਬੋਲੋ...'
                  : isHindi
                  ? 'अपनी भाषा में कुछ भी पूछें या माइक दबाकर बोलें...'
                  : 'Type your question or click mic to speak in your language...'
              }
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              className="flex-1 px-4 py-3.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 focus:border-teal-600 dark:focus:border-teal-500 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-2xl text-xs sm:text-sm font-medium outline-hidden transition-all"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputQuery.trim() || isTyping}
              className="p-3.5 bg-teal-800 hover:bg-teal-900 disabled:opacity-40 text-white rounded-2xl shadow-md transition-all cursor-pointer shrink-0"
              title="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};



import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Compass, X, Sparkles, ArrowRight, Search, Bot, MessageSquare } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

export const ChatbotFAB: React.FC = () => {
  const { t, langCode } = useTranslation();
  const isHindi = langCode.startsWith('hi');
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  // Don't show on the assistant page itself
  if (location.pathname === '/assistant') return null;
  if (isDismissed) return null;

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    setIsOpen(false);
    setSearchQuery('');
    navigate('/assistant', { state: { initialQuery: query } });
  };

  const handleQuickPromptClick = (prompt: string) => {
    setIsOpen(false);
    setSearchQuery('');
    navigate('/assistant', { state: { initialQuery: prompt } });
  };

  return (
    <div className="hidden md:flex fixed bottom-6 right-6 z-50 flex-col items-end gap-3">
      {/* Pop-out card panel */}
      {isOpen && (
        <div className="w-[calc(100vw-2.5rem)] sm:w-96 bg-white dark:bg-slate-900 rounded-3xl border border-teal-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200 z-50 max-h-[85vh] overflow-y-auto">
          {/* Card header */}
          <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-slate-950 px-5 py-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-700/70 border border-teal-500/40 flex items-center justify-center shrink-0 shadow-sm relative">
                <Bot className="w-5 h-5 text-emerald-300" />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-teal-900 rounded-full" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-white text-base font-extrabold leading-tight">
                    {isHindi ? 'मित्र (Mitra AI)' : 'Mitra AI Advisor'}
                  </h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 font-bold border border-emerald-400/30">
                    24/7 AI
                  </span>
                </div>
                <p className="text-teal-200 text-xs mt-0.5">
                  {isHindi ? 'आपका सरकारी योजना साथी' : 'Your Government Scheme Companion'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl text-teal-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Card body */}
          <div className="p-5 space-y-4">
            <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
              {isHindi
                ? 'नमस्ते! अपनी आयु, राज्य, या जरूरत (जैसे छात्रवृत्ति, बिजनेस लोन, किसान सहायता) लिखें और मित्र से तुरंत पूछें।'
                : 'Namaste! Ask Mitra anything about government schemes, eligibility, or application steps to get instant guidance.'}
            </p>

            {/* Quick Search Bar with Voice Input inside Popup */}
            <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-1.5">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder={
                    langCode.startsWith('or')
                      ? 'ମିତ୍ରଙ୍କୁ ପଚାରନ୍ତୁ... (ଉଦା. ଛାତ୍ରବୃତ୍ତି)'
                      : isHindi
                      ? 'मित्र से पूछें... (उदा. UP में छात्रवृत्ति)'
                      : 'Ask Mitra... (e.g., UP Student Scholarship)'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-3.5 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-teal-200 dark:border-slate-700 focus:border-teal-700 dark:focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 rounded-2xl text-xs font-medium text-slate-900 dark:text-white outline-hidden transition-all shadow-inner"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1 bottom-1 px-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl flex items-center justify-center transition-colors cursor-pointer"
                  title="Search on Mitra AI"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

            {/* Quick Prompt Suggestions */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {langCode.startsWith('or') ? 'ପ୍ରମୁଖ ପ୍ରଶ୍ନ:' : isHindi ? 'लोकप्रिय प्रश्न:' : 'Popular Questions:'}
              </span>
              {[
                langCode.startsWith('or')
                  ? '🎓 କଲେଜ ଛାତ୍ରଛାତ୍ରୀଙ୍କ ପାଇଁ ସ୍କଲାରସିପ୍'
                  : isHindi
                  ? '🎓 12वीं/कॉलेज छात्रों के लिए स्कॉलरशिप'
                  : '🎓 College Student Scholarships',
                langCode.startsWith('or')
                  ? '🌾 କୃଷକ ସହାୟତା ଓ PM-Kisan'
                  : isHindi
                  ? '🌾 किसान सम्मान निधि व कृषि लोन'
                  : '🌾 Farmer Subsidies & PM-Kisan',
                langCode.startsWith('or')
                  ? '💼 ବ୍ୟବସାୟ ପାଇଁ ମୁଦ୍ରା ଋଣ'
                  : isHindi
                  ? '💼 नया व्यापार शुरू करने के लिए मुद्रा लोन'
                  : '💼 Low-Interest Mudra Business Loans',
              ].map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleQuickPromptClick(prompt)}
                  className="w-full text-left flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:bg-teal-50 dark:hover:bg-slate-700 hover:border-teal-300 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-teal-950 dark:hover:text-white transition-all cursor-pointer group"
                >
                  <span className="truncate">{prompt}</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0 text-slate-400 group-hover:text-teal-700 dark:group-hover:text-teal-300 group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>

            {/* Direct Link to Full Mitra Page */}
            <button
              type="button"
              onClick={() => {
                const q = searchQuery.trim();
                setIsOpen(false);
                setSearchQuery('');
                navigate('/assistant', { state: q ? { initialQuery: q } : undefined });
              }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-teal-700 to-teal-950 hover:from-teal-800 hover:to-slate-900 text-white text-xs font-extrabold rounded-2xl shadow-lg shadow-teal-950/20 hover:shadow-xl transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>
                {langCode.startsWith('or')
                  ? 'ସମ୍ପୂର୍ଣ୍ଣ ମିତ୍ର AI ଚାଟ୍ ଖୋଲନ୍ତୁ'
                  : isHindi
                  ? 'पूरा मित्र AI चैट खोलें'
                  : 'Open Full Mitra AI Advisor'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Dismiss option */}
          <div className="px-5 pb-3 pt-1 flex justify-end border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsDismissed(true);
              }}
              className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              {t('common.dismiss', undefined, 'Dismiss')}
            </button>
          </div>
        </div>
      )}

      {/* Floating Pill + FAB trigger button */}
      <div className="flex items-center gap-3">
        {/* Floating pill badge when closed */}
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-teal-300 dark:border-teal-700/60 shadow-xl shadow-teal-950/15 text-xs font-extrabold text-teal-950 dark:text-emerald-300 hover:bg-teal-50 dark:hover:bg-slate-800 transition-all hover:scale-105 cursor-pointer group animate-in slide-in-from-right-3"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{isHindi ? 'मित्र AI से पूछें' : 'Ask Mitra AI'}</span>
            <Sparkles className="w-3.5 h-3.5 text-teal-700 dark:text-emerald-400 group-hover:rotate-12 transition-transform" />
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="Open Mitra AI Scheme Advisor"
          className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-200 cursor-pointer relative ${
            isOpen
              ? 'bg-slate-900 shadow-slate-900/40 rotate-[8deg]'
              : 'bg-gradient-to-br from-teal-600 via-teal-700 to-teal-950 hover:from-teal-500 hover:to-teal-900 shadow-teal-950/30 hover:shadow-teal-700/50 hover:scale-108'
          }`}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <>
              <Bot className="w-7 h-7 text-emerald-300" />
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white" />
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

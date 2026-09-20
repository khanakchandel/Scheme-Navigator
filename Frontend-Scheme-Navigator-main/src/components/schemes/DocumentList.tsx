import React, { useState } from 'react';
import { DocumentRequirement } from '../../types';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { translateDocumentName } from '../../utils/schemeTranslator';

interface DocumentListProps {
  documents?: DocumentRequirement[];
}

export const DocumentList: React.FC<DocumentListProps> = ({ documents = [] }) => {
  const { t, langCode } = useTranslation();
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});

  const safeDocs = Array.isArray(documents) ? documents : [];

  const toggleDoc = (id: string) => {
    setCheckedDocs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getDocTypeBadge = (type?: string) => {
    const safeType = (type || 'other').toLowerCase();
    switch (safeType) {
      case 'identity':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'income':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'education':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'bank':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'caste':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (safeDocs.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-xl font-bold text-slate-900">
          {t('scheme_detail.documents_title', undefined, 'Documents You May Need')}
        </h3>
        <p className="text-xs text-slate-500">
          {t('scheme_detail.no_documents_specified', undefined, 'Standard identity and residence proofs (such as Aadhaar Card) are generally sufficient for this scheme.')}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">
            {t('scheme_detail.documents_title', undefined, 'Documents You May Need')}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('scheme_detail.documents_subtitle', undefined, 'Keep clear digital scans (PDF/JPG under 200KB) ready before starting the online application.')}
          </p>
        </div>

        <span className="text-xs font-semibold text-slate-500">
          {Object.values(checkedDocs).filter(Boolean).length} {t('scheme_detail.of', undefined, 'of')} {safeDocs.length} {t('scheme_detail.prepared', undefined, 'prepared')}
        </span>
      </div>

      {/* Document Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {safeDocs.map((doc, idx) => {
          const docId = doc.id || (doc as any)._id || `doc-${idx}`;
          const isReady = !!checkedDocs[docId];
          const isMandatory = Boolean(doc.isMandatory ?? (doc as any).mandatory);
          const docType = doc.documentType || 'other';

          return (
            <div
              key={docId}
              onClick={() => toggleDoc(docId)}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 select-none ${
                isReady
                  ? 'bg-emerald-50/60 border-emerald-400 shadow-2xs'
                  : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                  isReady ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                }`}
              >
                {isReady && <CheckCircle2 className="w-4 h-4" />}
              </div>

              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 truncate">
                    {translateDocumentName(doc.name, langCode) || 'Identity / Supporting Document'}
                  </span>
                  {isMandatory && (
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                      {t('scheme_detail.doc_mandatory', undefined, 'Mandatory')}
                    </span>
                  )}
                </div>

                {doc.description && (
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {doc.description}
                  </p>
                )}

                <div className="pt-1">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${getDocTypeBadge(docType)}`}>
                    {String(docType).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Document Disclaimer */}
      <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <span>
          <strong>{t('scheme_detail.doc_reminder_title', undefined, 'Document Reminder:')}</strong> {t('scheme_detail.doc_reminder_desc', undefined, 'Required documents may vary by state implementation. Please cross-verify the latest circular on the official portal before final submission.')}
        </span>
      </div>
    </div>
  );
};

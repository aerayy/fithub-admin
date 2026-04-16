export default function ProgramCard({
  title, subtitle, children, onEdit, onGenerate, generating, isAIGenerated, onRemove,
  // Draft tab props (optional)
  drafts, selectedDraftIdx, onDraftSelect, onNewDraft, onDeleteDraft, onAssignDraft,
}) {
  const hasDrafts = drafts && drafts.length > 0;

  return (
    <div className={`rounded-2xl border bg-white p-5 shadow-sm ${isAIGenerated ? 'border-purple-300' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-gray-900">{title}</div>
          {subtitle ? (
            <div className="mt-1 text-xs text-gray-500">{subtitle}</div>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {onGenerate && (
            <button
              onClick={onGenerate}
              disabled={generating}
              className="rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 px-3 py-2 text-sm font-medium text-white hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {generating ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Oluşturuluyor...</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                  <span>AI ile Üret</span>
                </>
              )}
            </button>
          )}
          <button
            onClick={onEdit}
            className="rounded-xl border px-3 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Düzenle
          </button>
          {onRemove && (
            <button
              onClick={onRemove}
              className="rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Kaldır
            </button>
          )}
        </div>
      </div>

      {/* Draft tabs — inside the card */}
      {(hasDrafts || onNewDraft) && (
        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
          {(drafts || []).map((d, idx) => (
            <button
              key={d.id}
              onClick={() => onDraftSelect?.(idx)}
              className={`group relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                selectedDraftIdx === idx
                  ? "bg-[#3E9E8E]/10 border-[#3E9E8E]/30 text-[#2B7B6E]"
                  : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
            >
              {d.name || `Taslak ${idx + 1}`}
              {onDeleteDraft && (
                <span
                  onClick={(e) => { e.stopPropagation(); onDeleteDraft(d.id); }}
                  className="w-4 h-4 rounded flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  title="Sil"
                >
                  <svg width="8" height="8" viewBox="0 0 16 16" fill="none"><path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                </span>
              )}
            </button>
          ))}
          {onNewDraft && (
            <button
              onClick={onNewDraft}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-dashed border-slate-300 text-slate-400 hover:border-[#3E9E8E] hover:text-[#2B7B6E] transition-colors"
              title="Yeni taslak oluştur"
            >
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M8 2V14M2 8H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              Yeni
            </button>
          )}
          {hasDrafts && selectedDraftIdx != null && onAssignDraft && (
            <button
              onClick={() => onAssignDraft(drafts[selectedDraftIdx]?.id)}
              className="ml-auto inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-br from-[#3E9E8E] to-[#2B7B6E] text-white hover:shadow-md transition-all"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Seçiliyi Ata
            </button>
          )}
        </div>
      )}

      <div className="mt-4">{children}</div>
    </div>
  );
}

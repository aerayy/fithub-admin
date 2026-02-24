export default function ProgramCard({ title, subtitle, children, onEdit, onGenerate, generating, isAIGenerated, onRemove }) {
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
                    <span>✨</span>
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
  
        <div className="mt-4">{children}</div>
      </div>
    );
  }
  
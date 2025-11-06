export default function Loading() {
  return (
    <div className="space-y-6 max-w-5xl animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center gap-4">
        <div className="w-9 h-9 bg-slate-200 rounded-lg"></div>
        <div className="flex-1">
          <div className="h-9 w-64 bg-slate-200 rounded-lg"></div>
          <div className="h-5 w-48 bg-slate-100 rounded mt-2"></div>
        </div>
      </div>

      {/* Metadata cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="h-3 w-16 bg-slate-200 rounded mb-2"></div>
            <div className="h-6 w-20 bg-slate-100 rounded"></div>
          </div>
        ))}
      </div>

      {/* Transcript skeleton */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
          <div className="h-6 w-32 bg-slate-200 rounded"></div>
          <div className="h-4 w-24 bg-slate-100 rounded mt-2"></div>
        </div>
        <div className="p-6 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`flex gap-3 ${i % 2 === 0 ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full ${i % 2 === 0 ? 'bg-blue-200' : 'bg-slate-200'}`}></div>
              <div className="flex-1 max-w-3xl">
                <div className={`h-20 rounded-2xl ${i % 2 === 0 ? 'bg-blue-100' : 'bg-slate-100'} w-3/4`}></div>
                <div className="h-3 w-16 bg-slate-100 rounded mt-2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

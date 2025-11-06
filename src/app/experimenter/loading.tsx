export default function Loading() {
  return (
    <div className="space-y-6 max-w-7xl animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-9 w-48 bg-slate-200 rounded-lg"></div>
          <div className="h-5 w-64 bg-slate-100 rounded mt-2"></div>
        </div>
        <div className="h-10 w-32 bg-slate-200 rounded-xl"></div>
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
              <tr>
                <th className="p-4">
                  <div className="h-4 w-24 bg-slate-200 rounded"></div>
                </th>
                <th className="p-4">
                  <div className="h-4 w-20 bg-slate-200 rounded"></div>
                </th>
                <th className="p-4">
                  <div className="h-4 w-20 bg-slate-200 rounded"></div>
                </th>
                <th className="p-4 text-right">
                  <div className="h-4 w-16 bg-slate-200 rounded ml-auto"></div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i}>
                  <td className="p-4">
                    <div className="h-5 w-32 bg-slate-100 rounded"></div>
                  </td>
                  <td className="p-4">
                    <div className="h-5 w-24 bg-slate-100 rounded"></div>
                  </td>
                  <td className="p-4">
                    <div className="h-5 w-28 bg-slate-100 rounded"></div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-8 w-16 bg-slate-100 rounded-lg"></div>
                      <div className="h-8 w-16 bg-slate-100 rounded-lg"></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

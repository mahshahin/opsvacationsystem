const fs = require('fs');

let text = fs.readFileSync('frontend/src/pages/Admin/RosterManagement.jsx', 'utf8');

const anchor = `            <div
              className={
                isRosterFullscreen
                  ? "min-h-0 flex-1 overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm print:w-full print:overflow-visible"
                  : "max-h-[78vh] overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm print:w-full print:overflow-visible"
              }
            >`;

const uiInjection = `          {prevRosterData && (
            <div className="mb-6 overflow-hidden rounded-xl border border-amber-200 bg-amber-50/30 shadow-sm no-print">
              <button
                type="button"
                onClick={() => setShowPrevMonth(!showPrevMonth)}
                className="flex w-full items-center justify-between gap-3 bg-amber-50 px-4 py-3 text-right transition hover:bg-amber-100/50 md:px-5"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="text-amber-600" size={18} />
                  <h3 className="text-base font-bold text-amber-900">
                    مراجعة أواخر أيام الشهر السابق
                  </h3>
                </div>
                <ChevronDown
                  size={20}
                  className={\`text-amber-600 transition-transform duration-300 \${
                    showPrevMonth ? "rotate-180" : ""
                  }\`}
                />
              </button>
              
              <div
                className={\`overflow-hidden transition-all duration-500 ease-in-out \${
                  showPrevMonth ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
                }\`}
              >
                <div className="p-4 overflow-x-auto">
                  <table className="w-full min-w-[800px] border-collapse text-right text-sm">
                    <thead>
                      <tr className="bg-amber-100/50">
                        <th className="border border-amber-200 p-2 font-bold text-amber-900 w-24">اليوم</th>
                        <th className="border border-amber-200 p-2 font-bold text-amber-900 w-1/4">الوردية الأولى</th>
                        <th className="border border-amber-200 p-2 font-bold text-amber-900 w-1/4">الوردية الثانية</th>
                        <th className="border border-amber-200 p-2 font-bold text-amber-900 w-1/4">الوردية الثالثة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.values(prevRosterData).slice(-6).map((day) => {
                        let pMonth = month - 1;
                        let pYear = year;
                        if (pMonth === 0) { pMonth = 12; pYear = year - 1; }
                        const dateObj = new Date(pYear, pMonth - 1, day.dayNumber);
                        const dayName = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"][dateObj.getDay()];
                        return (
                          <tr key={day.dayNumber} className="bg-white/50 hover:bg-white/80 transition-colors">
                            <td className="border border-amber-200 p-2 font-bold text-slate-700 bg-amber-50/50">
                              <div className="flex flex-col items-center justify-center gap-1">
                                <span className="text-lg">{day.dayNumber}</span>
                                <span className="text-xs text-slate-500">{dayName}</span>
                              </div>
                            </td>
                            {["shift1", "shift2", "shift3"].map((shiftKey) => {
                              const shift = day[shiftKey];
                              return (
                                <td key={shiftKey} className="border border-amber-200 p-2 align-top">
                                  {shift && shift.leader && (
                                    <div className="mb-2 inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-800">
                                      <span>👑</span> {getEmployeeNameById(shift.leader)}
                                    </div>
                                  )}
                                  <div className="flex flex-wrap gap-1">
                                    {(shift && shift.members || []).filter(Boolean).map((mId, i) => (
                                      <span key={i} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                                        {getEmployeeNameById(mId)}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
` + anchor;

text = text.replace(anchor, uiInjection);

// Because I messed up before by placing it around line 3650, I need to remove that erroneous chunk if it exists
const badChunkStart = `{prevRosterData && (`;
const badChunkEnd = `no-print">`;
// Wait, my previous script didn't even match `overflow-x-auto no-print` so it didn't inject anything!

fs.writeFileSync('frontend/src/pages/Admin/RosterManagement.jsx', text);

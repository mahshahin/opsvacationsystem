import re

with open('frontend/src/pages/Admin/RosterManagement.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. State Variables
state_target = "  const [rosterStatus, setRosterStatus] = useState(null);"
state_replacement = """  const [rosterStatus, setRosterStatus] = useState(null);
  const [prevRosterData, setPrevRosterData] = useState(null);
  const [showPrevMonth, setShowPrevMonth] = useState(false);"""
text = text.replace(state_target, state_replacement)

# 2. Fetch Logic
fetch_target = """          if (data.existingRoster) {
            setRosterData(
              normalizeRosterData(data.existingRoster.details, month, year),
            );
            setRosterStatus(data.existingRoster.status || null);
          } else {
            setRosterData(createEmptyRoster(month, year));
            setRosterStatus(null);
          }"""

fetch_replacement = """          if (data.existingRoster) {
            setRosterData(
              normalizeRosterData(data.existingRoster.details, month, year),
            );
            setRosterStatus(data.existingRoster.status || null);
          } else {
            setRosterData(createEmptyRoster(month, year));
            setRosterStatus(null);
          }

          if (data.prevRoster && data.prevRoster.details) {
            let pMonth = month - 1;
            let pYear = year;
            if (pMonth === 0) { pMonth = 12; pYear = year - 1; }
            setPrevRosterData(normalizeRosterData(data.prevRoster.details, pMonth, pYear));
          } else {
            setPrevRosterData(null);
          }"""
text = text.replace(fetch_target, fetch_replacement)

# 3. UI Injection
ui_target = """            <div
              className={
                isRosterFullscreen
                  ? "min-h-0 flex-1 overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm print:w-full print:overflow-visible"
                  : "max-h-[78vh] overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm print:w-full print:overflow-visible"
              }
            >"""

ui_injection = """          {prevRosterData && (
            <div className="mb-4 shrink-0 overflow-hidden rounded-xl border border-amber-200 bg-amber-50/30 shadow-sm no-print">
              <button
                type="button"
                onClick={() => setShowPrevMonth(!showPrevMonth)}
                className="flex w-full items-center justify-between gap-3 bg-amber-50 px-4 py-3 text-right transition hover:bg-amber-100/50 md:px-5"
              >
                <div className="flex items-center gap-2">
                  <span className="text-amber-600 font-bold text-xl">🗓️</span>
                  <h3 className="text-base font-bold text-amber-900">
                    مراجعة أواخر أيام الشهر السابق
                  </h3>
                </div>
                <span
                  className={`text-amber-600 transition-transform duration-300 font-bold ${
                    showPrevMonth ? "rotate-180" : ""
                  }`}
                >▼</span>
              </button>
              
              <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  showPrevMonth ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="p-4 overflow-auto max-h-[35vh]">
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
                      {Object.entries(prevRosterData).slice(-6).map(([dayNumberStr, day]) => {
                        const dayNum = parseInt(dayNumberStr, 10);
                        let pMonth = month - 1;
                        let pYear = year;
                        if (pMonth === 0) { pMonth = 12; pYear = year - 1; }
                        const dateObj = new Date(pYear, pMonth - 1, dayNum);
                        const dayName = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"][dateObj.getDay()];
                        return (
                          <tr key={dayNum} className="bg-white/50 hover:bg-white/80 transition-colors">
                            <td className="border border-amber-200 p-2 font-bold text-slate-700 bg-amber-50/50">
                              <div className="flex flex-col items-center justify-center gap-1">
                                <span className="text-lg">{dayNum}</span>
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
"""

text = text.replace(ui_target, ui_injection + ui_target)

with open('frontend/src/pages/Admin/RosterManagement.jsx', 'w', encoding='utf-8') as f:
    f.write(text)

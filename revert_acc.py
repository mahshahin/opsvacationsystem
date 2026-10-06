import re

with open('frontend/src/pages/Admin/RosterManagement.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

start_marker = '{prevRosterData && ('
end_marker = '            </div>\n          )}'

start_idx = text.find(start_marker)
end_idx = text.find(end_marker, start_idx) + len(end_marker)

if start_idx == -1:
    print('Not found')
    exit(1)

accordion_code = text[start_idx:end_idx]
text = text[:start_idx] + text[end_idx:]

container_start_marker = """            <div
              className={
                isRosterFullscreen
                  ? "min-h-0 flex-1 overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm print:w-full print:overflow-visible"
                  : "max-h-[78vh] overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm print:w-full print:overflow-visible"
              }
            >"""

container_idx = text.find(container_start_marker)
if container_idx != -1:
    modified_accordion = accordion_code.replace(
        'className="shrink-0 overflow-hidden border-b border-amber-200 bg-amber-50/30 no-print"',
        'className="mb-4 shrink-0 overflow-hidden rounded-xl border border-amber-200 bg-amber-50/30 shadow-sm no-print"'
    )
    if 'max-h-[35vh]' not in modified_accordion:
        modified_accordion = modified_accordion.replace(
            'className="p-4 overflow-auto"',
            'className="p-4 overflow-auto max-h-[35vh]"'
        )
    
    text = text.replace('\n\n\n', '\n\n')
    text = text[:container_idx] + modified_accordion + '\n' + text[container_idx:]
    
    with open('frontend/src/pages/Admin/RosterManagement.jsx', 'w', encoding='utf-8') as f:
        f.write(text)
    print('Reverted!')
else:
    print('Failed to revert')

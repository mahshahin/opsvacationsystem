import re

with open('frontend/src/pages/Admin/RosterManagement.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Define the exact accordion text to remove
start_marker = "{prevRosterData && ("
end_marker = '            </div>\n          )}'

start_idx = text.find(start_marker)
end_idx = text.find(end_marker, start_idx) + len(end_marker)

accordion_code = text[start_idx:end_idx]

# Remove it from its current location
text = text[:start_idx] + text[end_idx:]

# Find the start of the table container
container_start_marker = """            <div
              className={
                isRosterFullscreen
                  ? "min-h-0 flex-1 overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm print:w-full print:overflow-visible"
                  : "max-h-[78vh] overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm print:w-full print:overflow-visible"
              }
            >"""

container_idx = text.find(container_start_marker)
if container_idx != -1:
    insert_idx = container_idx + len(container_start_marker)
    
    # We should adjust the margin bottom of accordion since it's now inside the white box
    # maybe remove 'mb-6' and replace with 'border-b border-slate-200 mb-0 rounded-none' to fit nicely?
    modified_accordion = accordion_code.replace(
        'className="mb-6 shrink-0 overflow-hidden rounded-xl border border-amber-200 bg-amber-50/30 shadow-sm no-print"',
        'className="shrink-0 overflow-hidden border-b-2 border-slate-200 bg-amber-50/30 no-print"'
    )
    
    text = text[:insert_idx] + '\n' + modified_accordion + text[insert_idx:]
    
    with open('frontend/src/pages/Admin/RosterManagement.jsx', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Successfully moved!")
else:
    print("Could not find table container.")

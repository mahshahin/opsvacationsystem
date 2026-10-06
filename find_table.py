import re
with open('frontend/src/pages/Admin/RosterManagement.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Let's find the correct table div wrapper
# Usually it's something like:
# <div className="mt-8 overflow-hidden rounded-xl border border-indigo-200 bg-white shadow-md ring-1 ring-black/5 no-print">
# or the one with "overflow-x-auto"
# Let's inject right before:
# <table className="...

match = re.search(r'<table\s+className="[^"]*w-full min-w-\[1000px\]', text)
if match:
    print("Found table")
else:
    print("Table not found")

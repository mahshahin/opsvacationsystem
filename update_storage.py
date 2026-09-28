import re

with open('frontend/src/pages/Admin/RosterManagement.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Add a function to fetch config
fetch_config_fn = """
  const fetchRosterConfig = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/roster-config", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        if (data.data.shiftLeaderIds) setShiftLeaderIds(data.data.shiftLeaderIds);
        if (data.data.workGroups) setWorkGroups(data.data.workGroups);
        if (data.data.reserveEmployeeIds) setReserveEmployeeIds(data.data.reserveEmployeeIds);
      }
    } catch (e) {
      console.error("Error fetching roster config:", e);
    }
  };

  useEffect(() => {
    fetchRosterConfig();
  }, []);

  const saveRosterConfig = async (newConfig) => {
    try {
      await fetch("http://localhost:5000/api/admin/roster-config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ config: newConfig }),
      });
    } catch (e) {
      console.error("Error saving roster config:", e);
    }
  };
"""

# Replace local storage loads
text = re.sub(
    r'\s*// Load from localStorage\s*useEffect\(\(\) => \{\s*try \{\s*const saved = localStorage\.getItem\(shiftLeadersStorageKey\);\s*if \(saved\) setShiftLeaderIds\(JSON\.parse\(saved\)\);\s*\} catch \(e\) \{\}\s*try \{\s*const saved = localStorage\.getItem\(workGroupsStorageKey\);\s*if \(saved\) setWorkGroups\(JSON\.parse\(saved\)\);\s*\} catch \(e\) \{\}\s*try \{\s*const savedReserve = localStorage\.getItem\(reserveEmployeesStorageKey\);\s*if \(savedReserve\) setReserveEmployeeIds\(JSON\.parse\(savedReserve\)\);\s*\} catch \(e\) \{\}\s*\}, \[\]\);',
    fetch_config_fn,
    text
)

# Alternative replacement if the exact structure above didn't match
text = re.sub(
    r'\s*useEffect\(\(\) => \{\s*try \{\s*const saved = localStorage\.getItem\(shiftLeadersStorageKey\);\s*if \(saved\) setShiftLeaderIds.*?catch.*?catch.*?\}\, \[\]\);',
    fetch_config_fn,
    text,
    flags=re.DOTALL
)


# Replace setItem for shiftLeaders
text = re.sub(
    r'localStorage\.setItem\(shiftLeadersStorageKey,\s*JSON\.stringify\(uniqueIds\)\);',
    'saveRosterConfig({ shiftLeaderIds: uniqueIds, workGroups, reserveEmployeeIds });',
    text
)
text = re.sub(
    r'localStorage\.setItem\(shiftLeadersStorageKey,\s*JSON\.stringify\(newLeaders\)\);',
    'saveRosterConfig({ shiftLeaderIds: newLeaders, workGroups, reserveEmployeeIds });',
    text
)

# Replace setItem for workGroups
text = re.sub(
    r'localStorage\.setItem\(workGroupsStorageKey,\s*JSON\.stringify\(updated\)\);',
    'saveRosterConfig({ shiftLeaderIds, workGroups: updated, reserveEmployeeIds });',
    text
)
text = re.sub(
    r'localStorage\.setItem\(workGroupsStorageKey,\s*JSON\.stringify\(newGroups\)\);',
    'saveRosterConfig({ shiftLeaderIds, workGroups: newGroups, reserveEmployeeIds });',
    text
)
text = re.sub(
    r'localStorage\.setItem\(workGroupsStorageKey,\s*JSON\.stringify\(\[\]\)\);',
    'saveRosterConfig({ shiftLeaderIds, workGroups: [], reserveEmployeeIds });',
    text
)

# Replace setItem for reserveEmployees
text = re.sub(
    r'localStorage\.setItem\(\s*reserveEmployeesStorageKey,\s*JSON\.stringify\(uniqueIds\),\s*\);',
    'saveRosterConfig({ shiftLeaderIds, workGroups, reserveEmployeeIds: uniqueIds });',
    text
)
text = re.sub(
    r'localStorage\.setItem\(\s*reserveEmployeesStorageKey,\s*JSON\.stringify\(newReserves\),\s*\);',
    'saveRosterConfig({ shiftLeaderIds, workGroups, reserveEmployeeIds: newReserves });',
    text
)

with open('frontend/src/pages/Admin/RosterManagement.jsx', 'w', encoding='utf-8') as f:
    f.write(text)

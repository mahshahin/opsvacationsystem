const fs = require('fs');
let text = fs.readFileSync('frontend/src/pages/Admin/RosterManagement.jsx', 'utf8');

const loadEffect1 = `  useEffect(() => {
    try {
      const saved = localStorage.getItem(shiftLeadersStorageKey);
      const parsed = saved ? JSON.parse(saved) : [];
      setShiftLeaderIds(
        Array.isArray(parsed) ? parsed.map(normalizeId).filter(Boolean) : [],
      );
    } catch (error) {
      console.error("Error loading shift leaders locally:", error);
      setShiftLeaderIds([]);
    }

    setLeaderSearch("");
  }, [shiftLeadersStorageKey]);`;

const loadEffect2 = `  useEffect(() => {
    try {
      const saved = localStorage.getItem(workGroupsStorageKey);
      const parsed = saved ? JSON.parse(saved) : [];
      const normalizedGroups = Array.isArray(parsed)
        ? parsed.map((group, index) => ({
            id: group.id || \`group-\${Date.now()}-\${index}\`,
            name: group.name || \`مجموعة \${index + 1}\`,
            leaderId: normalizeId(group.leaderId),
            memberIds: Array.from(
              new Set((group.memberIds || []).map(normalizeId).filter(Boolean)),
            ).filter((id) => id !== normalizeId(group.leaderId)),
          }))
        : [];

      setWorkGroups(normalizedGroups);
      setSelectedWorkGroupId(normalizedGroups[0]?.id || "");
    } catch (error) {
      console.error("Error loading work groups locally:", error);
      setWorkGroups([]);
      setSelectedWorkGroupId("");
    }

    try {
      const savedReserve = localStorage.getItem(reserveEmployeesStorageKey);
      const parsedReserve = savedReserve ? JSON.parse(savedReserve) : [];
      setReserveEmployeeIds(
        Array.isArray(parsedReserve)
          ? parsedReserve.map(normalizeId).filter(Boolean)
          : [],
      );
    } catch (error) {
      console.error("Error loading reserve employees locally:", error);
      setReserveEmployeeIds([]);
    }
  }, []);`;

const fetchApi = `  const fetchRosterConfig = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/roster-config", {
        headers: { Authorization: \`Bearer \${localStorage.getItem("token")}\` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        if (data.data.shiftLeaderIds) setShiftLeaderIds(data.data.shiftLeaderIds.map(normalizeId).filter(Boolean));
        if (data.data.workGroups) {
          const parsed = data.data.workGroups;
          const normalizedGroups = Array.isArray(parsed)
            ? parsed.map((group, index) => ({
                id: group.id || \`group-\${Date.now()}-\${index}\`,
                name: group.name || \`مجموعة \${index + 1}\`,
                leaderId: normalizeId(group.leaderId),
                memberIds: Array.from(
                  new Set((group.memberIds || []).map(normalizeId).filter(Boolean)),
                ).filter((id) => id !== normalizeId(group.leaderId)),
              }))
            : [];
          setWorkGroups(normalizedGroups);
          setSelectedWorkGroupId(normalizedGroups[0]?.id || "");
        }
        if (data.data.reserveEmployeeIds) setReserveEmployeeIds(data.data.reserveEmployeeIds.map(normalizeId).filter(Boolean));
      }
    } catch (e) {
      console.error("Error fetching roster config:", e);
    }
  };

  useEffect(() => {
    fetchRosterConfig();
    setLeaderSearch("");
  }, []);`;


text = text.replace(loadEffect1, fetchApi);
text = text.replace(loadEffect2, '');

const persistWorkGroupSetItem = `    try {
      localStorage.setItem(
        workGroupsStorageKey,
        JSON.stringify(normalizedGroups),
      );
    } catch (error) {
      console.error("Error saving work groups locally:", error);
    }`;

const persistWorkGroupApi = `    try {
      saveRosterConfig({ shiftLeaderIds, workGroups: normalizedGroups, reserveEmployeeIds });
    } catch (error) {
      console.error("Error saving work groups remotely:", error);
    }`;

text = text.replace(persistWorkGroupSetItem, persistWorkGroupApi);


fs.writeFileSync('frontend/src/pages/Admin/RosterManagement.jsx', text);

(async () => {
  try {
    // 1. Fetch Init data to get actual employees
    const initRes = await fetch('http://127.0.0.1:5000/api/roster/init?month=8&year=2026');
    const initData = await initRes.json();
    const emps = initData.employees || [];
    if (emps.length === 0) { console.log("No employees found"); return; }
    
    const reserveId = emps[0]._id; // Use first employee as reserve
    
    // 2. Generate auto roster to get the base rosterData
    const autoRes = await fetch('http://127.0.0.1:5000/api/roster/auto-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        month: 8,
        year: 2026,
        workGroups: [
            { id: "g1", name: "test", memberIds: [emps[1]._id] } // Group 1 has emps[1]
        ],
        reserveEmployeeIds: [reserveId],
        config: { membersPerShift: 1, leaderRequired: true, ignorePendingLeaves: false }
      })
    });
    const autoData = await autoRes.json();
    const rosterData = autoData.rosterDetails;

    // 3. Call fill-empty
    const fillRes = await fetch('http://127.0.0.1:5000/api/roster/fill-empty', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        month: 8,
        year: 2026,
        rosterDetails: rosterData,
        reserveEmployeeIds: [reserveId],
        config: { membersPerShift: 1 }
      })
    });
    const fillData = await fillRes.json();
    console.log("Fill success:", fillData.success);
    
    // Check if reserveId was assigned anywhere
    let assignedCount = 0;
    for (let day = 1; day <= 31; day++) {
        if (!fillData.rosterDetails[day]) continue;
        ['shift1', 'shift2', 'shift3'].forEach(s => {
            if (fillData.rosterDetails[day][s].members.includes(reserveId)) {
                assignedCount++;
            }
        });
    }
    console.log("Reserve assigned", assignedCount, "times!");

  } catch (err) {
    console.error(err);
  }
})();

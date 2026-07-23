(async () => {
  try {
    const res = await fetch('http://127.0.0.1:5000/api/roster/auto-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        month: 8,
        year: 2026,
        config: { ignorePendingLeaves: false },
        workGroups: [{ id: "g1", name: "test", leaderId: "dummy" }]
      })
    });
    const data = await res.json();
    console.log("Day 4 notes:", data.rosterDetails['4'].notes);
  } catch (err) {
    console.error(err);
  }
})();

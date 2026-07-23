(async () => {
  try {
    const rosterData = {
        "1": {
            shift1: { leader: null, members: [] },
            shift2: { leader: null, members: [] },
            shift3: { leader: null, members: [] },
        }
    };
    const res = await fetch('http://127.0.0.1:5000/api/roster/fill-empty', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        month: 8,
        year: 2026,
        rosterDetails: rosterData,
        reserveEmployeeIds: ["669d0d3cd8ed2328ba892994"], // test objectId
        config: { membersPerShift: 1 }
      })
    });
    const data = await res.json();
    console.log("Fill Empty Output:", JSON.stringify(data.rosterDetails['1']));
  } catch (err) {
    console.error(err);
  }
})();

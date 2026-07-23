(async () => {
  try {
    const res = await fetch('http://127.0.0.1:5000/api/roster/init?month=8&year=2026', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    console.log("Init API leaves length:", data.leaves ? data.leaves.length : 0);
  } catch (err) {
    console.error(err);
  }
})();

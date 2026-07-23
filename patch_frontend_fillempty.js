const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/Admin/RosterManagement.jsx', 'utf8');

const backendFunc =   const handleBackendFillEmpty = async () => {
    if (!reserveEmployeeIds || reserveEmployeeIds.length === 0) {
      toast.error("يرجى تحديد أفراد احتياطي أولاً");
      return;
    }
    
    try {
      setLoading(true);
      const res = await fetch(\\/api/roster/fill-empty\, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: \Bearer \\,
        },
        body: JSON.stringify({
          month,
          year,
          rosterDetails: rosterData,
          reserveEmployeeIds,
          config: { membersPerShift: 1 }
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRosterData(data.rosterDetails);
        toast.success(data.message || "تم ملء الفراغات التلقائي بنجاح");
      } else {
        toast.error(data.message || "فشل ملء الفراغات");
      }
    } catch (error) {
      console.error(error);
      toast.error("حدث خطأ أثناء الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  const handleBackendAutoGenerate;

code = code.replace('  const handleBackendAutoGenerate', backendFunc);

// Now update the button
// Original: onClick={() => handleAutoFillRoster("fill-empty")}
code = code.replace('onClick={() => handleAutoFillRoster("fill-empty")}', 'onClick={handleBackendFillEmpty}');

fs.writeFileSync('frontend/src/pages/Admin/RosterManagement.jsx', code);
console.log('frontend RosterManagement patched for fill-empty!');

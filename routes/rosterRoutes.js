const express = require("express");
const router = express.Router();
const rosterController = require("../controllers/rosterController");

console.log("rosterController keys:", Object.keys(rosterController));
console.log({
  getRosterInitDataType: typeof rosterController.getRosterInitData,
  saveRosterType: typeof rosterController.saveRoster,
  getMyShiftsType: typeof rosterController.getMyShifts,
});

// مسار جلب ورديات الموظف الشخصية
router.get("/my-shifts", rosterController.getMyShifts);

// مسار جلب البيانات
router.get("/init", rosterController.getRosterInitData);

// مسار حفظ الروستر
router.post("/save", rosterController.saveRoster);

module.exports = router;

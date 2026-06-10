const express = require("express");
const router = express.Router();
const rosterController = require("../controllers/rosterController");

// مسار جلب ورديات الموظف الشخصية
router.get("/my-shifts", rosterController.getMyShifts);

// مسار جلب البيانات
router.get("/init", rosterController.getRosterInitData);

// مسار حفظ الروستر
router.post("/save", rosterController.saveRoster);

// مسار جلب الروستر المعتمد بالكامل
router.get("/published-full", rosterController.getPublishedFullRoster);

module.exports = router;

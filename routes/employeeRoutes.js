const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/employeeController");

// تقديم طلب إجازة جديد
router.post("/leave-request", employeeController.submitLeaveRequest);

// استخراج تقرير الإجازات للموظف
router.post("/report", employeeController.leaveReport);

// جلب جميع طلبات الموظف
router.get("/my-requests/:employeeCode", employeeController.getMyRequests);

// جلب بيانات الملف الشخصي (البروفايل)
router.get("/profile/:code", employeeController.getEmployeeProfile);

// تحديث البريد الإلكتروني للموظف
router.put("/update-email/:code", employeeController.updateEmail);

// حفظ توكن الإشعارات عند تسجيل الدخول أو تشغيل التطبيق
router.put("/push-token", employeeController.savePushToken);

// ✅ جديد: إزالة توكن الإشعارات عند تسجيل الخروج (مهمة جداً لمنع كراش الجوال عند الخروج)
router.put("/remove-push-token", employeeController.removePushToken);

// إلغاء طلب إجازة معلق
router.delete("/cancel-request/:id", employeeController.cancelRequest);

module.exports = router;

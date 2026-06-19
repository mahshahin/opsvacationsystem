const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");

// إدارة الموظفين
router.post("/add-employee", adminController.addEmployee);
router.post("/reset-password", adminController.resetPassword);

// الطلبات المعلقة
router.get("/pending-requests", adminController.getPendingRequests);
router.post("/handle-request", adminController.handleRequest);

// بيانات الموظفين
router.get("/employees", adminController.getEmployees);
router.put("/update-employee/:id", adminController.updateEmployee);
router.delete("/delete-employee/:id", adminController.deleteEmployee);
router.put("/update-balances/:id", adminController.updateBalances);

// ✅ رسائل الموظفين
router.get("/message-employees", adminController.getMessageEmployees);
router.post("/send-employee-message", adminController.sendEmployeeMessage);

// السجلات
router.get("/logs", adminController.getLogs);

// أرشيف الإجازات
router.get("/leave-archive", adminController.getLeaveArchive);
router.delete("/leave-archive/:id", adminController.deleteLeaveArchive);

// إدارة الأدمنز
router.post("/create-admin", adminController.createAdmin);
router.get("/admins-list", adminController.getAdminsList);
router.put("/update-admin/:id", adminController.updateAdmin);
router.delete("/delete-admin/:id", adminController.deleteAdmin);

// إعداد الحد الأقصى الشهري للإجازات
router.get("/leave-rules/monthly-limit", adminController.getMonthlyLeaveLimit);
router.put(
  "/leave-rules/monthly-limit",
  adminController.updateMonthlyLeaveLimit,
);

module.exports = router;

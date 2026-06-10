const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");

router.post("/add-employee", adminController.addEmployee);
router.post("/reset-password", adminController.resetPassword);

router.get("/pending-requests", adminController.getPendingRequests);
router.post("/handle-request", adminController.handleRequest);

router.get("/employees", adminController.getEmployees);
router.put("/update-employee/:id", adminController.updateEmployee);
router.delete("/delete-employee/:id", adminController.deleteEmployee);
router.put("/update-balances/:id", adminController.updateBalances);

router.get("/logs", adminController.getLogs);

router.get("/leave-archive", adminController.getLeaveArchive);
router.delete("/leave-archive/:id", adminController.deleteLeaveArchive);

router.post("/create-admin", adminController.createAdmin);
router.get("/admins-list", adminController.getAdminsList);
router.put("/update-admin/:id", adminController.updateAdmin);
router.delete("/delete-admin/:id", adminController.deleteAdmin);

module.exports = router;

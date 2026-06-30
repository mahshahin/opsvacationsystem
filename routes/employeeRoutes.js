const express = require("express");

const router = express.Router();

const employeeController = require("../controllers/employeeController");

router.post("/leave-request", employeeController.submitLeaveRequest);

router.post("/report", employeeController.leaveReport);

router.get("/my-requests/:employeeCode", employeeController.getMyRequests);

router.get("/profile/:code", employeeController.getEmployeeProfile);

router.put("/update-email/:code", employeeController.updateEmail);

router.put("/push-token", employeeController.savePushToken);

router.delete("/cancel-request/:id", employeeController.cancelRequest);

module.exports = router;
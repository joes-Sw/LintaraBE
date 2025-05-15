const express = require("express");
const router = express.Router();
const {
  createReport,
  getReports,
  getReportById,
  updateReport,
  deleteReport,
  countReportsByUserInChallenge,
  getReportsCountByUser
} = require("../controllers/reportController");

router.post("/createReport", createReport);
router.get("/getReports", getReports);
router.get("/getReport/:id", getReportById);
router.put("/updateReport/:id", updateReport);
router.delete("/deleteReport/:id", deleteReport);
router.get("/countByUser/:userId", countReportsByUserInChallenge);
router.get("/getReportsCountByUser", getReportsCountByUser);

module.exports = router;

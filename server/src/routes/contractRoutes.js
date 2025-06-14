const express = require("express");
const router = express.Router();
const contractController = require("../controllers/contractController");
const { auth, authorize } = require("../middlewares/auth");

// Admin routes
router.get("/", auth, authorize("admin"), contractController.getAllContracts);
router.post("/", auth, authorize("admin"), contractController.createContract);
router.get(
  "/:id",
  auth,
  authorize("admin"),
  contractController.getContractById
);
router.put("/:id", auth, authorize("admin"), contractController.updateContract);
router.delete(
  "/:id",
  auth,
  authorize("admin"),
  contractController.deleteContract
);
router.put(
  "/:id/complete",
  auth,
  authorize,
  contractController.completeContract
);

// User routes
router.get("/user/my", auth, contractController.getUserContracts);
router.put("/user/:id/confirm", auth, contractController.confirmContract);
router.put("/user/:id/reject", auth, contractController.rejectContract);

module.exports = router;

const express = require("express");
const router = express.Router();
const accountController = require("../controllers/accountController");
const { auth, authorize } = require("../middlewares/auth.js");

// Account management routes
router.get(
  "/accounts",
  auth,
  authorize("admin"),
  accountController.getAllAccounts
);
router.post(
  "/accounts",
  auth,
  authorize("admin"),
  accountController.createAccount
);
router.put(
  "/accounts/:id",
  auth,
  authorize("admin"),
  accountController.updateAccount
);
router.delete(
  "/accounts/:id",
  auth,
  authorize("admin"),
  accountController.deleteAccount
);

module.exports = router;

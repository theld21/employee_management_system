const express = require("express");
const { check } = require("express-validator");
const authController = require("../controllers/authController");
const { auth } = require("../middlewares/auth");

const router = express.Router();

// Register user
router.post(
  "/register",
  [
    check("username", "Username is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password must be at least 6 characters").isLength({
      min: 6,
    }),
    check("firstName", "First name is required").not().isEmpty(),
    check("lastName", "Last name is required").not().isEmpty(),
  ],
  authController.register
);

// Login user
router.post(
  "/login",
  [
    check("username", "Username is required").not().isEmpty(),
    check("password", "Password is required").exists(),
  ],
  authController.login
);

// Get current user
router.get("/me", auth, authController.getCurrentUser);

// Update current user profile
router.put("/profile", auth, authController.updateProfile);

// Change password
router.put(
  "/change-password",
  auth,
  [
    check("currentPassword", "Mật khẩu hiện tại là bắt buộc").not().isEmpty(),
    check("newPassword", "Mật khẩu mới phải có ít nhất 6 ký tự").isLength({
      min: 6,
    }),
    check("confirmPassword", "Xác nhận mật khẩu là bắt buộc").not().isEmpty(),
  ],
  authController.changePassword
);

module.exports = router;

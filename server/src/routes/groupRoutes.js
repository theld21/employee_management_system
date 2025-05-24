const express = require("express");
const { check } = require("express-validator");
const groupController = require("../controllers/groupController");
const { auth, authorize } = require("../middlewares/auth");

const router = express.Router();

// Get all users for adding to groups
router.get("/users", auth, authorize("admin"), groupController.getAllUsers);

// Create group
router.post(
  "/",
  auth,
  authorize("admin"),
  [
    check("name", "Name is required").notEmpty(),
    check("managerId", "Manager ID must be a valid MongoDB ID")
      .optional()
      .isMongoId(),
    check("parentGroupId", "Parent group ID must be a valid MongoDB ID")
      .optional()
      .isMongoId(),
  ],
  groupController.createGroup
);

// Get all groups
router.get("/", auth, authorize("admin"), groupController.getAllGroups);

// Get group by ID
router.get("/:groupId", auth, groupController.getGroupById);

// Update group
router.put(
  "/:groupId",
  auth,
  authorize("admin"),
  [
    check("name", "Name is required").optional().notEmpty(),
    check("managerId", "Manager ID must be a valid MongoDB ID")
      .optional()
      .isMongoId(),
  ],
  groupController.updateGroup
);

// Add member to group
router.post(
  "/:groupId/members",
  auth,
  authorize("admin"),
  [check("userId", "User ID is required").isMongoId()],
  groupController.addMember
);

// Remove member from group
router.delete(
  "/:groupId/members/:userId",
  auth,
  authorize("admin"),
  groupController.removeMember
);

// Delete group
router.delete(
  "/:groupId",
  auth,
  authorize("admin"),
  groupController.deleteGroup
);

module.exports = router;

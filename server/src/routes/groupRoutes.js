const express = require("express");
const { check } = require("express-validator");
const groupController = require("../controllers/groupController");
const { auth, authorize } = require("../middlewares/auth");

const router = express.Router();

// Create group
router.post(
  "/",
  auth,
  authorize("admin", "level1", "level2"),
  [
    check("name", "Name is required").notEmpty(),
    check("level", "Level must be a number between 1 and 3").isInt({
      min: 1,
      max: 3,
    }),
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
router.get(
  "/",
  auth,
  authorize("admin", "level1", "level2"),
  groupController.getAllGroups
);

// Get group by ID
router.get("/:groupId", auth, groupController.getGroupById);

// Update group
router.put(
  "/:groupId",
  auth,
  authorize("admin", "level1"),
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
  authorize("admin", "level1", "level2"),
  [check("userId", "User ID is required").isMongoId()],
  groupController.addMember
);

// Remove member from group
router.delete(
  "/:groupId/members/:userId",
  auth,
  authorize("admin", "level1", "level2"),
  groupController.removeMember
);

module.exports = router;

const { validationResult } = require("express-validator");
const Group = require("../models/Group");
const User = require("../models/User");

// Create a new group
exports.createGroup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, level, managerId, parentGroupId } = req.body;

    // Only admin and level1 can create level2 groups
    // Only admin, level1 and level2 can create level3 groups
    if (
      (level === 2 && !["admin", "level1"].includes(req.user.role)) ||
      (level === 3 && !["admin", "level1", "level2"].includes(req.user.role))
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to create this group level" });
    }

    // Verify manager exists
    if (managerId) {
      const manager = await User.findById(managerId);
      if (!manager) {
        return res.status(404).json({ message: "Manager not found" });
      }
    }

    // Verify parent group exists if provided
    if (parentGroupId) {
      const parentGroup = await Group.findById(parentGroupId);
      if (!parentGroup) {
        return res.status(404).json({ message: "Parent group not found" });
      }

      // Verify parent group is one level above
      if (parentGroup.level !== level - 1) {
        return res
          .status(400)
          .json({ message: "Parent group must be one level above this group" });
      }
    }

    // Create group
    const group = new Group({
      name,
      description,
      level,
      manager: managerId,
      parentGroup: parentGroupId,
    });

    await group.save();

    // Update parent group's childGroups array
    if (parentGroupId) {
      await Group.findByIdAndUpdate(parentGroupId, {
        $push: { childGroups: group._id },
      });
    }

    // Update manager's role based on group level
    if (managerId) {
      let role;
      if (level === 1) role = "level1";
      else if (level === 2) role = "level2";

      await User.findByIdAndUpdate(managerId, {
        group: group._id,
        ...(role && { role }),
      });
    }

    res.status(201).json(group);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all groups
exports.getAllGroups = async (req, res) => {
  try {
    // Only admin and managers can see all groups
    if (!["admin", "level1", "level2"].includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Not authorized to view all groups" });
    }

    const groups = await Group.find()
      .populate("manager", "firstName lastName username")
      .populate("parentGroup", "name")
      .sort({ level: 1, name: 1 });

    res.json(groups);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get group by ID
exports.getGroupById = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId)
      .populate("manager", "firstName lastName username email")
      .populate("parentGroup", "name level")
      .populate("childGroups", "name level")
      .populate("members", "firstName lastName username email");

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check authorization
    const userRole = req.user.role;
    const userGroup = req.user.group;

    if (
      userRole !== "admin" &&
      group.level === 1 &&
      userRole !== "level1" &&
      group.level === 2 &&
      !["level1", "level2"].includes(userRole) &&
      group._id.toString() !== userGroup?.toString() &&
      group.parentGroup?._id.toString() !== userGroup?.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this group" });
    }

    res.json(group);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update group
exports.updateGroup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { groupId } = req.params;
    const { name, description, managerId } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check authorization
    if (
      req.user.role !== "admin" &&
      group.level === 1 &&
      req.user.role !== "level1" &&
      group.level === 2 &&
      req.user.role !== "level1"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this group" });
    }

    // Update group
    group.name = name || group.name;
    group.description = description || group.description;

    // Handle manager change
    if (managerId && managerId !== group.manager?.toString()) {
      // Verify new manager exists
      const newManager = await User.findById(managerId);
      if (!newManager) {
        return res.status(404).json({ message: "Manager not found" });
      }

      // Update old manager if exists
      if (group.manager) {
        await User.findByIdAndUpdate(group.manager, {
          role: "level3",
          group: null,
        });
      }

      // Update new manager
      let role;
      if (group.level === 1) role = "level1";
      else if (group.level === 2) role = "level2";

      await User.findByIdAndUpdate(managerId, {
        group: group._id,
        role,
      });

      group.manager = managerId;
    }

    await group.save();

    res.json(group);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Add member to group
exports.addMember = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { groupId } = req.params;
    const { userId } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check authorization
    if (
      req.user.role !== "admin" &&
      group.level === 1 &&
      req.user.role !== "level1" &&
      group.level === 2 &&
      req.user.role !== "level2" &&
      group.manager?.toString() !== req.user.id
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to add members to this group" });
    }

    // Check if user is already in the group
    if (group.members.includes(userId)) {
      return res
        .status(400)
        .json({ message: "User is already a member of this group" });
    }

    // Add member to group
    group.members.push(userId);
    await group.save();

    // Update user's group
    await User.findByIdAndUpdate(userId, { group: groupId });

    res.json(group);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Remove member from group
exports.removeMember = async (req, res) => {
  try {
    const { groupId, userId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check authorization
    if (
      req.user.role !== "admin" &&
      group.level === 1 &&
      req.user.role !== "level1" &&
      group.level === 2 &&
      req.user.role !== "level2" &&
      group.manager?.toString() !== req.user.id
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to remove members from this group" });
    }

    // Check if user is the manager
    if (group.manager && group.manager.toString() === userId) {
      return res
        .status(400)
        .json({ message: "Cannot remove the group manager" });
    }

    // Remove member from group
    group.members = group.members.filter(
      (memberId) => memberId.toString() !== userId
    );
    await group.save();

    // Update user's group
    await User.findByIdAndUpdate(userId, { group: null });

    res.json({ message: "Member removed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

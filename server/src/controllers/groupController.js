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

    const { name, description, managerId, parentGroupId } = req.body;

    // Only admin can create groups
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to create groups" });
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
    }

    // Create group
    const group = new Group({
      name,
      description,
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

    // Update manager's group if specified
    if (managerId) {
      await User.findByIdAndUpdate(managerId, {
        group: group._id,
      });
    }

    res.status(201).json(group);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all groups with pagination
exports.getAllGroups = async (req, res) => {
  try {
    // Only admin can see all groups
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to view all groups" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const sortField = req.query.sort || "name";
    const sortDirection = req.query.direction === "desc" ? -1 : 1;
    const skip = (page - 1) * limit;

    // Build search query
    let searchQuery = {};
    if (search) {
      searchQuery = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ],
      };
    }

    // Validate sort field
    const allowedSortFields = ["name", "createdAt", "isActive"];
    const finalSortField = allowedSortFields.includes(sortField)
      ? sortField
      : "name";

    const groups = await Group.find(searchQuery)
      .populate("manager", "firstName lastName username")
      .populate("parentGroup", "name")
      .populate("members", "firstName lastName username")
      .sort({ [finalSortField]: sortDirection })
      .skip(skip)
      .limit(limit);

    const total = await Group.countDocuments(searchQuery);

    res.json({
      groups,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
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
      .populate("parentGroup", "name")
      .populate("childGroups", "name")
      .populate("members", "firstName lastName username email");

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check authorization - admin or group manager can view
    if (
      req.user.role !== "admin" &&
      group.manager?.toString() !== req.user.id
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
    const { name, description, managerId, parentGroupId } = req.body;

    // Only admin can update groups
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to update groups" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Verify manager exists if provided
    if (managerId) {
      const manager = await User.findById(managerId);
      if (!manager) {
        return res.status(404).json({ message: "Manager not found" });
      }
    }

    // Verify parent group exists if provided
    if (parentGroupId && parentGroupId !== groupId) {
      const parentGroup = await Group.findById(parentGroupId);
      if (!parentGroup) {
        return res.status(404).json({ message: "Parent group not found" });
      }
    }

    // Remove from old parent group if changing parent
    if (group.parentGroup && group.parentGroup.toString() !== parentGroupId) {
      await Group.findByIdAndUpdate(group.parentGroup, {
        $pull: { childGroups: groupId },
      });
    }

    // Update group
    group.name = name || group.name;
    group.description =
      description !== undefined ? description : group.description;

    if (managerId !== undefined) {
      // Remove old manager's group reference
      if (group.manager) {
        await User.findByIdAndUpdate(group.manager, {
          $unset: { group: 1 },
        });
      }
      group.manager = managerId || null;

      // Set new manager's group reference
      if (managerId) {
        await User.findByIdAndUpdate(managerId, {
          group: groupId,
        });
      }
    }

    if (parentGroupId !== undefined) {
      group.parentGroup = parentGroupId || null;

      // Add to new parent group if specified
      if (parentGroupId) {
        await Group.findByIdAndUpdate(parentGroupId, {
          $addToSet: { childGroups: groupId },
        });
      }
    }

    await group.save();

    // Populate the response
    const updatedGroup = await Group.findById(groupId)
      .populate("manager", "firstName lastName username")
      .populate("parentGroup", "name")
      .populate("members", "firstName lastName username");

    res.json(updatedGroup);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Add member to group
exports.addMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { memberIds } = req.body;

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ message: "Member IDs array is required" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Get existing member IDs
    const existingMemberIds = group.members.map((member) => member.toString());

    // Filter out members that are already in the group
    const newMemberIds = memberIds.filter(
      (id) => !existingMemberIds.includes(id)
    );

    if (newMemberIds.length === 0) {
      return res
        .status(400)
        .json({ message: "All selected members are already in the group" });
    }

    // Verify all users exist
    const users = await User.find({ _id: { $in: newMemberIds } });
    if (users.length !== newMemberIds.length) {
      return res.status(400).json({ message: "One or more users not found" });
    }

    // Add new members
    group.members.push(...newMemberIds);
    await group.save();

    // Populate members for response
    await group.populate("members", "firstName lastName username");

    res.json({
      message: "Members added successfully",
      group,
    });
  } catch (error) {
    console.error("Error adding members:", error);
    res.status(500).json({ message: "Error adding members to group" });
  }
};

// Remove member from group
exports.removeMember = async (req, res) => {
  try {
    const { groupId, userId } = req.params;

    // Only admin can remove members
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to remove members from groups" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Remove user from group
    group.members = group.members.filter(
      (member) => member.toString() !== userId
    );
    await group.save();

    // Update user's group reference
    await User.findByIdAndUpdate(userId, { $unset: { group: 1 } });

    // Return updated group with populated members
    const updatedGroup = await Group.findById(groupId)
      .populate("manager", "firstName lastName username")
      .populate("parentGroup", "name")
      .populate("members", "firstName lastName username email");

    res.json(updatedGroup);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete group
exports.deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    // Only admin can delete groups
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to delete groups" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Remove group from parent's childGroups array
    if (group.parentGroup) {
      await Group.findByIdAndUpdate(group.parentGroup, {
        $pull: { childGroups: groupId },
      });
    }

    // Update all members to remove group reference
    await User.updateMany({ group: groupId }, { $unset: { group: 1 } });

    // Delete the group
    await Group.findByIdAndDelete(groupId);

    res.json({ message: "Group deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all users for adding to groups
exports.getAllUsers = async (req, res) => {
  try {
    // Only admin can see all users
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to view all users" });
    }

    const search = req.query.search || "";

    // Build search query
    let searchQuery = { isActive: true };
    if (search) {
      searchQuery.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(searchQuery)
      .select("firstName lastName username email role")
      .sort({ firstName: 1, lastName: 1 })
      .limit(100);

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const News = require("../models/News");
const { validationResult } = require("express-validator");

// Create news article
exports.createNews = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, tags } = req.body;
    let thumbnail = "";

    // Convert uploaded file to base64 if exists
    if (req.file) {
      const base64Image = `data:${
        req.file.mimetype
      };base64,${req.file.buffer.toString("base64")}`;
      thumbnail = base64Image;
    }

    // Parse tags if it's a string
    let parsedTags = [];
    if (tags) {
      if (typeof tags === "string") {
        parsedTags = tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
      } else if (Array.isArray(tags)) {
        parsedTags = tags;
      }
    }

    const news = new News({
      title,
      content,
      thumbnail,
      tags: parsedTags,
      createdBy: req.user.id,
    });

    await news.save();

    res.status(201).json(news);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get news list with pagination
exports.getNewsList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const query = search
      ? {
          $or: [
            { title: { $regex: search, $options: "i" } },
            { content: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const total = await News.countDocuments(query);
    const news = await News.find(query)
      .populate("createdBy", "firstName lastName")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Mark news as new if created within last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const newsWithNewFlag = news.map((item) => ({
      ...item.toObject(),
      isNew: item.createdAt > oneDayAgo,
    }));

    res.json({
      news: newsWithNewFlag,
      pagination: {
        page,
        totalPages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get news detail
exports.getNewsDetail = async (req, res) => {
  try {
    const news = await News.findById(req.params.id).populate(
      "createdBy",
      "firstName lastName"
    );
    if (!news) {
      return res.status(404).json({ message: "News not found" });
    }
    res.json(news);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update news article
exports.updateNews = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, tags } = req.body;

    const news = await News.findById(req.params.id);
    if (!news) {
      return res.status(404).json({ message: "News not found" });
    }

    // Check if user is the creator or admin
    if (
      news.createdBy.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Update basic fields
    news.title = title;
    news.content = content;

    // Handle thumbnail update
    if (req.file) {
      // New file uploaded, convert to base64
      const base64Image = `data:${
        req.file.mimetype
      };base64,${req.file.buffer.toString("base64")}`;
      news.thumbnail = base64Image;
    } else if (req.body.removeThumbnail === "true") {
      // Remove thumbnail if explicitly requested
      news.thumbnail = "";
    }
    // If no file and removeThumbnail is not true, keep existing thumbnail

    // Parse tags if it's a string
    let parsedTags = [];
    if (tags) {
      if (typeof tags === "string") {
        parsedTags = tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
      } else if (Array.isArray(tags)) {
        parsedTags = tags;
      }
    }
    news.tags = parsedTags;

    await news.save();

    res.json(news);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete news article
exports.deleteNews = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) {
      return res.status(404).json({ message: "News not found" });
    }

    // Check if user is the creator or admin
    if (
      news.createdBy.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await news.deleteOne();

    res.json({ message: "News deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

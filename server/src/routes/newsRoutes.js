const express = require("express");
const { check } = require("express-validator");
const newsController = require("../controllers/newsController");
const { auth, authorize } = require("../middlewares/auth");
const upload = require("../middlewares/upload");

const router = express.Router();

// Create news article (admin only)
router.post(
  "/",
  auth,
  authorize("admin"),
  upload.single("thumbnail"),
  [
    check("title", "Title is required").notEmpty(),
    check("content", "Content is required").notEmpty(),
  ],
  newsController.createNews
);

// Get news list with pagination
router.get("/", newsController.getNewsList);

// Get news detail
router.get("/:id", newsController.getNewsDetail);

// Update news article (admin only)
router.put(
  "/:id",
  auth,
  authorize("admin"),
  upload.single("thumbnail"),
  [
    check("title", "Title is required").notEmpty(),
    check("content", "Content is required").notEmpty(),
  ],
  newsController.updateNews
);

// Delete news article (admin only)
router.delete("/:id", auth, authorize("admin"), newsController.deleteNews);

module.exports = router;

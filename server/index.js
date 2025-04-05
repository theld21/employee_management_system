const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB with retry logic
const connectWithRetry = () => {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      console.log("Connected to MongoDB");
      initializeData();
    })
    .catch((err) => {
      console.error(
        "Could not connect to MongoDB, retrying in 5 seconds...",
        err
      );
      setTimeout(connectWithRetry, 5000);
    });
};

connectWithRetry();

// Define a schema and model for our data
const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  description: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Product = mongoose.model("Product", productSchema);

// API Routes
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/products", async (req, res) => {
  try {
    const product = new Product(req.body);
    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Initialize some data if none exists
const initializeData = async () => {
  try {
    const count = await Product.countDocuments();
    if (count === 0) {
      const initialProducts = [
        { name: "Laptop", price: 1200, description: "High-performance laptop" },
        {
          name: "Smartphone",
          price: 800,
          description: "Latest smartphone model",
        },
        {
          name: "Headphones",
          price: 200,
          description: "Noise-cancelling headphones",
        },
      ];

      await Product.insertMany(initialProducts);
      console.log("Sample data initialized");
    }
  } catch (error) {
    console.error("Error initializing data:", error);
  }
};

// Start the server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

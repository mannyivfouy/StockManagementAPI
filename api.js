const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const app = express();
const PORT = 4000;

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "replace_this_with_strong_secret";
const JWT_EXPIRES_IN = "7d";

app.use(express.json());
app.use(cors());
app.use("/images", express.static("images"));

mongoose
  // .connect("mongodb+srv://yivfouy:qZ8ghvwTkXxIWi2R@cluster0.jzoy2rv.mongodb.net/StockManagementSystem")   // --------------> Cloud Database
  .connect("mongodb://localhost:27017/StockManagementDB") // ----------------> Local Database
  .then(() => console.log("✅ Mongo Connected!!!"))
  .catch((err) => console.error("DataBase Connection Error!", err));

// ! Endpoint User //

const userSchema = new mongoose.Schema({
  userID: { type: Number, unique: true },
  fullname: { type: String, required: true },
  username: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  imageUrl: { type: String, default: "/images/default.png" },
  role: { type: String, default: "User" },
  created_date: { type: Date, default: Date.now },
});

userSchema.plugin(AutoIncrement, { inc_field: "userID" });

userSchema.set("toJSON", {
  transform: (doc, ret) => {
    const { _id, userID, ...rest } = ret;
    return { _id, userID, ...rest };
  },
});

const User = mongoose.model("Users", userSchema);

// Login
app.post("/api/user/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password required" });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const pass = await User.findOne({ password });
    if (!pass) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // const match = await bcrypt.compare(password, user.password);
    // if (!match) {
    //   return res.status(401).json({ message: "Invalid username or password" });
    // }

    // sign a token (don't include sensitive fields)
    const payload = {
      id: user._id,
      userID: user.userID,
      username: user.username,
      role: user.role,
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    const userSafe = {
      id: user._id,
      userID: user.userID,
      fullname: user.fullname,
      username: user.username,
      email: user.email,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
      role: user.role,
      imageUrl: user.imageUrl,
      created_date: user.created_date,
    };

    return res.json({ token, user: userSafe });
  } catch (err) {
    console.error("Login error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Get All User
app.get("/api/user", async (req, res) => {
  try {
    const user = await User.find().select("-password");
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get User By Username
app.get("/api/user/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select(
      "-password"
    );

    if (!user) {
      return res.status(404).json({ message: "User Not Found" });
    }

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get User By ID
app.get("/api/user/id/:id", async (req, res) => {
  try {
    const user = await User.findOne({ userID: req.params.id }).select(
      "-password"
    );

    if (!user) {
      return res.status(404).json({ message: "User Not Found" });
    }

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete User By Username
app.delete("/api/user/:username", async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ username: req.params.username });

    if (!user) {
      return res.status(404).json({ message: "User Not Found" });
    }

    res.status(200).json({ message: "User deleted successfully", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete User By ID
app.delete("/api/user/id/:id", async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ userID: req.params.id });

    if (!user) {
      return res.status(404).json({ message: "User Not Found" });
    }

    res.status(200).json({ message: "User deleted successfully", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add User
app.post("/api/user", async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update User By ID
app.put("/api/user/id/:id", async (req, res) => {
  try {
    const id = Number(req.params.id); // ensure numeric
    const user = await User.findOne({ userID: id });
    if (!user) return res.status(404).json({ message: "User Not Found" });

    // Only allow these fields to be updated
    const allowed = [
      "fullname",
      "username",
      "gender",
      "dateOfBirth",
      "email",
      "imageUrl",
      "role",
      "password",
    ];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) user[field] = req.body[field];
    });

    // If password is being updated, hash it here (if you use bcrypt)
    // if (req.body.password) {
    //   user.password = await bcrypt.hash(req.body.password, 10);
    // }

    await user.save(); // runs full validation on document
    res.status(200).json(user);
  } catch (err) {
    console.error("Update user error:", err);
    res.status(400).json({ message: err.message });
  }
});

// ! image

const multer = require("multer");
const path = require("path");

// Save uploaded files in 'images/' folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "images/"),
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Upload avatar
app.post("/api/user/upload-avatar", upload.single("avatar"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  const url = `/images/${req.file.filename}`;
  res.status(200).json({ url });
});

// ! Endpoint Product //

const productSchema = new mongoose.Schema({
  productID: { type: Number, unique: true },
  product_name: { type: String, required: true },
  price: { type: Number, required: true },
  qty: { type: Number, require: true },
});

productSchema.plugin(AutoIncrement, { inc_field: "productID" });

productSchema.set("toJSON", {
  transform: (doc, ret) => {
    const { _id, productID, ...rest } = ret;
    return { _id, productID, ...rest };
  },
});

const Product = mongoose.model("Products", userSchema);

app.listen(PORT, () => {
  console.log(`🚀 Server Running At http://localhost:${PORT}`);
});

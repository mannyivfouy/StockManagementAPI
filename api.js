const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const app = express();
const PORT = 4000;

app.use(express.json());
app.use(cors());
app.use("/images", express.static("images"));

mongoose
  // .connect("mongodb+srv://yivfouy:qZ8ghvwTkXxIWi2R@cluster0.jzoy2rv.mongodb.net/StockManagementSystem")   // --------------> Cloud Database
  .connect("mongodb://localhost:27017/StockManagementDB") // ----------------> Local Database
  .then(() => console.log("Mongo Connected!!!"))
  .catch((err) => console.error("DataBase Connection Error!", err));

const userSchema = new mongoose.Schema({
  userID: { type: Number, unique: true },
  fullname: { type: String, required: true },
  username: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  imageUrl: { type: String, default: "/images/avatar.png" },
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
    const user = await User.findOneAndUpdate(
      { userID: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(400).json({ message: "User Not Found" });
    }

    res.status(200).json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server Running At http://localhost:${PORT}`);
});

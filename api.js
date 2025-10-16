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
  .connect("mongodb://localhost:27017/StockManagementDB")
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
  confirmPassword: {
    type: String,
    required: true,
    validate: {
      validator: function (value) {
        return value === this.password;
      },
      message: "Passwords not match.",
    },
  },
  imageUrl: { type: String, default: "/images/default_img.png" },
  role: { type: String, default: "User" },
  created_date: { type: Date, default: Date.now },
});

userSchema.plugin(AutoIncrement, { inc_field: "userID" });

const User = mongoose.model("Users", userSchema);

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

// Get All User
app.get("/api/user", async (req, res) => {
  try {
    const user = await User.find();
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get User By Username
app.get("/api/user/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });

    if (!user) {
      return res.status(404).json({ message: "User Not Found" });
    }

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get User By ID

// Delete User By Username
app.delete("/api/user/:username", async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ username: req.params.username });

    if (!user) {
      return res.status(404).json({ message: "User Not Found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json.apply({ message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server Running At http://localhost:${PORT}`);
});

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/employee", require("./routes/employeeRoutes"));
app.use("/api/roster", require("./routes/rosterRoutes"));

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("=== connected to MongoDB successfully ==="))
  .catch((err) =>
    console.error("Error when connecting to MongoDB:", err.message),
  );

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`server is running on port: ${PORT}`);
});

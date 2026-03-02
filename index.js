const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const routes = require("./routes/index");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/files", express.static(path.join(__dirname, "public/files")));

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Node.js API" });
});

app.use("/api/v1", routes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const postRoutes = require("./routes/postRoute");

dotenv.config();                // Load .env variables
const app = express();

app.use(cors());               // Allow frontend connection
app.use(express.json());       // Parse JSON body

app.use("/api/post", postRoutes);  // All routes like /generate, /publish

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

const express = require("express");
const router = express.Router();
const generateAndPost = require("../utils/generatePost"); // adjust path if needed

router.post("/create", async (req, res) => {
  try {
    const topic = req.body.topic || "Latest AI News"; // Optional user topic
    const result = await generateAndPost(topic);
    res.status(200).json({ success: true, response: result });
  } catch (error) {
    console.error("❌ Error generating post:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;




 



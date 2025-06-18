// controllers/postController.js

const axios = require('axios');
require('dotenv').config();

exports.generateAndPublishPost = async (req, res) => {
  const { topic } = req.body;

  if (!topic) return res.status(400).json({ error: 'Topic is required' });

  // Prompt for Gemini
  const prompt = `
You are a professional SEO blog writer. Write a 2000-word blog post for "learnnewai.com" about "${topic}" in the AI niche. 
- Use SEO best practices.
- Include H1 to H3 headings.
- Add internal links like /top-ai-tools, /gemini-vs-chatgpt.
- Add a short engaging intro and a strong conclusion.
`;

  try {
    // Step 1: Generate content using Gemini API
    const geminiRes = await axios.post(
      'https://gemini-1-5-flash.p.rapidapi.com/',
      {
        model: 'gemini-1.5-flash',
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          'x-rapidapi-key': process.env.RAPIDAPI_KEY,
          'x-rapidapi-host': 'gemini-1-5-flash.p.rapidapi.com',
          'Content-Type': 'application/json',
        },
      }
    );

    const fullContent = geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!fullContent) throw new Error('❌ Gemini did not return content.');

    // Extract title from H1 if available
    const titleMatch = fullContent.match(/^#+\s*(.*)/);
    const title = titleMatch ? titleMatch[1] : `AI Blog: ${topic}`;

    // Step 2: Publish to WordPress
    const site = process.env.WP_SITE;
    const user = process.env.WP_USER;
    const password = process.env.WP_APP_PASSWORD;
    const credentials = Buffer.from(`${user}:${password}`).toString('base64');

    const wpRes = await axios.post(
      `${site}/wp-json/wp/v2/posts`,
      { title, content: fullContent, status: 'publish', categories: [1] },
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Final Response
    res.json({
      success: true,
      wpLink: wpRes.data.link,
      title,
      content: fullContent,
    });
  } catch (error) {
    console.error('❌ Error in generateAndPublishPost:', error.message);
    res.status(500).json({ error: error.message });
  }
};

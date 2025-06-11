const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

async function generatePostContent(topic) {
  const prompt = `
You are an SEO expert AI blog writer. Write a 2000-word blog for the site "learnnewai.com" on the topic: ${topic}.
- Must be SEO-optimized
 - Takes the user’s topic and explicitly requests a clickbait title (attention-grabbing, engaging, and concise) 
 - Add Faqs After End Of Article
- Use H1-H3 headings
- Add internal links like /top-ai-tools, /gemini-vs-chatgpt
- Use relevant keywords and add a conclusion.
  `;

  try {
    const response = await axios.post(
      'https://gemini-1-5-flash.p.rapidapi.com/', // Correct endpoint
      {
        model: 'gemini-1.5-flash',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.7,
      },
      {
        headers: {
          'x-rapidapi-key': '8e3573e266msh59690d31e16a788p15037fjsn91666640a99f', // Provided API key
          'x-rapidapi-host': 'gemini-1-5-flash.p.rapidapi.com',
          'Content-Type': 'application/json',
        },
      }
    );

    const text = response.data.choices?.[0]?.message?.content || 'No content generated';
    if (text === 'No content generated') {
      throw new Error('Failed to generate content from Gemini API');
    }
    const cleanedText = text.replace(/[*\#]/g, '');
    return cleanedText;
    
  } catch (error) {
    console.error('Gemini API Error:', error.response?.data || error.message);
    throw error;
  }
}

async function postToWordPress(title, content) {
  const site = process.env.WP_SITE;
  const user = process.env.WP_USER;
  const password = process.env.WP_APP_PASSWORD;
  const credentials = Buffer.from(`${user}:${password}`).toString('base64');

  try {
    const response = await axios.post(
      `${site}/wp-json/wp/v2/posts`,
      {
        title,
        content,
        status: 'publish',
      },
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('WordPress API Error:', error.response?.data || error.message);
    throw error;
  }
}

async function generateAndPost(topic) {
  try {
    const content = await generatePostContent(topic);
    const titleMatch = content.match(/^#+\s*(.*)/);
    const title = titleMatch ? titleMatch[1] : `${topic}`;
    const post = await postToWordPress(title, content);
    return post;
  } catch (error) {
    console.error('Error in generateAndPost:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = generateAndPost;
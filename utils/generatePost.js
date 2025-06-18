const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

async function generatePostContent(topic) {
  const prompt = `  
You are a Human blog writer. Write a, approx 1500-word article in hindi write like you talking to your friend about: ${topic}.  

Rules:  

1. Title: Create a strong clickbait title yourself (e.g., "This AI Trick Will Change Your Life!").  
2. SEO-Friendly: Use easy keywords for better Google ranking.  
3. Headings:  
   - H1: Main title
   - H2: Key sections
   - H3: Small points  
4. Internal Links: Add links like [/top-ai-tools](#) or [/gemini-vs-chatgpt](#).  
5. FAQs: Add 2-3 simple questions at the end (e.g., "Is AI safe?").  
6. Conclusion: End with a short, clear summary approx 100 words.  
7. Write a 1500-word article
8. Always try to check the authentic and latest data and write article and all with auth official web site like government websites or official website proof and reference.
9. Make supense for user to read next paragraph try to add some poetry reveleant to article in betwwen paragraph max 2 poetry
10. Write in very simple words a anyone can understand. 
`;

  try {
    const response = await axios.post(
      'https://gemini-1-5-flash.p.rapidapi.com/',
      {
        model: 'gemini-1.5-flash',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
        temperature: 0.7,
      },
      {
        headers: {
          'x-rapidapi-key': '8e3573e266msh59690d31e16a788p15037fjsn91666640a99f',
          'x-rapidapi-host': 'gemini-1-5-flash.p.rapidapi.com',
          'Content-Type': 'application/json',
        },
      }
    );

    const text = response.data.choices?.[0]?.message?.content || 'No content generated';
    if (text === 'No content generated') {
      throw new Error('Failed to generate content from Gemini API');
    }
    return text;
  } catch (error) {
    console.error('Gemini API Error:', error.response?.data || error.message);
    throw error;
  }
}

async function generateImage(prompt) {
  const options = {
    method: 'GET',
    url: 'https://flux-api-4-custom-models-100-style.p.rapidapi.com/create-v2',
    params: {
      prompt: prompt,
      aspect_ratio: '16:9',
    },
    headers: {
      'x-rapidapi-key': '8e3573e266msh59690d31e16a788p15037fjsn91666640a99f',
      'x-rapidapi-host': 'flux-api-4-custom-models-100-style.p.rapidapi.com',
    },
  };

  try {
    const response = await axios.request(options);
    if (response.data.status === 'success' && response.data.image_link) {
      console.log('Generated image URL:', response.data.image_link);
      return response.data.image_link;
    } else {
      throw new Error('Image link not found in response');
    }
  } catch (error) {
    console.error('Flux API Error:', error.response?.data || error.message);
    return null;
  }
}

async function uploadImageToWordPress(imageUrl, filename, credentials) {
  try {
    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      headers: { 'Accept': 'image/*' }
    });
    const imageData = Buffer.from(imageResponse.data);

    let contentType = 'image/jpeg';
    if (imageUrl.toLowerCase().endsWith('.png')) contentType = 'image/png';
    else if (imageUrl.toLowerCase().endsWith('.gif')) contentType = 'image/gif';

    const response = await axios.post(
      `${process.env.WP_SITE}/wp-json/wp/v2/media`,
      imageData,
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}.${contentType.split('/')[1]}"`,
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      }
    );
    console.log('Image uploaded to WordPress:', response.data.source_url);
    return response.data.source_url;
  } catch (error) {
    console.error('WordPress Image Upload Error:', error.response?.data || error.message);
    return null;
  }
}

async function postToWordPress(title, content, images) {
  const site = process.env.WP_SITE;
  const user = process.env.WP_USER;
  const password = process.env.WP_APP_PASSWORD;
  const credentials = Buffer.from(`${user}:${password}`).toString('base64');

  let featuredMediaId = null;

  if (images.length > 0) {
    try {
      const imgResponse = await axios.get(images[0].imageUrl, {
        responseType: 'arraybuffer',
      });

      const res = await axios.post(
        `${site}/wp-json/wp/v2/media`,
        imgResponse.data,
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'image/jpeg',
            'Content-Disposition': `attachment; filename="featured.jpg"`,
          },
        }
      );
      featuredMediaId = res.data.id;
    } catch (err) {
      console.error('Failed to set featured image:', err.response?.data || err.message);
    }
  }

  try {
    const response = await axios.post(
      `${site}/wp-json/wp/v2/posts`,
      {
        title,
        content,
        status: 'draft',
        featured_media: featuredMediaId || undefined,
      },
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('WordPress Post Error:', error.response?.data || error.message);
    throw error;
  }
}
 

async function generateAndPost(topic) {
  try {
    const content = await generatePostContent(topic);

    // Extract headings
    const headingRegex = /^#{1,3}\s*(.+)$/gm;
    let match;
    const headings = [];
    while ((match = headingRegex.exec(content)) !== null) {
      headings.push(match[1].trim());
    }

    // Generate images
    const images = [];
    for (const heading of headings.slice(0, 1)) {
      const imageUrl = await generateImage(
        `Create a modern, try to add emotions on visuals and visually appealing 16:9 image about "${heading}", following the design trends. 
         on "${heading}"`
      );

      // const imageUrl = await generateImage(`Create an image about: ${heading}`);
      if (imageUrl) {
        const filename = heading.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const uploadedImageUrl = await uploadImageToWordPress(
          imageUrl,
          filename,
          Buffer.from(`${process.env.WP_USER}:${process.env.WP_APP_PASSWORD}`).toString('base64')
        );
        if (uploadedImageUrl) {
          images.push({ heading, imageUrl: uploadedImageUrl });
        }
      }
    }

    const titleMatch = content.match(/^#\s*(.*)/m);
    const title = titleMatch ? titleMatch[1].replace(/[#*]+/g, '').trim() : topic;

    // Remove * and # characters before posting
    const cleanedContent = content.replace(/[*#]+/g, ''); // ← Removed markdown symbols here

    const post = await postToWordPress(title, cleanedContent, images);
    return post;
  } catch (error) {
    console.error('Error in generateAndPost:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = generateAndPost;

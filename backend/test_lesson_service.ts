require('dotenv').config();
const { generateLesson } = require('./src/services/lessonService');

async function test() {
  console.log("Using API Key:", process.env.GROQ_API_KEY ? "Found" : "Missing");
  try {
    const result = await generateLesson('hindi', 'beginner');
    console.log("Successfully generated lesson:");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error generating lesson:", error);
  }
}

test();

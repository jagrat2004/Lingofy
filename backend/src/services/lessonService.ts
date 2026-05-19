import Groq from "groq-sdk";

async function callGroq(prompt: string): Promise<string> {
  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: "You are a language quiz generator for a music app.\nCRITICAL RULE: Every single generation must be completely different from previous ones. Never repeat the same words, phrases, or questions. Always pick different vocabulary.\nAlways respond with valid JSON only. No markdown, no backticks, no preamble. Just raw JSON."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 1.0,
    top_p: 0.9,
    frequency_penalty: 0.8,
    presence_penalty: 0.6,
    max_tokens: 2000,
  });
  return completion.choices[0].message.content ?? "";
}

async function generateWithRetry(prompt: string) {
  try {
    const raw = await callGroq(prompt);
    const cleaned = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    // retry once on failure
    try {
      const raw = await callGroq(prompt);
      const cleaned = raw.replace(/```json|```/g, "").trim();
      return JSON.parse(cleaned);
    } catch {
      throw new Error("Quiz generation failed. Please try again.");
    }
  }
}

function getRandomTopics(language: "hindi" | "spanish"): string {
  const categories = [
    "Greetings and basic conversation phrases",
    "Family members and relationships", 
    "Food, drinks, and restaurant vocabulary",
    "Colors, sizes, and describing things",
    "Daily action verbs (eat, sleep, walk, talk)",
    "Emotions and feelings",
    "Places in a city and directions",
    "Shopping and asking for prices",
    "Numbers, days, and time expressions",
    "Common phrases used in songs and music lyrics"
  ];
  const shuffled = categories.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3).join(" + ");
}

function getRandomDifficulty(): string {
  const extras = [
    "Focus on informal everyday speech.",
    "Focus on formal polite expressions.",
    "Focus on slang and colloquial phrases.",
    "Focus on action verbs and their usage.",
    "Focus on describing people and places.",
    "Focus on asking and answering questions.",
    "Focus on numbers, dates, and time.",
    "Focus on common idioms and expressions.",
  ];
  return extras[Math.floor(Math.random() * extras.length)];
}

export const generateLesson = async (language: 'hindi' | 'spanish', pastLessonsCount: number = 0) => {
  const randomSeed = Math.floor(Math.random() * 100000);
  const randomTopics = getRandomTopics(language);
  const randomDifficulty = getRandomDifficulty();

  // Keep dynamic difficulty logic
  let level = "beginner";
  if (pastLessonsCount >= 10) level = "advanced and native-like";
  else if (pastLessonsCount >= 5) level = "upper-intermediate";
  else if (pastLessonsCount >= 2) level = "intermediate";

  const prompt = `
You are a language tutor for Lingofy, a music-based language 
learning app. Your job is to teach English speakers basic 
${language} vocabulary and phrases.

Session ID (guarantees unique questions): ${randomSeed}
Language being taught: ${language}
Student level: ${level}
Focus categories for this session: ${randomTopics}

ABSOLUTE RULES — READ CAREFULLY:

1. ALL questionText must be written in ENGLISH ONLY
   Never write the question itself in Hindi or Spanish
   
2. Question structure depends on type:

   translate_word:
   - questionText: "What is the ${language} word/phrase for '[English word]'?"
   - targetWord: the English word (shown large on screen)
   - options: 4 ${language} words/phrases
   - correctAnswer: the correct ${language} translation
   
   multiple_choice:
   - questionText: "What does '[${language} word]' mean in English?"
   - options: 4 English meanings
   - correctAnswer: correct English meaning
   
   fill_blank:
   - questionText: "Fill in the blank to complete the ${language} sentence:"
   - sentence shown: the ${language} sentence with ___ gap
   - always include English translation in parentheses after
   - options: 4 ${language} words that could fill the blank
   - correctAnswer: the correct ${language} word
   
   match_meaning:
   - questionText: "What does this ${language} word/phrase mean?"
   - targetWord: the ${language} word (shown large)
   - options: 4 English meanings
   - correctAnswer: correct English meaning

3. BANNED TOPICS — NEVER generate questions about:
   - Smartphones, technology, gadgets
   - Movies, TV shows, celebrities  
   - Sports teams or scores
   - History or geography facts
   - Science or math
   - General knowledge trivia
   - Schedules or timetables
   - Anything not in the 10 categories listed

4. Questions must come from ONLY these categories:
   Greetings, Numbers & Time, Family, Food & Drink,
   Colors & Descriptions, Places & Directions,
   Daily Verbs, Shopping, Emotions, Music & Feelings

5. Each question must test a DIFFERENT word — no repeats

6. For Hindi questions:
   - Use Devanagari script for Hindi words in options/answers
   - Add romanized pronunciation in explanation
   - Example option: "भूखा (bhookha)"

7. For Spanish questions:
   - Use proper Spanish with accents (á é í ó ú ñ ¿ ¡)
   - Keep vocabulary conversational and natural

8. Make questions EDUCATIONAL and PROGRESSIVE:
   - Mix easy and slightly harder vocabulary
   - Each question should genuinely teach something useful
   - Think: "Would a Duolingo lesson include this?" 
     If yes → include. If no → reject.

9. Vary question types — minimum 2 of each type across 10 Qs

10. correctAnswer must EXACTLY match one of the 4 options
    (same spelling, same script, same capitalization)

Generate exactly 10 questions following ALL rules above.

Respond with ONLY raw JSON — zero markdown, zero backticks,
zero text outside the JSON object.

JSON Schema:
{
  "lessonTitle": "describe the focus e.g. 'Hindi Basics: Food & Emotions'",
  "language": "${language}",
  "questions": [
    {
      "id": 1,
      "type": "translate_word | multiple_choice | fill_blank | match_meaning",
      "questionText": "ALWAYS IN ENGLISH",
      "targetWord": "word shown large on screen (English for translate_word, ${language} for match_meaning)",
      "sentence": "full sentence with ___ for fill_blank type only",
      "options": ["option1", "option2", "option3", "option4"],
      "correctAnswer": "must exactly match one option",
      "explanation": "1 sentence in English explaining the answer + pronunciation tip for Hindi"
    }
  ]
}
`;

  const result = await generateWithRetry(prompt);
  return result;
};

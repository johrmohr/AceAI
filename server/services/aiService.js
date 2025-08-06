// server/services/aiService.js
const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function getAIFeedback(code, transcript, problem) {
    const { title, description } = problem;

    const prompt = `
        Role: You are an expert technical interviewer providing live, helpful feedback to a candidate. Be encouraging but also guide them toward the correct solution. Do not give away the answer directly.

        Context: The user is solving the "${title}" problem.
        Description: "${description}"

        User's Current Code:
        \`\`\`
        ${code}
        \`\`\`

        User's Spoken Thoughts (Transcript):
        "${transcript}"

        Your Task:
        Based on the code and their spoken thoughts, provide one short, concise piece of feedback (2-3 sentences max).

        - If they are on the right track, offer encouragement.
        - If their current approach is inefficient, gently ask if they can think of a more optimal way.
        - If they are stuck, provide a small, high-level hint.
        - If there is no transcript, base your feedback solely on the code.
    `;

    try {
        console.log("Sending prompt to OpenAI...");
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 100,
            temperature: 0.5,
        });

        console.log("Full OpenAI response:", JSON.stringify(response, null, 2));

        if (response.choices && response.choices.length > 0 && response.choices[0].message.content) {
            return response.choices[0].message.content.trim();
        } else {
            console.log("No valid feedback found in OpenAI response.");
            return "No feedback available at the moment.";
        }
    } catch (error) {
        console.error("Error getting AI feedback:", error);
        return "There was an error generating feedback. Please try again.";
    }
}

module.exports = { getAIFeedback };

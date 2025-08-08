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

// --- Final Interview Feedback ---
async function getFinalInterviewFeedback({ code, transcript, problem, validationSummary, validationResults }) {
    const { title, description, difficulty } = problem || {};

    const prompt = `You are an expert technical interviewer writing a concise end-of-interview review.

Problem: ${title || ''} (${difficulty || ''})
Description: ${description || ''}

Candidate Code:\n\n${code || ''}\n\n
Candidate Transcript:\n${transcript || ''}

Hidden Test Summary: ${validationSummary ? JSON.stringify(validationSummary) : 'No tests were run.'}
Hidden Test Details: ${validationResults ? JSON.stringify(validationResults) : 'N/A'}

Output a strict JSON object with these fields only:
{
  "summary": string,            // 2-3 sentences summarizing performance
  "strengths": string[],        // bullet points of what went well
  "areas_for_improvement": string[], // bullet points to improve
  "next_steps": string[]        // actionable next steps to practice
}
Keep it specific to their approach and explanation.`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 300,
            temperature: 0.3,
        });

        const content = response?.choices?.[0]?.message?.content?.trim();
        try {
            const parsed = JSON.parse(content);
            return parsed;
        } catch (_) {
            // Fallback: wrap as summary-only if parsing fails
            return {
                summary: content || 'No feedback available.',
                strengths: [],
                areas_for_improvement: [],
                next_steps: [],
            };
        }
    } catch (error) {
        console.error('Error getting final interview feedback:', error);
        return {
            summary: 'There was an error generating final feedback. Please try again.',
            strengths: [],
            areas_for_improvement: [],
            next_steps: [],
        };
    }
}

module.exports.getFinalInterviewFeedback = getFinalInterviewFeedback;

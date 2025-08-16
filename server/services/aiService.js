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

// --- Q&A during interview ---
async function getAIAnswerToQuestion({ question, problem }) {
    const { title, description, difficulty } = problem || {};
    const system = `You are Rachel, a friendly but concise technical interviewer.
- Keep answers short (2-4 sentences) and practical.
- Do not reveal full solutions or code unless explicitly asked to.
- Use ONLY the provided context about the problem and the interview environment.
- Do NOT ask the candidate questions back. Do NOT include any follow-up questions. Answer declaratively.
- Environment constraint: Only Python and JavaScript are supported in this interview environment. If asked about any other language (e.g., C++, Java, Go), the correct answer is that they are not supported.
- If asked about tools, permissions, or capabilities beyond the provided environment, answer based on these constraints only.`;

    const user = `Problem: ${title || ''} (${difficulty || ''})\nDescription: ${description || ''}\n\nCandidate question: ${question}`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: 'system', content: system },
                { role: 'user', content: user },
            ],
            max_tokens: 120,
            temperature: 0.3,
        });
        const content = response?.choices?.[0]?.message?.content?.trim();
        // Hard guard: strip trailing question marks to avoid model asking back
        const safe = (content || '').replace(/\?\s*$/,'').trim();
        return safe || 'Let me think about that for a moment.';
    } catch (error) {
        console.error('Error answering question:', error);
        return 'Sorry, I ran into an issue answering that. Please try asking again.';
    }
}

module.exports.getAIAnswerToQuestion = getAIAnswerToQuestion;

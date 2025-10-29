const express = require('express');
const { OpenAI } = require('openai');
const router = express.Router();

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// AI Chat endpoint
router.post('/message', async (req, res) => {
    try {
        const { message, mode, language, context, userClass, subject } = req.body;

        console.log('Received request:', { mode, language, userClass, subject });

        // Create system prompt based on mode and language
        const systemPrompts = {
            chat: `You are a friendly, grandmother-like tutor who explains concepts in ${language}. Use simple, comforting language mixed with local expressions like "beta" and "baccha". Explain in Hinglish if needed. Be warm and supportive.`,
            study: `You are a detailed academic tutor for class ${userClass} ${subject}. Provide comprehensive explanations with examples from the curriculum. Be thorough but clear.`,
            exam: `You are a strict exam-focused tutor. Provide practice questions, MCQs, and exam-style explanations. Be concise and focused on scoring marks.`,
            coding: `You are a programming tutor. Explain code concepts, provide examples, and help debug problems. Use practical examples and best practices.`
        };

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: systemPrompts[mode] || systemPrompts.chat
                },
                {
                    role: "user", 
                    content: `Context from textbook: ${context}\n\nStudent's question: ${message}`
                }
            ],
            max_tokens: 500,
            temperature: mode === 'exam' ? 0.3 : 0.7
        });

        const aiResponse = completion.choices[0].message.content;

        res.json({ 
            success: true, 
            response: aiResponse 
        });

    } catch (error) {
        console.error('OpenAI Error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get AI response. Please check your API key.' 
        });
    }
});

module.exports = router;
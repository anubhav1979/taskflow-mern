const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

router.post('/suggest', protect, async (req, res) => {
  try {
    const { type, context } = req.body;

    let prompt = '';

    if (type === 'task_description') {
      prompt = `You are a helpful project management assistant. Given this task title: "${context.title}", write a clear, concise task description (2-3 sentences) that explains what needs to be done. Return only the description, no extra text.`;
    } else if (type === 'project_description') {
      prompt = `You are a helpful project management assistant. Given this project name: "${context.name}", write a clear, concise project description (2-3 sentences) that explains the project goals. Return only the description, no extra text.`;
    } else if (type === 'progress_note') {
      prompt = `You are a project management assistant. The employee has completed ${context.progress}% of task: "${context.taskTitle}". Suggest a professional progress update note (1-2 sentences) they can use. Return only the note, no extra text.`;
    } else if (type === 'priority') {
      prompt = `You are a project management assistant. Based on this task: "${context.title}" with deadline: "${context.deadline || 'not set'}", suggest the appropriate priority level (respond with ONLY one word: low, medium, or high).`;
    } else {
      return res.status(400).json({ message: 'Invalid AI request type' });
    }

    // const response = await fetch(
    //   `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    //   {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({
    //       contents: [{ parts: [{ text: prompt }] }]
    //     })
    //   }
    // );

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', // ✅ FIXED
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("FULL GROQ ERROR:", data);
      return res.status(500).json({
        message: data.error?.message || "Groq API failed"
      });
    }

    const suggestion = data.choices?.[0]?.message?.content?.trim();

    if (!suggestion) {
      console.error("BAD RESPONSE STRUCTURE:", data);
      return res.status(500).json({
        message: "Invalid AI response structure"
      });
    }

    // if (!response.ok) {
    //   throw new Error('AI service unavailable');
    // }
    

    // const data = await response.json();

    // if (!response.ok) {
    //   console.error('FULL GEMINI ERROR:', JSON.stringify(data, null, 2));
    //   throw new Error('AI service unavailable');
    // }

    // const suggestion = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!suggestion) throw new Error('No response from AI');

    res.json({ suggestion });
  } catch (error) {
    console.error('AI error:', error);
    res.status(500).json({ message: 'AI service temporarily unavailable' });
  }
});

module.exports = router;
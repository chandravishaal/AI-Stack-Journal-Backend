// // routes/aiSummarize.js
// const express = require('express');
// const axios = require('axios');
// const Post = require('../model/Blog'); // your existing Post model
// // optional: const AiEvent = require('../models/AiEvent'); // if you want to log usage
// const router = express.Router();

// const OPENAI_KEY = process.env.OPENAI_API_KEY;
// const MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

// if (!OPENAI_KEY) {
//   console.warn('WARNING: OPENAI_API_KEY not set in env');
// }

// // helper wrapper for OpenAI Chat Completion
// async function callOpenAIChat(messages, max_tokens = 300) {
//   const start = Date.now();
//   const resp = await axios.post(
//     'https://api.openai.com/v1/chat/completions',
//     { model: MODEL, messages, max_tokens },
//     { headers: { Authorization: `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' } }
//   );
//   const latency = Date.now() - start;
//   return { data: resp.data, latency };
// }

// /**
//  * POST /api/ai/summarize
//  * body: { postId } or { content }
//  * returns: { summary: string, tokens: number|null, latency: ms }
//  */
// router.post('/summarize', async (req, res) => {
//   try {
//     let text = req.body.content;
//     if (req.body.postId) {
//       const post = await Post.findById(req.body.postId).lean();
//       if (!post) return res.status(404).json({ error: 'post not found' });
//       // Adjust to your post schema field (content, body, html)
//       text = post.content || post.body || post.html || '';
//     }

//     if (!text || typeof text !== 'string' || text.length < 30) {
//       return res.status(400).json({ error: 'No article content provided or content too short' });
//     }

//     // keep prompt length reasonable — cut large articles (simple heuristic)
//     const safeText = text.substring(0, 3800);

//     const system_msg = `You are an assistant that summarizes technical blog posts for developers. Be accurate, concise, and avoid fabricating facts.`;
//     const user_msg = `Summarize the article below. Provide:
// 1) One-line TL;DR (one sentence).
// 2) 3 concise bullet points (each one line).
// 3) 3 suggested tags (comma-separated).
// Article:
// ${safeText}
// --end--`;

//     const { data, latency } = await callOpenAIChat(
//       [{ role: 'system', content: system_msg }, { role: 'user', content: user_msg }],
//       300
//     );

//     const answer = data?.choices?.[0]?.message?.content || '';
//     const tokens = data?.usage?.total_tokens ?? null;

//     // optional: log AiEvent if you created model
//     // try { await AiEvent.create({ eventType:'summarize', model: data.model, tokensOut: tokens, latencyMs: latency }); } catch(e){}

//     return res.json({ summary: answer, tokens, latency });
//   } catch (err) {
//     console.error('AI summarize error', err?.response?.data || err.message || err);
//     return res.status(500).json({ error: 'AI error', details: err?.response?.data || err?.message });
//   }
// });

// module.exports = router;

//above was from openai but it required credits, lets go with google ai studio

const express = require("express");
const axios = require("axios");
const Post = require("../model/Blog");
const router = express.Router();

const API_KEY = process.env.GOOGLE_API_KEY;
// const MODEL = process.env.GOOGLE_MODEL || "text-bison-001";

if (!API_KEY) console.warn("No GOOGLE_API_KEY in env");

router.post("/summarize", async (req, res) => {
  try {
    let text = req.body.content;
    if (req.body.postId) {
      const post = await Post.findById(req.body.postId).lean();
      if (!post) return res.status(404).json({ error: "post not found" });
      text = post.content || post.body || post.html || "";
    }
    if (!text || text.length < 30)
      return res.status(400).json({ error: "no content or too short" });

    const safeText = text.substring(0, 3800);
    const prompt = `Summarize the article below for a developer and AI enthusiast audience. Provide:\nTL;DR One-line .\n  3 concise bullets with important points. use arrows → for bullet points.\n3)\nArticle:\n${safeText}`;

    // const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;
    
    //2.0 flash has more rpd and rpm
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${API_KEY}`;

    // const body = { prompt: { text: prompt } };
    const body = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    };

    const start = Date.now();
    const googleResp = await axios.post(endpoint, body, {
      headers: { "Content-Type": "application/json" },
    });
    const latency = Date.now() - start;
    const answer =
      googleResp.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return res.json({ summary: answer, raw: googleResp.data, latency });
  } catch (err) {
    console.error(
      "Google AI error:",
      err?.response?.data || err.message || err
    );
    return res.status(500).json({
      error: "AI error",
      details: err?.response?.data || err?.message,
    });
  }
});

module.exports = router;

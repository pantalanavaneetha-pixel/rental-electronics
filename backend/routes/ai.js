import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

router.post('/verify', async (req, res, next) => {
  try {
    const { image, damageType } = req.body;
    
    if (!image) {
      return res.status(400).json({ success: false, error: 'No image provided.' });
    }
    if (!damageType || damageType === 'None') {
      return res.status(400).json({ success: false, error: 'No damage type provided.' });
    }

    let imageData = null;
    let mimeType = 'image/jpeg';
    
    if (image.startsWith('data:image')) {
      const parts = image.split(';');
      mimeType = parts[0].split(':')[1];
      imageData = parts[1].split(',')[1];
    } else if (image.startsWith('http')) {
      const response = await fetch(image);
      if (!response.ok) {
        throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
      }
      const buffer = await response.arrayBuffer();
      imageData = Buffer.from(buffer).toString('base64');
      mimeType = response.headers.get('content-type') || 'image/jpeg';
    } else {
      return res.status(400).json({ success: false, error: 'Invalid image format.' });
    }

    const prompt = `Analyze this image. The customer claims the device is damaged, specifically: "${damageType}".

Step 1: Check if the image shows an electronic device (e.g., phone, tablet, laptop) or a part of one.
If it is NOT an electronic device (e.g., a person, animal, random object, or document), you MUST reject it immediately. Set "match" to false and message to "AI Verification Mismatch: The uploaded image does not appear to be an electronic device."

Step 2: If it IS a device, inspect it carefully for ANY damage (cracks, dents, deep scratches, micro-scratches, scuffs, water damage, or broken parts).
Pay very close attention to small or faint details. Even minor, hairline, or small scratches MUST be considered damage.

Step 3: Respond with JSON strictly following this schema:
{
  "match": boolean,
  "message": string
}

Rules:
- If damage IS found: set "match" to true. The message MUST start with "Verification Matched: " followed by your classification of the damage (e.g., "Verification Matched: Minor scratches detected on the screen").
- If the device appears absolutely flawless with NO damage whatsoever: set "match" to false and message to "AI Verification Mismatch: No visible damage detected. Device appears flawless."`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { text: prompt },
        {
          inlineData: {
            mimeType: mimeType,
            data: imageData
          }
        }
      ],
      config: {
        responseMimeType: 'application/json',
      }
    });

    const resultText = response.text;
    const jsonResult = JSON.parse(resultText);

    res.json({
      success: true,
      match: jsonResult.match,
      message: jsonResult.message
    });
  } catch (error) {
    console.error('AI Verification Error:', error);
    next(error);
  }
});

// POST /api/ai/generate-notes - Generate customer friendly settlement notes using Gemini
router.post('/generate-notes', async (req, res, next) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, error: 'Prompt is required.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.warn("No GEMINI_API_KEY configured. Simulating AI output...");
      return simulateAiOutput(prompt, res);
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { text: prompt + "\n\nReply only with the generated message/email text. Do not include markdown code block backticks around the text. Start immediately with the greeting." }
        ]
      });

      res.json({
        success: true,
        notes: response.text.trim()
      });
    } catch (apiError) {
      console.error("Gemini API Error, falling back to simulation:", apiError);
      return simulateAiOutput(prompt, res);
    }
  } catch (error) {
    next(error);
  }
});

function simulateAiOutput(prompt, res) {
  // Parse variables from the prompt if possible for dynamic mock generation
  const depositMatch = prompt.match(/(?:Original Security Deposit Held|Deposit):\s*([^\n]+)/i);
  const deposit = depositMatch ? depositMatch[1] : "₹30,000";
  const damagesMatch = prompt.match(/(?:Assessed Physical Damages|Damage):\s*([^\n]+)/i);
  const damages = damagesMatch ? damagesMatch[1] : "None";
  const statusMatch = prompt.match(/(?:Return Status|Overdue):\s*([^\n]+)/i);
  const returnStatus = statusMatch ? statusMatch[1] : "Returned on time";
  const outcomeMatch = prompt.match(/(?:Net Financial Outcome|Resolution):\s*([^\n]+)/i);
  const netOutcome = outcomeMatch ? outcomeMatch[1] : "Refund of deposit";

  const simulatedNotes = `Deposit: ${deposit} | Deductions (Damage: ${damages}, Overdue: ${returnStatus}) | Outcome: ${netOutcome}`;

  setTimeout(() => {
    res.json({
      success: true,
      notes: simulatedNotes,
      simulated: true
    });
  }, 1000); // 1-second delay for premium simulation feel
}

export default router;


import { GoogleGenAI } from "@google/genai";
import { AppState } from "./types";

const OPS_SYSTEM_INSTRUCTION = `You are LBJ-Ops-AI, the Operations & Delivery Intelligence system.
Your role is to increase efficiency, reduce friction, and support leadership with smarter planning.
Think in systems, not tasks. Prioritize clarity. Flag risks without drama.

OUTPUT FORMAT (Strictly adhere to this):
--- OPERATIONS INTELLIGENCE ---
Current Focus: [High-level summary of active priorities]
Key Bottlenecks: [Identify specific resource constraints or scheduling clashes]
Risk Alerts: [Specific risks based on data like inventory or weather/seasonality]
Optimization Opportunities: [Where can we gain efficiency?]
Suggested Actions: [Bullet points for leadership to consider]
----------------------------`;

const DELIVERABLE_SYSTEM_INSTRUCTION = `You are LBJ-Ops-AI in DELIVERABLE MODE.
You must produce a PDF-ready consulting-grade document.
Structure:
--- ACTION DOCUMENT ---
Title: [Project or Strategic Focus]
Prepared For: Operations Leadership
Date: [Current Date]
----------------------
Executive Summary
Key Insights
Recommended Actions
30-Day Plan
60-Day Plan
90-Day Plan
Ownership & Roles
Success Metrics
----------------------

--- WHAT TO DO WITH THIS PDF ---
[Simple instructions on who to send it to and what meeting it supports]
--------------------------------

RULES:
- Professional, consulting-grade language.
- NO EMOJIS.
- NO HYPE LANGUAGE.
- Clear. Direct. Actionable.`;

export const generateOpsReport = async (state: AppState, customQuery?: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const prompt = `Analyze the following operational data. 
  ${customQuery ? `User specifically asked: ${customQuery}` : ''}
  
  PROJECTS:
  ${JSON.stringify(state.projects)}
  
  TEAM AVAILABILITY:
  ${JSON.stringify(state.availability)}
  
  INVENTORY STATUS:
  ${JSON.stringify(state.inventory)}
  
  Provide the report in the standard Operations Intelligence format.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: OPS_SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    return response.text || "Failed to generate report.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "An error occurred while communicating with the Intelligence System.";
  }
};

export const generateActionDocument = async (state: AppState, context: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const prompt = `Generate a formal Action Document based on the current state and the user request: "${context}".
  
  STATE:
  Projects: ${state.projects.length} active
  Top Priorities: ${state.projects.filter(p => p.priority === 'High').map(p => p.name).join(', ')}
  Inventory Risks: ${state.inventory.filter(i => i.status !== 'Adequate').map(i => i.name).join(', ')}
  
  Follow the DELIVERABLE MODE structure strictly.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: DELIVERABLE_SYSTEM_INSTRUCTION,
        temperature: 0.4,
      },
    });

    return response.text || "Failed to generate deliverable.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Failed to generate deliverable document.";
  }
};

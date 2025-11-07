
import { GoogleGenAI, Type } from "@google/genai";
import { MarkingResult } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const fileToGenerativePart = (base64: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64,
      mimeType
    },
  };
};

export const markScript = async (scriptFile: File): Promise<MarkingResult> => {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(scriptFile);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });

  const imagePart = fileToGenerativePart(base64, scriptFile.type);
  
  const prompt = `
    You are an expert Grade 12 examiner for the South African education system. 
    Your task is to analyze the provided student script image and mark it accurately.
    1. Identify each question and the corresponding answer written by the student.
    2. Based on your expert knowledge of the South African Grade 12 curriculum, determine the correctness of each answer.
    3. Award marks for each question. Be fair and consistent.
    4. Provide brief, constructive feedback for each answer, explaining why marks were awarded or deducted.
    5. Calculate the total marks awarded and the total marks available for the entire script.
    6. Provide overall feedback on the student's performance.
    7. Return the entire analysis in the specified JSON format.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [imagePart, { text: prompt }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          totalMarksAvailable: { type: Type.NUMBER, description: "The total possible marks for the script." },
          marksAwarded: { type: Type.NUMBER, description: "The total marks the student achieved." },
          overallFeedback: { type: Type.STRING, description: "A summary of the student's performance." },
          questions: {
            type: Type.ARRAY,
            description: "A detailed breakdown of marks for each question.",
            items: {
              type: Type.OBJECT,
              properties: {
                questionNumber: { type: Type.STRING, description: "The number or identifier of the question." },
                marksAwarded: { type: Type.NUMBER, description: "Marks awarded for this specific question." },
                maxMarks: { type: Type.NUMBER, description: "Maximum possible marks for this question." },
                feedback: { type: Type.STRING, description: "Constructive feedback for the student's answer." },
              },
              required: ["questionNumber", "marksAwarded", "maxMarks", "feedback"],
            },
          },
        },
        required: ["totalMarksAvailable", "marksAwarded", "overallFeedback", "questions"],
      },
    },
  });
  
  const jsonString = response.text.trim();
  try {
    return JSON.parse(jsonString) as MarkingResult;
  } catch (e) {
    console.error("Failed to parse Gemini response:", jsonString);
    throw new Error("The AI returned an invalid format. Please try again.");
  }
};

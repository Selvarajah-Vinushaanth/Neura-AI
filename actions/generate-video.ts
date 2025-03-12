import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";

const genAI = new GoogleGenerativeAI("AIzaSyBB-HQKzJlATO4loyvQ9pPXixRcgv3CgOo" || "");

export async function generateVideoFromTemplate(
  templateId: string,
  modifications: string,
  file: File
): Promise<{ success: boolean; fileSummary?: string; error?: string }> {
  try {
    const model = genAI.getGenerativeModel({ model: 'models/gemini-1.5-flash' });
    
    // Convert File to base64
    const buffer = await file.arrayBuffer();
    const base64Data = Buffer.from(buffer).toString('base64');

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      },
      'Summarize this document',
    ]);

    return {
      success: true,
      fileSummary: result.response.text(),
    };
  } catch (error) {
    console.error('Error processing file:', error);
    return {
      success: false,
      error: 'Failed to process the file. Please try again.',
    };
  }
}
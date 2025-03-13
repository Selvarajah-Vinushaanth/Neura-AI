import { NextResponse } from "next/server"
import axios from "axios"

const API_KEY = "32d55e62bf0f482e8ecc24bdf6c5b07b3b00dc05b351fd6b892f3d1519fb5eb4"
const API_URL = "https://api.together.xyz/v1/chat/completions"

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()

    const response = await axios.post(
      API_URL,
      {
        model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
        messages: [
          {
            role: "user",
            content: `Make this prompt more detailed and specific, adding relevant context and key points to explore. Return only the enhanced prompt without any prefixes or explanations:\n\n"${prompt}"`
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    let enhancedPrompt = response.data.choices?.[0]?.message?.content?.trim()
    if (!enhancedPrompt) {
      throw new Error("No enhanced prompt in response")
    }

    // Clean up the response
    enhancedPrompt = enhancedPrompt
      // Remove common prefixes
      .replace(/^(Here'?s?( an)?( enhanced| improved| better)?( version( of)?)?( the)?( prompt:?)?)/i, '')
      .replace(/^This revised prompt/i, '')
      // Remove surrounding quotes
      .replace(/^["']|["']$/g, '')
      // Remove explanatory suffixes
      .replace(/This prompt (maintains|focuses|explores|provides).+$/i, '')
      .trim()

    return NextResponse.json({ enhancedPrompt })

  } catch (error: any) {
    console.error("API Error:", error.response?.data || error.message)
    return NextResponse.json(
      { 
        error: "Failed to enhance prompt", 
        details: error.response?.data || error.message 
      },
      { status: 500 }
    )
  }
}

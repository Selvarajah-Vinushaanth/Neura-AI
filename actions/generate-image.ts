"use server"
import { google } from "@ai-sdk/google"

export async function generateImageFromPrompt(prompt: string, numberOfImages = 1) {
  try {
    const response = await fetch('https://api.imagepig.com/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': '2b7127e1-590b-43e6-9e86-7b466031bbb8' // Replace with your API key
      },
      body: JSON.stringify({ prompt })
    })

    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`)
    }

    const json = await response.json()
    const buffer = Buffer.from(json.image_data, 'base64')

    // Instead of saving the image locally, return the base64 image data directly
    return {
      success: true,
      images: [
        {
          url: `data:image/jpeg;base64,${json.image_data}`, // Direct base64 URL
          base64: json.image_data,
        }
      ]
    }

  } catch (error) {
    console.error("Error generating image from imagepig API:", error)
    return {
      success: false,
      error: "Failed to generate images. Please try again.",
    }
  }
}

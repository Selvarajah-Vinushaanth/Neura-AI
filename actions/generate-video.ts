"use server";

export async function generateVideoFromTemplate(templateId, modifications) {
  const url = 'https://api.segmind.com/';
  const apiKey = 'SG_78779eb649e93d72';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        template_id: templateId,
        modifications: modifications
      })
    });

    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const json = await response.json();

    return {
      success: true,
      videoUrl: json.url,
    };
  } catch (error) {
    console.error("Error generating video from Segmind API:", error);
    return {
      success: false,
      error: "Failed to generate video. Please try again.",
    };
  }
}

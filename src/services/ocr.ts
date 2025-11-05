const GOOGLE_VISION_API_KEY = 'AIzaSyBjbbt_0KIGB1jguUW4YgstQXUDQbK0C1Q';
const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

interface OcrResponse {
  text: string;
  confidence: number;
}

export async function performOcr(imageBase64: string): Promise<OcrResponse> {
  try {
    const response = await fetch(`${VISION_API_URL}?key=${GOOGLE_VISION_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            image: {
              content: imageBase64,
            },
            features: [
              {
                type: 'TEXT_DETECTION',
                maxResults: 1,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error('OCR request failed');
    }

    const data = await response.json();
    const textAnnotations = data.responses[0]?.textAnnotations;

    if (!textAnnotations || textAnnotations.length === 0) {
      return { text: '', confidence: 0 };
    }

    // The first annotation contains the entire text
    return {
      text: textAnnotations[0].description,
      confidence: textAnnotations[0].confidence || 0,
    };
  } catch (error) {
    console.error('OCR Error:', error);
    throw error;
  }
}

export function extractProductInfo(text: string) {
  // Regular expressions for extracting product information
  const serialRegex = /S(?:ERIAL)?[:\s-]*([A-Z0-9-]+)/i;
  const hsnRegex = /HSN[:\s-]*([0-9]{4,8})/i;

  const serialMatch = text.match(serialRegex);
  const hsnMatch = text.match(hsnRegex);

  return {
    serialNumber: serialMatch ? serialMatch[1] : null,
    hsnCode: hsnMatch ? hsnMatch[1] : null,
  };
}
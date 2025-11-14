import * as ImageManipulator from 'expo-image-manipulator';
import { OPENROUTER_API_KEY, OPENROUTER_API_URL, OPENROUTER_MODEL } from '../config/env';
import { VlmResponse } from '../types';

/**
 * Capture and process camera frame with VLM (Vision Language Model)
 */
export async function analyzeImageWithVLM(
  imageUri: string,
  prompt: string = 'Describe what you see in this image, focusing on any obstacles, hazards, or important objects for navigation.'
): Promise<VlmResponse> {
  try {
    // Resize and compress image to reduce API payload size
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 1024 } }], // Resize to max width 1024px
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );

    // Convert image to base64
    const base64Image = await imageToBase64(manipulatedImage.uri);

    // Call OpenRouter API
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'com.safepath.app',
        'X-Title': 'SafePath Navigation Assistant',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const description = data.choices?.[0]?.message?.content || 'No description available';

    // Parse description for structured data (simple parsing)
    const vlmResponse: VlmResponse = {
      description,
      objects: extractObjects(description),
      hazards: extractHazards(description),
    };

    return vlmResponse;
  } catch (error) {
    console.error('Failed to analyze image with VLM:', error);
    throw error;
  }
}

/**
 * Convert image URI to base64
 */
async function imageToBase64(uri: string): Promise<string> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        // Remove the data:image/...;base64, prefix
        const base64 = base64data.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to convert image to base64:', error);
    throw error;
  }
}

/**
 * Extract object names from description (simple keyword matching)
 */
function extractObjects(description: string): string[] {
  const objectKeywords = [
    'person', 'people', 'car', 'vehicle', 'bicycle', 'bike',
    'door', 'wall', 'stairs', 'chair', 'table', 'sign',
    'tree', 'building', 'road', 'sidewalk', 'curb'
  ];

  const found: string[] = [];
  const lowerDesc = description.toLowerCase();

  objectKeywords.forEach(keyword => {
    if (lowerDesc.includes(keyword)) {
      found.push(keyword);
    }
  });

  return [...new Set(found)]; // Remove duplicates
}

/**
 * Extract hazard warnings from description
 */
function extractHazards(description: string): string[] {
  const hazardKeywords = [
    'obstacle', 'hazard', 'danger', 'warning', 'caution',
    'wet', 'slippery', 'broken', 'uneven', 'hole',
    'moving', 'approaching', 'blocked', 'restricted'
  ];

  const found: string[] = [];
  const lowerDesc = description.toLowerCase();

  hazardKeywords.forEach(keyword => {
    if (lowerDesc.includes(keyword)) {
      found.push(keyword);
    }
  });

  return [...new Set(found)]; // Remove duplicates
}

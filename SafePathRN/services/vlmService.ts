import * as ImageManipulator from 'expo-image-manipulator';
import { 
  OPENROUTER_API_KEY, 
  OPENROUTER_API_URL, 
  OPENROUTER_MODEL,
  OPENROUTER_SITE_URL,
  OPENROUTER_APP_NAME
} from '../config/env';
import { VlmResponse } from '../types';

/**
 * Compress and encode image to base64 with size limit (similar to Swift implementation)
 */
async function compressAndEncodeImage(imageUri: string, maxSizeMB: number = 15.0): Promise<string> {
  const qualities = [0.85, 0.70, 0.50, 0.30];
  
  for (const quality of qualities) {
    const manipulated = await ImageManipulator.manipulateAsync(
      imageUri,
      [],
      { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
    );
    
    const base64 = await imageToBase64(manipulated.uri);
    const estimatedSize = (base64.length * 3) / 4; // Approximate size in bytes
    
    if (estimatedSize < maxSizeMB * 1024 * 1024) {
      return base64;
    }
  }
  
  // If still too large, downscale to 512px max dimension
  const downscaled = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: 512 } }],
    { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
  );
  
  return await imageToBase64(downscaled.uri);
}

/**
 * Describe the environment in the image for voice interaction mode
 */
export async function describeEnvironment(imageUri: string): Promise<VlmResponse> {
  const prompt = `You are a helpful assistant for a blind person. Describe the environment in this image briefly. Focus on key objects, layout, and important details. Keep it under 20 words.`;
  
  return await analyzeImageWithVLM(imageUri, prompt);
}

/**
 * Get obstacle avoidance advice when warning triggers
 */
export async function getObstacleAvoidanceAdvice(
  imageUri: string,
  detectedObject: string,
  distance: number
): Promise<VlmResponse> {
  const prompt = `You are a blind navigation assistant. A ${detectedObject} is ${distance.toFixed(1)}m ahead. Give ONE brief avoidance instruction in 10 words maximum.`;
  
  return await analyzeImageWithVLM(imageUri, prompt);
}

/**
 * Handle natural language query with image context
 */
export async function handleNaturalLanguageQuery(
  query: string,
  imageUri: string
): Promise<VlmResponse> {
  const prompt = `You are a helpful assistant for a blind person. Question: "${query}" Answer briefly in 10 words maximum based on the image.`;
  
  return await analyzeImageWithVLM(imageUri, prompt);
}

/**
 * Capture and process camera frame with VLM (Vision Language Model)
 */
export async function analyzeImageWithVLM(
  imageUri: string,
  prompt: string = 'Describe what you see in this image, focusing on any obstacles, hazards, or important objects for navigation.'
): Promise<VlmResponse> {
  try {
    // Compress and encode image with size limit
    const base64Image = await compressAndEncodeImage(imageUri, 15.0);

    if (!OPENROUTER_API_KEY) {
      throw new Error('Missing OPENROUTER_API_KEY');
    }

    // Call OpenRouter API (matching Swift implementation)
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': OPENROUTER_SITE_URL,
        'X-Title': OPENROUTER_APP_NAME,
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

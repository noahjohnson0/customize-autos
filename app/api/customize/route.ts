import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Enhanced prompts for component-specific modifications
function buildComponentAwarePrompt(customizationPrompt: string, categoryId?: string): string {
  let componentGuidance = '';
  
  if (categoryId === 'wheels') {
    componentGuidance = `CRITICAL INSTRUCTIONS FOR WHEEL REPLACEMENT:
- Identify and locate ALL four wheels in the image precisely
- Replace ONLY the wheel rims/spokes/design - do NOT change tire size, position, or wheel well geometry
- Preserve EXACTLY: car body, paint color, windows, headlights, taillights, grille, logos, trim, background, lighting, shadows, reflections
- Maintain the same wheel diameter, offset, and rotational position
- Keep wheel shadows and reflections matching the original lighting
- The new wheels must fit perfectly within the existing wheel wells without any distortion
- Do not modify any part of the car body, paint, or any other component`;
  } else if (categoryId === 'paint') {
    componentGuidance = `CRITICAL INSTRUCTIONS FOR PAINT COLOR CHANGE:
- Change ONLY the exterior body paint color - preserve ALL other elements
- Do NOT modify: wheels, wheel design, tire tread, windows, glass, chrome trim, logos, badges, headlights, taillights, grille, accessories, background
- Maintain the exact same paint finish type (glossy/matte/metallic) and surface reflections
- Keep all body lines, curves, and panel gaps exactly the same
- Preserve all lighting, shadows, highlights, and reflections on the car
- Do not change the car's shape, proportions, or any physical features`;
  } else if (categoryId === 'accessories') {
    componentGuidance = `CRITICAL INSTRUCTIONS FOR ACCESSORY MODIFICATION:
- Add or remove ONLY the specified accessory component
- Preserve EXACTLY: paint color, wheels, body shape, windows, all other accessories, background, lighting
- The accessory must match the car's perspective, lighting direction, and shadows
- Ensure proper integration with correct mounting points and alignment
- Maintain realistic shadows and reflections for the accessory
- Do not modify any other part of the vehicle or scene`;
  }
  
  const baseGuidance = `
PRESERVATION REQUIREMENTS (MUST FOLLOW):
- Keep the camera angle, perspective, and field of view identical
- Maintain the exact same lighting conditions, shadows, and reflections
- Preserve the background completely unchanged
- Keep all non-targeted car parts in their exact original state
- Maintain image resolution, quality, and composition
- The result should look like a professional photo edit where ONLY the specified component was modified`;

  return `${customizationPrompt}

${componentGuidance}

${baseGuidance}

Generate a photorealistic result that appears seamless and natural, as if the modification was done in a professional photo editing software.`;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const carImage = formData.get('carImage') as File;
    const customizationPrompt = formData.get('prompt') as string;
    const categoryId = formData.get('categoryId') as string | null;

    if (!carImage) {
      return NextResponse.json({ error: 'Car image is required' }, { status: 400 });
    }

    if (!customizationPrompt) {
      return NextResponse.json({ error: 'Customization prompt is required' }, { status: 400 });
    }

    // Convert car image to base64 for Gemini API
    const carImageBuffer = await carImage.arrayBuffer();
    const carImageBase64 = Buffer.from(carImageBuffer).toString('base64');

    // Get Gemini API key from environment variables
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured. Please set GEMINI_API_KEY in your .env.local file.' },
        { status: 500 }
      );
    }

    // Initialize Gemini API client
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Use Gemini 2.5 Flash Image model (also known as "nano banana")
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' });

    // Build the enhanced prompt with component awareness
    const fullPrompt = buildComponentAwarePrompt(customizationPrompt, categoryId || undefined);

    // Generate customized image using Gemini API
    const result = await model.generateContent([
      {
        inlineData: {
          data: carImageBase64,
          mimeType: carImage.type || 'image/jpeg',
        },
      },
      {
        text: fullPrompt,
      },
    ]);

    const response = await result.response;
    
    // Extract the generated image from the response
    // Gemini returns images in the candidates array
    const candidate = response.candidates?.[0];
    if (!candidate || !candidate.content) {
      return NextResponse.json(
        { error: 'No image generated from Gemini API' },
        { status: 500 }
      );
    }

    // Find the image part in the response
    const imagePart = candidate.content.parts.find(
      (part: any) => part.inlineData
    );

    if (!imagePart || !imagePart.inlineData) {
      return NextResponse.json(
        { error: 'No image data in Gemini API response' },
        { status: 500 }
      );
    }

    // Return the base64 image with data URI prefix
    const imageData = imagePart.inlineData.data;
    const mimeType = imagePart.inlineData.mimeType || 'image/jpeg';
    const imageUrl = `data:${mimeType};base64,${imageData}`;

    return NextResponse.json({
      success: true,
      imageUrl: imageUrl,
    });
  } catch (error) {
    console.error('Error customizing image:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}


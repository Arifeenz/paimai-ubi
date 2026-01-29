import { NextResponse } from 'next/server';

/**
 * API Route: Enhance images using Gemini Image Editing
 * Uses gemini-3-pro-image-preview to automatically enhance uploaded photos
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { image, enhancementInstructions } = body;

        // Validate required fields
        if (!image || !image.data || !image.mimeType) {
            return NextResponse.json(
                { error: 'Missing required field: image with data and mimeType' },
                { status: 400 }
            );
        }

        console.log('🎨 [Enhance API] Starting image enhancement:', {
            mimeType: image.mimeType,
            dataLength: image.data.length,
            hasInstructions: !!enhancementInstructions
        });

        // Import Gemini SDK
        const { GoogleGenAI } = await import('@google/genai');

        const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

        if (!apiKey) {
            throw new Error('GOOGLE_GEMINI_API_KEY is not set in environment variables');
        }

        const ai = new GoogleGenAI({ apiKey });

        // Default enhancement instructions - CRITICAL: Preserve original content!
        const defaultInstructions = `
⚠️ IMPORTANT: You MUST keep the EXACT SAME subject, composition, and all objects from the original image.
DO NOT change what's in the photo. DO NOT replace items. DO NOT add new objects.

Your task is to ONLY enhance the technical quality of this EXISTING photo:

1. **Lighting Enhancement:**
   - Improve brightness and contrast naturally
   - Balance shadows and highlights
   - Use soft, natural lighting adjustments

2. **Color Enhancement:**
   - Make colors more vibrant and appetizing
   - Improve white balance if needed
   - Enhance saturation moderately (don't over-saturate)

3. **Quality Enhancement:**
   - Sharpen details and improve clarity
   - Reduce noise if present
   - Enhance overall image quality

4. **Keep Everything Else:**
   - Same background
   - Same angle/perspective
   - Same composition
   - Same objects/subjects

Make it look like a professionally edited version of the SAME photo - not a different photo!
Suitable for social media posts.
`;

        const instructions = enhancementInstructions || defaultInstructions;

        console.log('📝 [Enhance API] Using instructions:', instructions);

        // Try image editing models
        const modelsToTry = [
            'gemini-3-pro-image-preview',
            'gemini-2.5-flash-image'
        ];

        let lastError = null;

        for (const modelName of modelsToTry) {
            try {
                console.log(`🔍 Trying model: ${modelName}`);

                // Create chat for multi-turn image editing
                const chat = ai.chats.create({
                    model: modelName,
                    config: {
                        responseModalities: ['IMAGE']
                    }
                });

                // Send enhancement request with image
                const response = await chat.sendMessage({
                    message: instructions,
                    parts: [
                        {
                            inlineData: {
                                mimeType: image.mimeType,
                                data: image.data
                            }
                        }
                    ]
                });

                console.log('📦 [Enhance API] Response received:', {
                    hasCandidates: !!response.candidates,
                    candidateCount: response.candidates?.length
                });

                // Extract enhanced image
                if (response.candidates && response.candidates[0]) {
                    const parts = response.candidates[0].content.parts;

                    for (const part of parts) {
                        if (part.inlineData) {
                            const enhancedImageData = part.inlineData.data;
                            const enhancedMimeType = part.inlineData.mimeType;

                            console.log('✅ [Enhance API] Image enhanced successfully:', {
                                model: modelName,
                                outputMimeType: enhancedMimeType,
                                outputDataLength: enhancedImageData.length
                            });

                            return NextResponse.json({
                                success: true,
                                enhancedImage: {
                                    mimeType: enhancedMimeType,
                                    data: enhancedImageData
                                },
                                model: modelName
                            });
                        }
                    }
                }

                throw new Error('No image data in response');

            } catch (error) {
                console.log(`❌ ${modelName} failed:`, error.message);
                lastError = error;
                continue;
            }
        }

        // All models failed
        throw lastError || new Error('All image enhancement models failed');

    } catch (error) {
        console.error('❌ [Enhance API] Error:', error);

        return NextResponse.json(
            {
                error: 'Failed to enhance image',
                details: error.message
            },
            { status: 500 }
        );
    }
}

// Optional: Health check
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        message: 'Image enhancement API is running',
        timestamp: new Date().toISOString()
    });
}

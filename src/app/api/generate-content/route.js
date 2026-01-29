import { NextResponse } from 'next/server';
import { buildPrompt, generateContent } from '@/lib/gemini';

export async function POST(request) {
    try {
        // Parse request body
        const body = await request.json();
        const { contentType, persona, userInput, images, tone = 'casual', targetAudience = 'general', ragContext } = body;

        // Validate required fields
        if (!contentType || !userInput) {
            return NextResponse.json(
                { error: 'Missing required fields: contentType and userInput are required' },
                { status: 400 }
            );
        }

        // Validate content type
        const validContentTypes = ['caption', 'promotion', 'video'];
        if (!validContentTypes.includes(contentType)) {
            return NextResponse.json(
                { error: `Invalid contentType. Must be one of: ${validContentTypes.join(', ')}` },
                { status: 400 }
            );
        }

        console.log('🚀 [API] Generating content:', {
            contentType,
            persona: persona || 'default',
            inputLength: userInput.length,
            tone,
            targetAudience,
            hasImages: images && images.length > 0
        });

        // Build prompt based on content type, persona, tone, audience and RAG context
        const hasImages = images && images.length > 0;
        const prompt = buildPrompt(contentType, persona, userInput, tone, targetAudience, null, ragContext, hasImages);

        console.log('📝 [API] Built prompt for', contentType, hasImages ? `with ${images.length} image(s)` : '(text only)');

        // Generate content using Gemini API
        const generatedText = await generateContent(prompt, images);

        console.log('✅ [API] Content generated successfully', {
            outputLength: generatedText.length
        });

        // Return generated content
        return NextResponse.json({
            success: true,
            content: generatedText,
            contentType,
            persona
        });

    } catch (error) {
        console.error('❌ [API] Error generating content:', error);

        // Check if it's an API key error
        if (error.message.includes('API_KEY')) {
            return NextResponse.json(
                {
                    error: 'API key not configured. Please add GOOGLE_GEMINI_API_KEY to .env.local',
                    details: error.message
                },
                { status: 500 }
            );
        }

        // Check if it's a quota/rate limit error
        if (error.message.includes('quota') || error.message.includes('rate limit')) {
            return NextResponse.json(
                {
                    error: 'API quota exceeded. Please try again later.',
                    details: error.message
                },
                { status: 429 }
            );
        }

        // Generic error
        return NextResponse.json(
            {
                error: 'Failed to generate content',
                details: error.message
            },
            { status: 500 }
        );
    }
}

// Optional: Add GET endpoint for health check
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        message: 'Content generation API is running',
        timestamp: new Date().toISOString()
    });
}

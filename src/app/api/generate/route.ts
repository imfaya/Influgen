// API Route for image generation via Wavespeed

import { NextRequest, NextResponse } from 'next/server';

// Wavespeed API Configuration
const WAVESPEED_API_BASE = 'https://api.wavespeed.ai/api/v3';
const DEFAULT_MODEL = 'bytedance/seedream-v4.5';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate request
        if (!body.prompt) {
            return NextResponse.json(
                { error: 'Prompt is required' },
                { status: 400 }
            );
        }

        const apiKey = process.env.WAVESPEED_API_KEY;

        // For development/demo: return mock images if no API key
        if (!apiKey || apiKey === 'your_wavespeed_api_key') {
            console.log('No Wavespeed API key configured, returning mock images');

            // Generate mock placeholder images
            const mockImages = Array.from({ length: body.num_outputs || 1 }, (_, i) =>
                `https://picsum.photos/seed/${Date.now() + i}/${body.resolution?.split('x')[0] || 1024}/${body.resolution?.split('x')[1] || 1024}`
            );

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            return NextResponse.json({
                success: true,
                images: mockImages,
            });
        }

        // Parse resolution to get size
        const [width, height] = (body.resolution || '1024x1024').split('x').map(Number);
        // Ensure even dimensions
        const safeWidth = Math.floor(Math.min(width, 4096) / 8) * 8;
        const safeHeight = Math.floor(Math.min(height, 4096) / 8) * 8;
        const size = `${safeWidth}x${safeHeight}`;

        // Determine model and endpoint
        const model = body.model || DEFAULT_MODEL;
        const wavespeedUrl = `${WAVESPEED_API_BASE}/${model}`;
        console.log('Wavespeed URL:', wavespeedUrl);
        console.log('Using model:', model);

        // Construct request body based on model type
        let requestBody: any = {
            prompt: body.prompt,
            enable_sync_mode: true,
        };

        // Nano Banana Pro uses 'resolution' (1k/2k/4k) + 'aspect_ratio' params
        if (model.includes('nano-banana-pro')) {
            // Convert pixel size to 1k/2k/4k quality level
            const maxDim = Math.max(safeWidth, safeHeight);
            if (maxDim <= 1024) {
                requestBody.resolution = '1k';
            } else if (maxDim <= 2048) {
                requestBody.resolution = '2k';
            } else {
                requestBody.resolution = '4k';
            }

            // Set aspect ratio for Nano Banana Pro
            // Supported: 1:1, 3:4, 4:3, 9:16, 16:9, 4:5, 3:2, 21:9
            requestBody.aspect_ratio = body.aspect_ratio || '3:4';
            requestBody.output_format = 'png';
        } else {
            // Seedream uses 'size' and 'num_images'
            requestBody.size = size;
            requestBody.num_images = body.num_outputs || 1;
        }

        // If it's an edit model, we need to pass the reference image
        if (model.includes('edit')) {
            if (body.reference_images && body.reference_images.length > 0) {
                // The edit endpoint expects 'images' (list of base64 or URLs)
                // If the image is a local path (starts with /), we need to read it and convert to base64
                // or assume the frontend sends base64/full URL.
                // Since our default images are local paths like '/defaults/xxx.jpg', we need to handle them server-side
                // OR ensuring the frontend converts them.

                // Let's handle it here in the API route for robustness
                const processedImages = await Promise.all(body.reference_images.map(async (img: string) => {
                    if (img.startsWith('/')) {
                        try {
                            // It's a local file in public folder
                            const fs = require('fs');
                            const path = require('path');
                            const filePath = path.join(process.cwd(), 'public', img);

                            if (fs.existsSync(filePath)) {
                                const fileBuffer = fs.readFileSync(filePath);
                                // Determine mime type roughly
                                const ext = path.extname(filePath).toLowerCase();
                                const mimeType = ext === '.png' ? 'image/png' :
                                    ext === '.webp' ? 'image/webp' :
                                        'image/jpeg';
                                return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
                            }
                        } catch (e) {
                            console.error('Error processing local image:', e);
                        }
                    }
                    return img; // Return original if not local or error
                }));

                // Wavespeed API: limit to 4 images max to avoid timeout with large payloads
                const MAX_IMAGES = 4;
                requestBody.images = processedImages.slice(0, MAX_IMAGES);
                console.log('Number of processed images:', processedImages.length);
                console.log('Number of images being sent (after limit):', requestBody.images.length);
            } else {
                return NextResponse.json(
                    { error: 'Reference image is required for Edit model. Please upload an image in the sidebar.' },
                    { status: 400 }
                );
            }
        }

        console.log('Request body size:', JSON.stringify(requestBody).length);

        const response = await fetch(wavespeedUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify(requestBody),
        });

        const responseText = await response.text();
        console.log('Wavespeed response status:', response.status);
        console.log('Wavespeed response:', responseText.substring(0, 500));

        if (!response.ok) {
            let errorMessage = 'Failed to generate images';
            try {
                const errorData = JSON.parse(responseText);
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch {
                errorMessage = responseText || errorMessage;
            }
            console.error('Wavespeed API error:', errorMessage);
            return NextResponse.json(
                { error: errorMessage },
                { status: response.status }
            );
        }

        const data = JSON.parse(responseText);

        // Extract images from various possible response formats
        let images: string[] = [];
        if (data.data?.outputs) {
            images = data.data.outputs.map((o: any) => typeof o === 'string' ? o : o.url || o.image_url);
        } else if (data.outputs) {
            images = data.outputs.map((o: any) => typeof o === 'string' ? o : o.url || o.image_url);
        } else if (data.images) {
            images = data.images;
        } else if (data.output) {
            images = Array.isArray(data.output) ? data.output : [data.output];
        } else if (data.data?.image_urls) {
            images = data.data.image_urls;
        } else if (data.image_urls) {
            images = data.image_urls;
        }

        console.log('Extracted images:', images.length);

        if (images.length === 0) {
            return NextResponse.json(
                { error: 'No images returned from API' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            images: images.filter(Boolean),
        });

    } catch (error) {
        console.error('Generation API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}

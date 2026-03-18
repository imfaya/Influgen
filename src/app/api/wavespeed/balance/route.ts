import { NextResponse } from 'next/server';
import { getUserApiKey } from '@/lib/getUserApiKey';

const WAVESPEED_API_BASE = 'https://api.wavespeed.ai/api/v3';

export async function GET() {
    try {
        const apiKey = await getUserApiKey();

        if (!apiKey || apiKey === 'your_wavespeed_api_key') {
            return NextResponse.json({ balance: "N/A" });
        }

        const response = await fetch(`${WAVESPEED_API_BASE}/balance`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            console.error('Wavespeed Balance API error:', await response.text());
            return NextResponse.json({ error: 'Failed to fetch balance' }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Balance API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}

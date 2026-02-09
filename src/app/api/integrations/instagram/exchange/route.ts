import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const INSTAGRAM_APP_ID = process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID;
const INSTAGRAM_CLIENT_SECRET = process.env.INSTAGRAM_CLIENT_SECRET;
const REDIRECT_URI = typeof process.env.NEXT_PUBLIC_APP_URL !== 'undefined'
    ? `${process.env.NEXT_PUBLIC_APP_URL}/integrations/instagram/callback`
    : 'http://localhost:3000/integrations/instagram/callback';

const logToFile = (message: string, data?: any) => {
    const logPath = path.join(process.cwd(), 'server_logs.txt');
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp}: ${message} ${data ? JSON.stringify(data, null, 2) : ''}\n---\n`;
    try {
        fs.appendFileSync(logPath, logMessage);
    } catch (e) {
        console.error('Failed to write to log file', e);
    }
};

export async function POST(req: NextRequest) {
    try {
        logToFile('Starting Instagram Token Exchange');
        const body = await req.json();
        const { code } = body;

        if (!code) {
            logToFile('Error: No code provided');
            return NextResponse.json({ error: 'No code provided' }, { status: 400 });
        }

        if (!INSTAGRAM_APP_ID || !INSTAGRAM_CLIENT_SECRET) {
            logToFile('Error: Server misconfigured');
            return NextResponse.json({ error: 'Server misconfigured (Missing ID/Secret)' }, { status: 500 });
        }

        // 1. Exchange code for User Access Token
        const tokenParams = new URLSearchParams({
            client_id: INSTAGRAM_APP_ID,
            client_secret: INSTAGRAM_CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            code: code,
        });

        const tokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?${tokenParams.toString()}`);
        const tokenData = await tokenRes.json();

        if (tokenData.error) {
            logToFile('FB OAuth Token Error', tokenData.error);
            throw new Error(`FB Error: ${tokenData.error.message}`);
        }

        const userAccessToken = tokenData.access_token;
        const expiresIn = tokenData.expires_in || 5184000;

        // 2. Exchange for Long-Lived Token
        const longTokenParams = new URLSearchParams({
            grant_type: 'fb_exchange_token',
            client_id: INSTAGRAM_APP_ID,
            client_secret: INSTAGRAM_CLIENT_SECRET,
            fb_exchange_token: userAccessToken,
        });

        const longTokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?${longTokenParams.toString()}`);
        const longTokenData = await longTokenRes.json();

        const finalAccessToken = longTokenData.access_token || userAccessToken;
        const finalExpiresIn = longTokenData.expires_in || expiresIn;
        const expiresAt = new Date(Date.now() + finalExpiresIn * 1000).toISOString();

        // DEBUG: Check Token Permissions
        const debugRes = await fetch(`https://graph.facebook.com/v19.0/debug_token?input_token=${finalAccessToken}&access_token=${finalAccessToken}`);
        const debugData = await debugRes.json();
        logToFile('Token Debug Data', debugData);

        // 3. Get User's Pages -> Connected Instagram Account
        let pages: any[] = [];

        // Strategy A: Standard me/accounts fetch
        const pagesRes = await fetch(
            `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,profile_picture_url}&access_token=${finalAccessToken}`
        );
        const pagesData = await pagesRes.json();

        if (!pagesData.error) {
            pages = pagesData.data || [];
        } else {
            logToFile('Pages Fetch Error (Strategy A)', pagesData.error);
        }

        // Strategy B: Fallback using Granular Scopes from Debug Data
        // If me/accounts returns empty (common with granular permissions or New Page Experience),
        // we extract the Page IDs directly from the token permissions and fetch them.
        if (pages.length === 0 && debugData && debugData.data && debugData.data.granular_scopes) {
            console.log('Using Strategy B: Fetching valid pages from granular_scopes');
            logToFile('Using Strategy B: Fetching valid pages from granular_scopes');

            const pagesScope = debugData.data.granular_scopes.find((s: any) => s.scope === 'pages_show_list');
            if (pagesScope && pagesScope.target_ids) {
                const targetIds = pagesScope.target_ids;

                for (const pageId of targetIds) {
                    try {
                        const singlePageRes = await fetch(
                            `https://graph.facebook.com/v19.0/${pageId}?fields=id,name,access_token,instagram_business_account{id,username,profile_picture_url}&access_token=${finalAccessToken}`
                        );
                        const singlePageData = await singlePageRes.json();

                        if (singlePageData.id) {
                            pages.push(singlePageData);
                        } else {
                            logToFile(`Failed to fetch individual page ${pageId}`, singlePageData);
                        }
                    } catch (e) {
                        console.error('Error fetching single page', e);
                    }
                }
            }
        }

        logToFile('Pages Found', pages.map((p: any) => ({
            id: p.id,
            name: p.name,
            has_ig: !!p.instagram_business_account,
            ig_details: p.instagram_business_account
        })));

        const pageWithIg = pages.find((page: any) => page.instagram_business_account);

        if (!pageWithIg) {
            logToFile('No Page with IG found');
            return NextResponse.json({
                error: 'No Instagram Business Account connected to your Facebook Pages. Please check your Facebook Page settings > Linked Accounts > Instagram.'
            }, { status: 404 });
        }

        const igAccount = pageWithIg.instagram_business_account;
        logToFile('Success', { igAccount });

        return NextResponse.json({
            success: true,
            instagram_user_id: igAccount.id,
            username: igAccount.username,
            access_token: finalAccessToken,
            token_expires_at: expiresAt
        });

    } catch (error: any) {
        logToFile('Exception Caught', error.message);
        console.error('Instagram Token Exchange Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

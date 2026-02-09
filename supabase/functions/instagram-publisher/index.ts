
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const GRAPH_API_URL = "https://graph.facebook.com/v19.0";

serve(async (req) => {
    try {
        // Initialize Supabase Client
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // check for pending posts due for publishing
        const now = new Date().toISOString();
        const { data: posts, error: fetchError } = await supabase
            .from('scheduled_posts')
            .select(`
                *,
                instagram_accounts (
                    access_token,
                    instagram_user_id
                )
            `)
            .eq('status', 'pending')
            .lte('scheduled_time', now)
            .limit(10); // Process batch of 10

        if (fetchError) throw fetchError;

        if (!posts || posts.length === 0) {
            return new Response(JSON.stringify({ message: 'No posts to publish' }), {
                headers: { "Content-Type": "application/json" },
            });
        }

        const results = [];

        for (const post of posts) {
            try {
                const account = post.instagram_accounts;
                if (!account) throw new Error('Instagram account not found');

                const accessToken = account.access_token;
                const igUserId = account.instagram_user_id;
                const imageUrls = post.image_urls;
                const caption = post.caption || '';

                let containerId;

                // Step 1: Create Media Container(s)
                if (imageUrls.length === 1) {
                    // Single Image
                    const mediaResponse = await fetch(`${GRAPH_API_URL}/${igUserId}/media?image_url=${encodeURIComponent(imageUrls[0])}&caption=${encodeURIComponent(caption)}&access_token=${accessToken}`, {
                        method: 'POST'
                    });
                    const mediaData = await mediaResponse.json();
                    if (mediaData.error) throw new Error(`Media creation failed: ${mediaData.error.message}`);
                    containerId = mediaData.id;

                } else {
                    // Carousel
                    // 1. Create items
                    const itemIds = [];
                    for (const url of imageUrls) {
                        const itemResponse = await fetch(`${GRAPH_API_URL}/${igUserId}/media?image_url=${encodeURIComponent(url)}&is_carousel_item=true&access_token=${accessToken}`, {
                            method: 'POST'
                        });
                        const itemData = await itemResponse.json();
                        if (itemData.error) throw new Error(`Carousel item creation failed: ${itemData.error.message}`);
                        itemIds.push(itemData.id);
                    }

                    // 2. Create Carousel Container
                    const containerResponse = await fetch(`${GRAPH_API_URL}/${igUserId}/media?media_type=CAROUSEL&children=${itemIds.join(',')}&caption=${encodeURIComponent(caption)}&access_token=${accessToken}`, {
                        method: 'POST'
                    });
                    const containerData = await containerResponse.json();
                    if (containerData.error) throw new Error(`Carousel container creation failed: ${containerData.error.message}`);
                    containerId = containerData.id;
                }

                // Step 2: Publish Container
                const publishResponse = await fetch(`${GRAPH_API_URL}/${igUserId}/media_publish?creation_id=${containerId}&access_token=${accessToken}`, {
                    method: 'POST'
                });
                const publishData = await publishResponse.json();
                if (publishData.error) throw new Error(`Publish failed: ${publishData.error.message}`);

                // Success!
                await supabase
                    .from('scheduled_posts')
                    .update({
                        status: 'published',
                        instagram_media_id: containerId,
                        instagram_post_id: publishData.id,
                        result_details: publishData,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', post.id);

                results.push({ id: post.id, status: 'success', postId: publishData.id });

            } catch (err: any) {
                console.error(`Failed to publish post ${post.id}:`, err);
                await supabase
                    .from('scheduled_posts')
                    .update({
                        status: 'failed',
                        error_message: err.message,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', post.id);

                results.push({ id: post.id, status: 'failed', error: err.message });
            }
        }

        return new Response(JSON.stringify({ results }), {
            headers: { "Content-Type": "application/json" },
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});

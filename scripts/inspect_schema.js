const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://klptqvqmuibhejihyzfs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtscHRxdnFtdWliaGVqaWh5emZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MDc0MzQsImV4cCI6MjA4MzI4MzQzNH0.sSqSJzYALg_jsAPPlKj1f0-uW3Wn-u5jT0frm_QbdIg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log('--- INSPECTING SCHEMA ---');

    console.log('\n--- INFLUENCERS TABLE ---');
    const { data: infData, error: infError } = await supabase.from('influencers').select('*').limit(1);
    if (infError) console.error('Error:', infError.message);
    else if (infData.length > 0) console.log(JSON.stringify(Object.keys(infData[0]), null, 2));
    else console.log('No data found in influencers table');

    console.log('\n--- INSTAGRAM_ACCOUNTS TABLE ---');
    const { data: instaData, error: instaError } = await supabase.from('instagram_accounts').select('*').limit(1);
    if (instaError) console.error('Error:', instaError.message);
    else if (instaData.length > 0) console.log(JSON.stringify(Object.keys(instaData[0]), null, 2));
    else console.log('No data found in instagram_accounts table');

    console.log('\n--- INFLUENCER_SETTINGS TABLE ---');
    const { data: setData, error: setError } = await supabase.from('influencer_settings').select('*').limit(1);
    if (setError) console.log('Error (likely table does not exist or empty):', setError.message);
    else if (setData.length > 0) console.log(JSON.stringify(Object.keys(setData[0]), null, 2));
    else console.log('No data found in influencer_settings table');
}

inspect();

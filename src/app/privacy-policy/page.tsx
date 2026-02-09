
import React from 'react';

export default function PrivacyPolicy() {
    return (
        <div className="max-w-4xl mx-auto p-8 prose dark:prose-invert">
            <h1>Privacy Policy for InfluGen Scheduler</h1>
            <p>Last updated: {new Date().toLocaleDateString()}</p>

            <h2>1. Introduction</h2>
            <p>InfluGen Scheduler ("we", "our", or "us") respects your privacy. This Privacy Policy explains how we collect, use, and protect your information when you use our Instagram scheduling features.</p>

            <h2>2. Data We Collect</h2>
            <p>When you connect your Instagram Business account, we receive:</p>
            <ul>
                <li>Your Instagram username and account ID.</li>
                <li>An access token to publish content on your behalf.</li>
            </ul>
            <p>We do not collect or store your passwords.</p>

            <h2>3. How We Use Your Data</h2>
            <p>We use your data solely to:</p>
            <ul>
                <li>Authenticate your account with the Instagram Graph API.</li>
                <li>Schedule and publish posts that you create within our application.</li>
                <li>Display your account status (connected/disconnected).</li>
            </ul>

            <h2>4. Data Sharing</h2>
            <p>We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties. Your data is effectively shared with Meta (Instagram) when you trigger a post publication.</p>

            <h2>5. Data Deletion</h2>
            <p>You can disconnect your account at any time within the application settings, which will remove your access token from our database.</p>

            <h2>6. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us.</p>
        </div>
    );
}

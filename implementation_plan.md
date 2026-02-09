# Implementation Plan - Instagram Integration & Scheduler

Based on the prompt, we need to add an Instagram Scheduling feature, integrate it with the "Continued" section (Series), and create a Calendar interface.

## User Review Required

> [!IMPORTANT]
> **Data Privacy & Permissions**: This feature requires `instagram_basic` and `instagram_content_publish` permissions. Users must connect their Facebook Page linked to an Instagram Business/Creator account.
> **Scheduling**: We will use Supabase Cron (pg_cron) and Edge Functions to clear the scheduling queue every minute.

## Proposed Changes

### Database (Supabase)

#### `instagram_accounts`
- `id` (uuid, PK)
- `user_id` (uuid, references auth.users)
- `instagram_user_id` (text)
- `access_token` (text, encrypted if possible)
- `token_expires_at` (timestamp)
- `created_at` (timestamp, default now())

#### `scheduled_posts`
- `id` (uuid, PK)
- `user_id` (uuid, references auth.users)
- `instagram_account_id` (uuid, references instagram_accounts)
- `image_urls` (text[])
- `caption` (text)
- `scheduled_time` (timestamp)
- `status` (enum: 'pending', 'published', 'failed')
- `instagram_media_id` (text, nullable)
- `error_message` (text, nullable)
- `created_at` (timestamp, default now())

### Backend (Edge Functions / API)

#### `instagram-publisher` (Edge Function)
- **Trigger**: Cron job every 1 minute.
- **Logic**:
  1. Select `scheduled_posts` where `status = 'pending'` and `scheduled_time <= now()`.
  2. For each post:
     a. Fetch associated `instagram_account` access token.
     b. Call Instagram Graph API (`POST /me/media` with `image_url`, `caption`).
     c. Call Instagram Graph API (`POST /me/media_publish` with `creation_id`).
     d. Update `status` to 'published' or 'failed'.

### Frontend

#### Components

- **`InstagramConnect`**: Button to initiate OAuth flow.
- **`PostSchedulerBubble`**: Similar to `SeriesCreatorBubble`, appears when `contentMode === 'continued'`. Allows selecting images and clicking "Schedule Post".
- **`SchedulePostModal`**: Form to set time, date, caption.
- **`CalendarView`**: Full-page calendar using `react-big-calendar`.

#### Pages

- **`/scheduler`**: The new calendar page.
- **`/settings`** (or sidebar): Add "Connect Instagram" section.

## Verification Plan

### Automated Tests
- None currently in codebase.

### Manual Verification
1. **Database Setup**:
   - Run SQL in Supabase Dashboard.
   - Verify tables exist.
2. **Auth Integration**:
   - Click "Connect Instagram".
   - Verify `instagram_accounts` entry created.
3. **Scheduling Flow**:
   - Go to "Continued".
   - Select images -> "Schedule".
   - Fill form -> Submit.
   - Verify `scheduled_posts` entry created with `status='pending'`.
4. **Calendar View**:
   - Go to `/scheduler`.
   - Verify the post appears on the correct date/time.
5. **Publishing (Mock)**:
   - Since we might not have a live IG app immediately, we can mock the Edge Function response or trigger it manually and check logs.

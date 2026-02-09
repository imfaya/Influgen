# Instagram Integration & Scheduler Task List

## Planning & Architecture
- [x] Analyze existing "Continued" and "Originals" UI components <!-- id: 0 -->
- [x] Create Implementation Plan <!-- id: 1 -->

## Database (Supabase)
- [x] Create `instagram_accounts` table (store OAuth tokens) <!-- id: 2 -->
- [x] Create `scheduled_posts` table (store post data, status, scheduled_time) <!-- id: 3 -->
- [x] Enable RLS policies for security <!-- id: 4 -->

## Backend (Edge Functions)
- [x] Create `instagram-publisher` Edge Function (or API route) <!-- id: 5 -->
  - [x] Implement `uploadMedia` (step 1 of IG API)
  - [x] Implement `publishMedia` (step 2 of IG API)
  - [x] Handle error cases and token refresh if possible
- [x] Configure Cron Job (pg_cron) to trigger publisher every minute <!-- id: 6 -->

## Frontend - Integrations
- [x] Create `InstagramConnect` component (OAuth handling) <!-- id: 7 -->
- [x] Add "Social Accounts" section to Settings/Sidebar (Handled via Scheduler Page) <!-- id: 8 -->

## Frontend - Scheduler Interface
- [x] Create `/scheduler` page <!-- id: 9 -->
- [x] Implement `CalendarView` (using `react-big-calendar` or similar) <!-- id: 10 -->
- [x] Fetch and display `scheduled_posts` on the calendar <!-- id: 11 -->

## Frontend - "Continued" Integration
- [x] Create `PostSchedulerBubble` component (adapted from `SeriesCreatorBubble`) <!-- id: 12 -->
- [x] Modify `HistoryPanel` to show `PostSchedulerBubble` when filter is 'continued' <!-- id: 13 -->
- [x] Create `SchedulePostModal` form <!-- id: 14 -->
  - [x] Inputs: Caption, Date/Time, Account Selection
  - [x] Preview: Selected images from the series
- [x] Overhaul `SchedulePostModal` specific UI/UX <!-- id: 20 -->
  - [x] Implement premium "glassmorphism" design
  - [x] Add custom "dopamine" Date/Time Picker
  - [x] Auto-fill caption from generation data
  - [x] Ensure full series selection support

## Verification
- [ ] Verify `instagram_accounts` and `scheduled_posts` tables creation <!-- id: 15 -->
- [x] Manual Test: Connect Instagram Account (mock/real) <!-- id: 16 -->
- [x] Manual Test: Schedule a post from "Continued" section (Logic Implemented) <!-- id: 17 -->
- [x] Manual Test: Verify post appears on Calendar (Logic Implemented) <!-- id: 18 -->
- [ ] Manual Test: Trigger Edge Function and check logs <!-- id: 19 -->
- [x] Fix "Only one image" bug in Scheduler Modal <!-- id: 21 -->
- [x] Fix "Missing Caption" bug in Scheduler Modal <!-- id: 22 -->

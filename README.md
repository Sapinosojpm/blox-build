# 🏠 BloxBuild Hub

**BloxBuild Hub** is a premium, high-fidelity full-stack community creations catalog and commissions exchange specifically engineered for the Roblox Bloxburg community. 

Designed with a sleek, Roblox-inspired dark-mode gaming aesthetic featuring deep onyx backdrops, glowing cyber-neon highlights (cyan and violet), glassmorphic panels, and butter-smooth micro-animations, BloxBuild Hub is the ultimate platform for Bloxburg architects to showcase their designs, receive reviews, and manage commissions queues.

---

## 🚀 Key Features

*   🏠 **Elite Creations Catalog:** Browse and showcase detailed architectural builds categorized by budget (Bloxburg Cash), styles (e.g., Linen, Aesthetic, Modern, Blush), and categories (e.g., Modern Mansion, Cozy Cottage, Cafe/Restaurant).
*   🔐 **Secure Google OAuth:** Real-time sign-in and sign-up with Google accounts integrated directly via Supabase Auth, featuring automatic database profile provisioning.
*   📅 **Direct Bookings & Commissions:** A comprehensive custom queue dashboard allowing clients to book builders, set prices, send messages, and allowing builders to accept, decline, or complete bookings.
*   👑 **Subscription Tiers:** Multi-level premium roles (Free, Elite, and Pro) with visual tier badge indicators, customized queue dashboards, and custom catalog limits.
*   💬 **Architect Critiques:** Advanced comment sections for community feedback and likes/saves catalog bookmarks.
*   📁 **Supabase CDN Storage:** Integrated, lightning-fast image upload pipelines straight to Supabase Storage with robust Row-Level Security (RLS) policies.

---

## 🛠️ Technology Stack

*   **Frontend Core:** Next.js (App Router), React, TypeScript.
*   **State Management:** Zustand (Decoupled store system with LocalStorage offline fallbacks).
*   **Styling & Motion:** Tailwind CSS, Lucide Icons, Framer Motion.
*   **Database & Backend:** Supabase (PostgreSQL), Next.js API Route Handlers.
*   **Authentication & Storage:** Supabase Auth (PKCE flow & OAuth), Supabase CDN Storage.

---

## ⚙️ Environment Variables Config

Create a `.env.local` file in your root directory and define the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-jwt-anon-public-key

# Note: You can keep SUPABASE_SERVICE_ROLE_KEY blank for local client operations
SUPABASE_SERVICE_ROLE_KEY=
```

---

## 📦 Local Quickstart

1. **Clone the repository:**
   ```bash
   git clone git@github.com:Sapinosojpm/blox-build.git
   cd blox-build
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the local development server:**
   ```bash
   npm run dev
   ```
   Open **[http://localhost:3000](http://localhost:3000)** in your browser to view the application.

---

## 🗄️ Supabase DB Schema & Storage Setup

### 1. Database Migrations
Copy the SQL content inside the `lib/supabase/schema.sql` file and execute it in your **Supabase SQL Editor** to automatically generate:
*   `profiles`, `builds`, `likes`, `saves`, `comments`, `bookings`, and `follows` tables.
*   A database trigger function that automatically inserts profile records for new user signups (including Google OAuth signups).
*   Full Row-Level Security (RLS) security policies.

### 2. Storage Bucket Setup
1. In the Supabase Dashboard, navigate to **Storage** and click **New Bucket**.
2. Name the bucket exactly: **`build-images`** and toggle **Public bucket** to **ON**.
3. Open the **SQL Editor**, paste the following script, and click **Run** to set up storage upload permissions:
   ```sql
   -- 1. Allow anyone to view images
   CREATE POLICY "Public Read Access"
   ON storage.objects FOR SELECT
   USING ( bucket_id = 'build-images' );

   -- 2. Allow authenticated uploads
   CREATE POLICY "Authenticated Manage Access"
   ON storage.objects FOR ALL
   TO authenticated
   USING ( bucket_id = 'build-images' )
   WITH CHECK ( bucket_id = 'build-images' );
   ```

---

## 🤝 Contributing

Contributions are welcome! If you want to add new styles, improve booking notifications, or polish the cyber-neon dashboard aesthetics, feel free to fork this repository, make a branch, and submit a pull request.

*Developed with ❤️ for Roblox Bloxburg Creators.*

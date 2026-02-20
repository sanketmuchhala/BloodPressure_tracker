# Blood Pressure Tracker

A minimal, mobile-first bilingual (Gujarati + English) blood pressure logging web application. Track your blood pressure readings with photo capture and OCR text extraction.

## Features

- 📱 **Mobile-First**: Optimized for iPhone and mobile devices
- 🌐 **Bilingual**: Gujarati (default) and English with language toggle
- 📸 **Photo Capture**: Take photos of BP monitors with mobile camera
- 🔍 **OCR**: Automatic text extraction from photos using Tesseract.js
- 🗜️ **Image Compression**: Client-side compression before upload
- 🔐 **Secure**: Supabase Auth with Row Level Security (RLS)
- 📊 **Logs**: View history of all readings with photos
- ⚡ **Fast**: Vite + React for lightning-fast performance

## Tech Stack

- **Frontend**: Vite + React
- **Styling**: Tailwind CSS (premium minimal design)
- **Backend**: Supabase (Auth + Database + Storage)
- **OCR**: Tesseract.js (lazy-loaded)
- **Image Compression**: browser-image-compression
- **Routing**: React Router DOM
- **Deployment**: Static hosting (Vercel/Netlify/Cloudflare Pages)

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- Supabase account (free tier works fine)

## Local Development Setup

### 1. Clone and Install

```bash
# Navigate to project directory
cd BloodPressure_tracker

# Install dependencies
npm install
```

### 2. Supabase Setup

#### Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready

#### Run Database Migration

1. Go to **SQL Editor** in Supabase dashboard
2. Open `supabase/migration.sql` from this project
3. Copy the entire SQL content
4. Paste and run in SQL Editor
5. Verify success message

#### Create Storage Bucket

1. Go to **Storage** in Supabase dashboard
2. Click **"New bucket"**
3. Settings:
   - Name: `bp-photos`
   - Public: **NO** (keep private)
   - File size limit: 5 MB
   - Allowed MIME types: image/jpeg, image/jpg, image/png
4. Click **"Create bucket"**

#### Apply Storage Policies

1. Go to **SQL Editor** again
2. Open `supabase/storage-policy.sql` from this project
3. Copy and run the SQL policies
4. Verify success message

#### Get API Credentials

1. Go to **Settings → API** in Supabase dashboard
2. Copy the following:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public** key (starts with `eyJ...`)

### 3. Environment Variables

```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your Supabase credentials
nano .env
```

Add your credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 4. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 5. Mobile Testing

To test on your mobile device:

1. Make sure your phone and computer are on the same WiFi network
2. Note the network URL shown in the terminal (e.g., `http://192.168.1.x:5173`)
3. Open that URL on your phone's browser

## Building for Production

```bash
# Build static files
npm run build

# Preview production build locally
npm run preview
```

The built files will be in the `/dist` folder.

## Deployment

This is a **static frontend** application. You can deploy it to any static hosting service.

### Deploy to Vercel (Recommended)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Set environment variables in Vercel dashboard or via CLI:
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   ```

### Deploy to Netlify

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Deploy:
   ```bash
   netlify deploy
   ```

3. Set environment variables in Netlify dashboard under **Site settings → Environment variables**

### Deploy to Cloudflare Pages

1. Connect your GitHub repository to Cloudflare Pages
2. Build settings:
   - Build command: `npm run build`
   - Build output: `dist`
3. Add environment variables in Cloudflare dashboard

## Project Structure

```
/
├── src/
│   ├── components/          # Reusable components
│   │   ├── Layout.jsx       # Header + Navigation wrapper
│   │   ├── Navigation.jsx   # Tabs + language toggle
│   │   ├── ProtectedRoute.jsx  # Auth gate
│   │   └── ImageModal.jsx   # Full-size photo viewer
│   ├── pages/               # Page components
│   │   ├── Login.jsx        # Email magic link login
│   │   ├── Entry.jsx        # Create new BP log
│   │   └── Logs.jsx         # View all logs
│   ├── i18n/                # Internationalization
│   │   ├── strings.js       # All UI text (Gujarati + English)
│   │   └── useLang.js       # Language state hook
│   ├── utils/               # Utility functions
│   │   ├── supabase.js      # Supabase client
│   │   ├── imageCompression.js  # Image compression
│   │   └── ocr.js           # OCR with parsing
│   ├── App.jsx              # Main app with routing
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles
├── supabase/                # Supabase setup
│   ├── migration.sql        # Database schema + RLS
│   └── storage-policy.sql   # Storage bucket policies
├── index.html               # HTML template
├── package.json             # Dependencies
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind config
└── .env.example             # Environment variables template
```

## Usage

### First Time Setup

1. Open the app
2. Enter your email on the login page
3. Click **"Send Magic Link"**
4. Check your email and click the login link
5. You'll be redirected to the Entry page

### Adding a Blood Pressure Reading

1. Navigate to **Entry** tab
2. (Optional) Click **"Take Photo"** to capture BP monitor
3. (Optional) Click **"Run OCR"** to extract values
4. Enter or verify **Systolic**, **Diastolic**, and **Pulse**
5. Adjust **Reading Time** if needed
6. Click **"Save"**

### Viewing Logs

1. Navigate to **Logs** tab
2. View all your past readings
3. Click on photo thumbnails to see full-size images

### Language Toggle

Click the language toggle button (ગુ / En) in the top-right corner to switch between Gujarati and English.

## Security

- **Authentication**: Email magic link (no password required)
- **Row Level Security**: Users can only access their own data
- **Private Storage**: Photos stored in private bucket with signed URLs
- **Environment Variables**: Sensitive credentials in .env (not committed)

## OCR Parsing

The app implements robust OCR parsing with multiple strategies:

1. **Slash pattern**: Detects "120/80" format
2. **Keyword-based**: Looks for SYS, DIA, PULSE, PR, HR
3. **Three-number pattern**: Detects systolic, diastolic, pulse in sequence
4. **Best effort**: Falls back to range-based matching

OCR results are always shown in the input fields for user verification before saving.

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Safari (iOS): ✅ Full support (tested on iPhone)
- Firefox: ✅ Full support
- Samsung Internet: ✅ Full support

## Troubleshooting

### OCR not working

- Make sure the photo is clear and well-lit
- Try running OCR again
- If it fails, enter values manually (always works)

### Images not showing in Logs

- Check if storage bucket was created correctly
- Verify storage policies are applied
- Check browser console for errors

### Login link not received

- Check spam folder
- Verify email address is correct
- Try again after a few minutes

### Build errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear build cache
rm -rf dist
npm run build
```

## Development

### Key Implementation Notes

1. **Image Compression**: Always compress before OCR and upload (max 1280px, JPEG quality 0.7)
2. **OCR Lazy Loading**: Tesseract.js loads only when needed (keeps bundle small)
3. **Signed URLs**: Photos accessed via 1-hour signed URLs (not public)
4. **i18n**: All UI text in `src/i18n/strings.js` (no hardcoded text in components)
5. **RLS**: Database queries automatically filtered by user_id

### Adding New Translations

Edit `src/i18n/strings.js` and add new keys to both `gu` and `en` objects.

## License

This project is for personal use.

## Support

For issues or questions, please create an issue on GitHub.

---

Built with ❤️ using Vite, React, Tailwind CSS, and Supabase

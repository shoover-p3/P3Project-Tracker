# Easy Strength Workout Tracker

A web-based workout tracking application for the Easy Strength training protocol.

## Deploy to GitHub Pages

### Option 1: Using GitHub.com (Easiest - No CLI needed)

1. **Create a new repository on GitHub:**
   - Go to https://github.com/new
   - Name it: `workout-tracker` (or any name you prefer)
   - Make it **Public**
   - Do NOT initialize with README, .gitignore, or license
   - Click "Create repository"

2. **Push your code:**
   - Copy and paste these commands in your terminal (one at a time):
   ```bash
   cd "C:\Users\SHoover\ClaudeProjects"
   git remote add origin https://github.com/YOUR-USERNAME/workout-tracker.git
   git branch -M main
   git push -u origin main
   ```
   (Replace `YOUR-USERNAME` with your actual GitHub username)

3. **Enable GitHub Pages:**
   - Go to your repository on GitHub
   - Click "Settings" tab
   - Click "Pages" in the left sidebar
   - Under "Source", select branch: `main` and folder: `/ (root)`
   - Click "Save"

4. **Access your app:**
   - Wait 1-2 minutes for deployment
   - Your app will be live at: `https://YOUR-USERNAME.github.io/workout-tracker/`

### Option 2: Deploy to Netlify (Alternative)

1. **Create a free Netlify account:**
   - Go to https://www.netlify.com/
   - Sign up with your GitHub account

2. **Deploy:**
   - Click "Add new site" → "Deploy manually"
   - Drag and drop `index.html` into the upload area
   - Your site will be live instantly!
   - Netlify will give you a URL like: `https://random-name-123.netlify.app`

3. **Optional - Custom URL:**
   - Go to Site settings → Domain management
   - Click "Options" → "Edit site name"
   - Choose a custom name: `your-workout-tracker.netlify.app`

## Features

- **Primary Movement:** Easy Strength protocol with auto-calculated weights
- **Upper Press/Pull/Lower Push/Finisher:** Customizable exercises with alternating schemes
- **Workout Notes:** Track RPE and performance notes for each movement
- **History:** View past workouts with full details
- **Mobile-Friendly:** Works great on phones and tablets
- **Offline-Ready:** All data stored locally in your browser

## Usage

1. Go to **Settings** tab
2. Configure your exercises, weights, and sets/reps
3. Click "Save Settings"
4. Go to **Workout** tab
5. Complete your workout and add notes
6. Click "Complete Workout" when done

Your progress is saved automatically!

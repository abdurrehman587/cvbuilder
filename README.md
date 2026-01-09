# Get Glory - CV Builder, ID Card Printer & Marketplace

A comprehensive web application for creating professional CVs, printing ID cards, and shopping in an online marketplace.

## Features

- **CV Builder**: Create professional CVs with multiple templates
- **ID Card Printer**: Print custom ID cards with photos
- **Online Marketplace**: Shop for products with secure payment options
- **User Authentication**: Secure login with Google Sign-In support
- **Admin Panel**: Manage users, products, and orders
- **PWA Support**: Install as a Progressive Web App

## Tech Stack

- React
- Supabase (Authentication & Database)
- Capacitor (Android App)
- React Router
- Tailwind CSS

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Building for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` folder.

## Android App

The app is configured for Android using Capacitor. To build the Android app:

1. Build the production web app:
   ```bash
   npm run build
   ```

2. Sync with Capacitor:
   ```bash
   npx cap sync android
   ```

3. Open in Android Studio:
   ```bash
   npx cap open android
   ```

4. Build the AAB file in Android Studio

For detailed Play Store upload instructions, see `READY_FOR_PLAYSTORE.md`.

## Project Structure

```
src/
├── components/     # React components
├── App.js         # Main application component
├── AppRouter.js   # Routing configuration
└── ...
```

## License

Copyright © Get Glory. All rights reserved.

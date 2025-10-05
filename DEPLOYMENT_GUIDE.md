# CV Builder - Full-Stack Deployment Guide

## 🚀 **Deploy Both Frontend & Backend on Same Hosting**

### **Option 1: Vercel (Recommended)**

#### **Frontend (Already Deployed)**
- ✅ Your frontend is already on Vercel
- ✅ Automatic deployments from GitHub
- ✅ Global CDN

#### **Backend Deployment to Vercel**

**Step 1: Deploy Backend to Vercel**
```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to backend directory
cd cv_builder_nodejs_backend

# Deploy to Vercel
vercel

# Follow the prompts:
# - Link to existing project? No
# - Project name: cv-builder-backend
# - Directory: ./
# - Override settings? No
```

**Step 2: Update Frontend Backend URL**
After deployment, Vercel will give you a URL like:
`https://cv-builder-backend-abc123.vercel.app`

Update the frontend code:
```javascript
// In frontend/js/cv-builder.js, line ~2922
const backendUrl = isLocalhost ? 'http://localhost:3000' : 'https://your-actual-vercel-url.vercel.app';
```

**Step 3: Push Changes**
```bash
git add .
git commit -m "Update backend URL for production"
git push origin main
```

### **Option 2: Railway (Alternative)**

#### **Deploy Backend to Railway**
1. Go to [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Select the `cv_builder_nodejs_backend` folder
4. Deploy automatically

#### **Update Frontend Backend URL**
```javascript
// Update the backend URL in frontend
const backendUrl = isLocalhost ? 'http://localhost:3000' : 'https://your-railway-url.railway.app';
```

### **Option 3: Render (Alternative)**

#### **Deploy Backend to Render**
1. Go to [render.com](https://render.com)
2. Create new Web Service
3. Connect GitHub repository
4. Select `cv_builder_nodejs_backend` folder
5. Deploy

#### **Update Frontend Backend URL**
```javascript
// Update the backend URL in frontend
const backendUrl = isLocalhost ? 'http://localhost:3000' : 'https://your-render-url.onrender.com';
```

## **💰 Cost Comparison:**

| Service | Frontend | Backend | Total/Month |
|---------|----------|---------|-------------|
| **Vercel** | Free | Free (Pro: $20) | $0-20 |
| **Railway** | Free (GitHub Pages) | $5 | $5 |
| **Render** | Free (GitHub Pages) | $7 | $7 |
| **DigitalOcean** | $5 | $5 | $10 |

## **🎯 Recommended Setup:**

### **For Free Tier:**
1. **Frontend**: Vercel (already deployed)
2. **Backend**: Railway ($5/month) or Render ($7/month)

### **For Professional:**
1. **Frontend**: Vercel Pro ($20/month)
2. **Backend**: Vercel Serverless Functions (included)

## **📋 Deployment Steps:**

### **1. Deploy Backend to Vercel:**
```bash
cd cv_builder_nodejs_backend
vercel
```

### **2. Get Backend URL:**
After deployment, you'll get a URL like:
`https://cv-builder-backend-abc123.vercel.app`

### **3. Update Frontend:**
Replace `your-backend-url.vercel.app` with your actual Vercel URL in:
`frontend/js/cv-builder.js` line 2922

### **4. Push Changes:**
```bash
git add .
git commit -m "Update backend URL for production deployment"
git push origin main
```

## **✅ Benefits of Same Platform:**

1. **Unified Management**: Both frontend and backend in one place
2. **Automatic Deployments**: Deploy both from GitHub
3. **Global CDN**: Fast loading worldwide
4. **SSL Certificates**: Automatic HTTPS
5. **Environment Variables**: Easy configuration
6. **Monitoring**: Built-in analytics and logs

## **🚀 Your CV Builder Will Have:**

- ✅ **Frontend**: Professional CV Builder interface
- ✅ **Backend**: High-quality PDF generation
- ✅ **Global Access**: Available worldwide
- ✅ **Automatic Updates**: Deploy from GitHub
- ✅ **Professional Quality**: A4 PDFs with three templates
- ✅ **Fast Performance**: Global CDN and optimized backend

**Yes, you can absolutely run both frontend and backend on the same hosting platform!** 🎉

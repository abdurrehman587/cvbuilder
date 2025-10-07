# Manual Vercel Backend Deployment

## 🚀 **Deploy Your Backend to Vercel**

Since you're already logged into Vercel, here are the steps to deploy your backend:

### **Method 1: Using Vercel Dashboard (Recommended)**

#### **Step 1: Go to Vercel Dashboard**
1. Visit: https://vercel.com/abdurrehmans-projects-37746bc3/cvbuilder
2. Click "New Project" or "Import Project"

#### **Step 2: Import Your Repository**
1. Select your GitHub repository: `abdurrehman587/cvbuilder`
2. Choose "Root Directory" → `cv_builder_nodejs_backend`
3. Click "Deploy"

#### **Step 3: Configure Project**
- **Project Name**: `cv-builder-backend`
- **Framework Preset**: Node.js
- **Root Directory**: `cv_builder_nodejs_backend`
- **Build Command**: (leave empty)
- **Output Directory**: (leave empty)
- **Install Command**: `npm install`

#### **Step 4: Deploy**
Click "Deploy" and wait for the deployment to complete.

### **Method 2: Using Vercel CLI**

#### **Step 1: Run the Deployment Script**
```bash
# In the cv_builder_nodejs_backend directory
deploy_to_vercel.bat
```

#### **Step 2: Follow Authentication**
- The script will open a browser window
- Click "Authorize" to authenticate
- Return to terminal

#### **Step 3: Complete Deployment**
The script will automatically deploy your backend.

### **Step 3: Get Your Backend URL**

After deployment, you'll get a URL like:
```
https://cv-builder-backend-abc123.vercel.app
```

### **Step 4: Update Frontend**

Update the frontend code with your actual backend URL:

**File**: `frontend/js/cv-builder.js` (line 2922)
```javascript
const backendUrl = isLocalhost ? 'http://localhost:3000' : 'https://YOUR-ACTUAL-VERCEL-URL.vercel.app';
```

Replace `YOUR-ACTUAL-VERCEL-URL.vercel.app` with your actual Vercel URL.

### **Step 5: Push Changes**

```bash
git add .
git commit -m "Update backend URL for production deployment"
git push origin main
```

## **✅ Your Backend Will Have:**

- ✅ **PDF Generation**: Professional A4 PDFs
- ✅ **Three Templates**: Classic, Modern, Minimalist
- ✅ **Global Access**: Available worldwide
- ✅ **Automatic Deployments**: Deploy from GitHub
- ✅ **SSL Certificate**: Secure HTTPS connection
- ✅ **Performance**: Fast global CDN

## **🔧 Backend Features:**

- **Endpoint**: `POST /api/pdf/generate`
- **Health Check**: `GET /up`
- **CORS**: Enabled for frontend integration
- **Puppeteer**: High-quality PDF generation
- **A4 Page Size**: Professional print-ready PDFs

## **🎉 Success!**

Once deployed, your CV Builder will have:
- ✅ **Frontend**: Professional CV Builder (on Vercel)
- ✅ **Backend**: PDF generation service (on Vercel)
- ✅ **Full-Stack**: Complete solution on one platform
- ✅ **Global**: Available worldwide with fast performance



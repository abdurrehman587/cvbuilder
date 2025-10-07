# CV Builder Backend

This is a Node.js backend for CV Builder PDF generation.

## Deployment

This backend should be deployed as a separate Vercel project with:
- Framework: Express
- Root Directory: `cv_builder_nodejs_backend`
- Build Command: `npm install`
- Output Directory: (leave empty)

## Endpoints

- `GET /up` - Health check
- `GET /test` - Test endpoint
- `POST /api/pdf/generate` - Generate PDF
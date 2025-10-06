# CV Builder Backend - PDF Generation

This directory contains the Rails backend for PDF generation functionality.

## Quick Start

1. **Navigate to backend directory**:
   ```bash
   cd cv_builder_backend
   ```

2. **Install dependencies**:
   ```bash
   bundle install
   ```

3. **Start the server**:
   ```bash
   start_backend.bat
   ```
   Or manually:
   ```bash
   bundle exec rails server -p 3000
   ```

## Features

- ✅ **A4 Page Size**: All PDFs generated with standard A4 dimensions
- ✅ **Professional Typography**: Minimum 12pt font size for print readability
- ✅ **Template Support**: Classic, Modern (two-column), and Minimalist templates
- ✅ **Exact Design Match**: PDFs maintain frontend preview styling
- ✅ **Multi-page Support**: Automatic page breaks for long content
- ✅ **RESTful API**: `POST /api/pdf/generate` endpoint

## API Usage

**Endpoint**: `POST http://localhost:3000/api/pdf/generate`

**Request Body**:
```json
{
  "cv_data": {
    "personalInfo": {
      "fullName": "John Doe",
      "email": "john@example.com",
      "phones": [{"phone": "+1-555-0123"}],
      "address": "123 Main St, City, State",
      "summary": "Professional summary..."
    },
    "education": [...],
    "experience": [...],
    "skills": [...],
    "languages": [...],
    "hobbies": [...],
    "certifications": [...],
    "references": [...],
    "template": "modern"
  }
}
```

**Response**: PDF file download

## Integration

The frontend automatically detects backend availability and uses it for PDF generation. If the backend is unavailable, it falls back to frontend PDF generation.

## Documentation

See `cv_builder_backend/BACKEND_SETUP.md` for detailed setup instructions and technical documentation.

## Testing

Run the test script to verify PDF generation:
```bash
cd cv_builder_backend
ruby test_pdf.rb
```

## Troubleshooting

- **Port 3000 in use**: Use `bundle exec rails server -p 3001`
- **Missing dependencies**: Run `bundle install`
- **Ruby version issues**: Ensure Ruby 3.0+ is installed

## Production Deployment

The backend can be deployed using:
- **Docker**: Use the included Dockerfile
- **Kamal**: Use the included Kamal configuration
- **Traditional hosting**: Standard Rails deployment methods


# Postman Test Guide for File Upload API

## Endpoint Information

**Base URL:** `http://localhost:3000` (or your server URL)  
**Endpoint:** `/api/assessments/{assessmentId}/files`  
**Method:** `POST`

## Prerequisites

1. **Start your Next.js dev server:**
   ```bash
   npm run dev
   ```

2. **Get a valid Assessment ID:**
   - Create an assessment first via `POST /api/assessments`
   - Or use an existing assessment ID from your database
   - Assessment ID should be a UUID (minimum 10 characters)

## Postman Setup

### Step 1: Create a New Request

1. Open Postman
2. Click "New" → "HTTP Request"
3. Set method to **POST**
4. Enter URL: `http://localhost:3000/api/assessments/{assessmentId}/files`
   - Replace `{assessmentId}` with a real assessment ID

### Step 2: Configure Request Body

1. Go to the **Body** tab
2. Select **form-data** (NOT raw or binary)
3. Add a key named: `files`
4. Change the type from "Text" to **"File"** (click the dropdown next to the key)
5. Click "Select Files" and choose your image files
6. To upload multiple files, click the "+" button and add more `files` keys

**Important:** The key name must be exactly `files` (plural)

### Step 3: Set Headers (Optional)

Postman will automatically set:
- `Content-Type: multipart/form-data`

You don't need to manually set this.

### Step 4: Send Request

Click the "Send" button.

## Expected Response

### Success Response (200 OK)
```json
{
  "success": true,
  "uploaded": 2,
  "failed": 0,
  "results": [
    {
      "name": "photo1.jpg",
      "success": true,
      "id": "file-uuid-here",
      "url": "https://your-storage-url.com/path/to/file.jpg"
    },
    {
      "name": "photo2.png",
      "success": true,
      "id": "file-uuid-here-2",
      "url": "https://your-storage-url.com/path/to/file2.png"
    }
  ]
}
```

### Error Responses

**400 Bad Request - No files:**
```json
{
  "error": "No files provided"
}
```

**400 Bad Request - Invalid file type:**
```json
{
  "name": "document.exe",
  "success": false,
  "error": "File type not allowed. Allowed types: .jpg, .jpeg, .png, .gif, .webp, .bmp, .svg, .pdf, .doc, .docx"
}
```

**400 Bad Request - File too large:**
```json
{
  "name": "large-file.jpg",
  "success": false,
  "error": "File size exceeds 10MB limit"
}
```

**404 Not Found:**
```json
{
  "error": "Assessment not found"
}
```

## Allowed File Types

### Images:
- `.jpg`, `.jpeg`
- `.png`
- `.gif`
- `.webp`
- `.bmp`
- `.svg`

### Documents:
- `.pdf`
- `.doc`
- `.docx`

### Limits:
- Maximum file size: **10MB per file**
- Maximum files per upload: **30 files**

## Testing Checklist

- [ ] Upload a single image (JPG/PNG)
- [ ] Upload multiple images at once
- [ ] Upload a PDF document
- [ ] Test with invalid file type (should fail)
- [ ] Test with file larger than 10MB (should fail)
- [ ] Test with invalid assessment ID (should return 404)
- [ ] Test with more than 30 files (should fail)

## GET Files Endpoint

To retrieve uploaded files:

**Method:** `GET`  
**URL:** `http://localhost:3000/api/assessments/{assessmentId}/files`

**Expected Response:**
```json
{
  "data": [
    {
      "id": "file-id",
      "assessment_id": "assessment-id",
      "file_name": "photo.jpg",
      "file_url": "https://...",
      "file_type": "image/jpeg",
      "file_size": 123456,
      "isImage": true,
      "thumbnailUrl": "https://..."
    }
  ]
}
```

## Troubleshooting

1. **"Assessment not found"** - Make sure the assessment ID exists and is not deleted
2. **"No files provided"** - Ensure you're using `form-data` with key name `files`
3. **File upload fails** - Check file size and type restrictions
4. **Connection refused** - Make sure your Next.js server is running on port 3000


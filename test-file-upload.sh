#!/bin/bash

# Test script for file upload API
# Usage: ./test-file-upload.sh <assessment-id> <image-file-path>

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if assessment ID is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Assessment ID is required${NC}"
    echo "Usage: ./test-file-upload.sh <assessment-id> <image-file-path>"
    exit 1
fi

ASSESSMENT_ID=$1
FILE_PATH=$2
BASE_URL="http://localhost:3000"
ENDPOINT="${BASE_URL}/api/assessments/${ASSESSMENT_ID}/files"

echo -e "${YELLOW}Testing File Upload API${NC}"
echo "Assessment ID: ${ASSESSMENT_ID}"
echo "Endpoint: ${ENDPOINT}"
echo ""

# Check if file is provided
if [ -z "$FILE_PATH" ]; then
    echo -e "${YELLOW}No file provided. Testing GET endpoint instead...${NC}"
    
    # Test GET endpoint
    echo "GET ${ENDPOINT}"
    response=$(curl -s -w "\n%{http_code}" "${ENDPOINT}")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ]; then
        echo -e "${GREEN}✓ GET request successful (HTTP $http_code)${NC}"
        echo "Response:"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo -e "${RED}✗ GET request failed (HTTP $http_code)${NC}"
        echo "Response:"
        echo "$body"
    fi
    exit 0
fi

# Check if file exists
if [ ! -f "$FILE_PATH" ]; then
    echo -e "${RED}Error: File not found: ${FILE_PATH}${NC}"
    exit 1
fi

# Get file extension
FILE_EXT="${FILE_PATH##*.}"
FILE_NAME=$(basename "$FILE_PATH")

echo "File: ${FILE_NAME}"
echo "Extension: ${FILE_EXT}"
echo ""

# Test POST endpoint
echo "POST ${ENDPOINT}"
echo "Uploading file..."

response=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -F "files=@${FILE_PATH}" \
    "${ENDPOINT}")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo ""
if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✓ Upload successful (HTTP $http_code)${NC}"
    echo "Response:"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    
    # Extract uploaded count
    uploaded=$(echo "$body" | jq -r '.uploaded' 2>/dev/null)
    failed=$(echo "$body" | jq -r '.failed' 2>/dev/null)
    
    if [ "$uploaded" != "null" ]; then
        echo ""
        echo -e "${GREEN}Summary: ${uploaded} uploaded, ${failed} failed${NC}"
    fi
else
    echo -e "${RED}✗ Upload failed (HTTP $http_code)${NC}"
    echo "Response:"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
fi


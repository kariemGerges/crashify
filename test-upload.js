/**
 * Simple Node.js test script for file upload API
 * Usage: node test-upload.js <assessment-id> <image-path>
 * 
 * Example: node test-upload.js abc123-def456-ghi789 ./test-image.jpg
 */

const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch'); // You may need to install: npm install node-fetch form-data

const BASE_URL = 'http://localhost:3000';

async function testFileUpload(assessmentId, filePath) {
    if (!assessmentId) {
        console.error('❌ Error: Assessment ID is required');
        console.log('Usage: node test-upload.js <assessment-id> <image-path>');
        process.exit(1);
    }

    if (!filePath) {
        console.log('ℹ️  No file provided. Testing GET endpoint...');
        return testGetFiles(assessmentId);
    }

    if (!fs.existsSync(filePath)) {
        console.error(`❌ Error: File not found: ${filePath}`);
        process.exit(1);
    }

    const endpoint = `${BASE_URL}/api/assessments/${assessmentId}/files`;
    const fileName = filePath.split('/').pop();

    console.log('📤 Testing File Upload API');
    console.log(`Assessment ID: ${assessmentId}`);
    console.log(`File: ${fileName}`);
    console.log(`Endpoint: ${endpoint}\n`);

    try {
        const formData = new FormData();
        formData.append('files', fs.createReadStream(filePath));

        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();
        const status = response.status;

        console.log(`Status: ${status} ${response.statusText}\n`);

        if (status === 200) {
            console.log('✅ Upload successful!');
            console.log(`Uploaded: ${data.uploaded}, Failed: ${data.failed}\n`);
            console.log('Results:');
            data.results.forEach((result, index) => {
                if (result.success) {
                    console.log(`  ${index + 1}. ✅ ${result.name}`);
                    console.log(`     ID: ${result.id}`);
                    console.log(`     URL: ${result.url}\n`);
                } else {
                    console.log(`  ${index + 1}. ❌ ${result.name}`);
                    console.log(`     Error: ${result.error}\n`);
                }
            });
        } else {
            console.log('❌ Upload failed');
            console.log('Response:', JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('💡 Make sure your Next.js server is running on port 3000');
        }
    }
}

async function testGetFiles(assessmentId) {
    const endpoint = `${BASE_URL}/api/assessments/${assessmentId}/files`;

    console.log('📥 Testing GET Files API');
    console.log(`Assessment ID: ${assessmentId}`);
    console.log(`Endpoint: ${endpoint}\n`);

    try {
        const response = await fetch(endpoint);
        const data = await response.json();
        const status = response.status;

        console.log(`Status: ${status} ${response.statusText}\n`);

        if (status === 200) {
            console.log(`✅ Found ${data.data.length} file(s)\n`);
            data.data.forEach((file, index) => {
                console.log(`${index + 1}. ${file.file_name}`);
                console.log(`   Type: ${file.file_type}`);
                console.log(`   Size: ${(file.file_size / 1024).toFixed(2)} KB`);
                console.log(`   URL: ${file.file_url}\n`);
            });
        } else {
            console.log('❌ Request failed');
            console.log('Response:', JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('💡 Make sure your Next.js server is running on port 3000');
        }
    }
}

// Get command line arguments
const assessmentId = process.argv[2];
const filePath = process.argv[3];

testFileUpload(assessmentId, filePath);


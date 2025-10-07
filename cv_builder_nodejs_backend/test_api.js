const fetch = require('node-fetch');

// Sample CV data
const sampleCVData = {
  personalInfo: {
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    phones: [{ phone: '+1-555-0123' }],
    address: '123 Main Street, City, State 12345',
    summary: 'Experienced software developer with 5+ years of experience in web development.'
  },
  education: [
    {
      degree: 'Bachelor of Science in Computer Science',
      institution: 'University of Technology',
      year: '2018',
      grade: '3.8 GPA'
    }
  ],
  experience: [
    {
      jobTitle: 'Senior Software Developer',
      company: 'Tech Solutions Inc.',
      duration: '2021 - Present',
      description: 'Lead development of web applications using React, Node.js, and AWS.'
    }
  ],
  skills: [
    { skill: 'JavaScript' },
    { skill: 'React' },
    { skill: 'Node.js' }
  ],
  template: 'modern'
};

async function testAPI() {
  console.log('Testing Node.js Backend API...\n');
  
  try {
    // Test health check
    console.log('1. Testing health check...');
    const healthResponse = await fetch('http://localhost:3000/up');
    const healthText = await healthResponse.text();
    console.log(`✅ Health check: ${healthText}\n`);
    
    // Test PDF generation
    console.log('2. Testing PDF generation...');
    const pdfResponse = await fetch('http://localhost:3000/api/pdf/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cv_data: sampleCVData })
    });
    
    if (pdfResponse.ok) {
      const pdfBuffer = await pdfResponse.buffer();
      console.log(`✅ PDF generated successfully!`);
      console.log(`   File size: ${pdfBuffer.length} bytes`);
      console.log(`   Content-Type: ${pdfResponse.headers.get('content-type')}`);
      console.log(`   Content-Disposition: ${pdfResponse.headers.get('content-disposition')}\n`);
      
      // Save the PDF for verification
      const fs = require('fs');
      const filename = `api_test_${Date.now()}.pdf`;
      fs.writeFileSync(filename, pdfBuffer);
      console.log(`📄 PDF saved as: ${filename}`);
      
    } else {
      console.log(`❌ PDF generation failed: ${pdfResponse.status} ${pdfResponse.statusText}`);
      const errorText = await pdfResponse.text();
      console.log(`   Error: ${errorText}`);
    }
    
  } catch (error) {
    console.log(`❌ API test failed: ${error.message}`);
    console.log('Make sure the server is running on http://localhost:3000');
  }
}

testAPI();



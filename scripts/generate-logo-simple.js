const fs = require('fs');
const path = require('path');

// Simple logo generation using SVG (no dependencies needed)
function generateLogoSVG() {
    const size = 1024;
    const padding = size * 0.25; // 25% padding
    const contentSize = size - (padding * 2);
    const centerX = size / 2;
    
    // Calculate positions
    const crownY = padding + contentSize * 0.15;
    const crownWidth = contentSize * 0.4;
    const crownHeight = contentSize * 0.2;
    
    const leavesY = crownY + crownHeight * 0.8;
    const leavesSize = contentSize * 0.25;
    
    const globeY = leavesY + leavesSize * 0.4;
    const globeRadius = contentSize * 0.15;
    
    const textY = globeY + globeRadius + contentSize * 0.15;
    const textSize = contentSize * 0.15;
    
    // Create SVG
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- White background -->
  <rect width="${size}" height="${size}" fill="#FFFFFF"/>
  
  <!-- Golden Crown -->
  <g transform="translate(${centerX}, ${crownY})">
    <!-- Crown base -->
    <rect x="${-crownWidth/2}" y="0" width="${crownWidth}" height="${crownHeight * 0.4}" 
          fill="#FFD700" stroke="#FFA500" stroke-width="4" rx="5"/>
    <!-- Crown peaks (5 peaks) -->
    ${Array.from({length: 5}, (_, i) => {
        const x = (i - 2) * (crownWidth / 5);
        const peakWidth = crownWidth / 5;
        return `<polygon points="${x},0 ${x + peakWidth/2},${-crownHeight * 0.6} ${x - peakWidth/2},${-crownHeight * 0.6}" 
                 fill="#FFD700" stroke="#FFA500" stroke-width="4"/>`;
    }).join('\n    ')}
  </g>
  
  <!-- Golden Leaves/Laurels -->
  <g transform="translate(${centerX}, ${leavesY})">
    <!-- Left laurel -->
    <circle cx="${-leavesSize * 0.3}" cy="0" r="${leavesSize * 0.15}" fill="#FFD700" stroke="#FFA500" stroke-width="3"/>
    <path d="M ${-leavesSize * 0.5} ${leavesSize * 0.1} Q ${-leavesSize * 0.35} 0 ${-leavesSize * 0.3} ${-leavesSize * 0.05}" 
          stroke="#FFA500" stroke-width="3" fill="none"/>
    <!-- Right laurel -->
    <circle cx="${leavesSize * 0.3}" cy="0" r="${leavesSize * 0.15}" fill="#FFD700" stroke="#FFA500" stroke-width="3"/>
    <path d="M ${leavesSize * 0.5} ${leavesSize * 0.1} Q ${leavesSize * 0.35} 0 ${leavesSize * 0.3} ${-leavesSize * 0.05}" 
          stroke="#FFA500" stroke-width="3" fill="none"/>
  </g>
  
  <!-- Teal Globe -->
  <g transform="translate(${centerX}, ${globeY})">
    <circle cx="0" cy="0" r="${globeRadius}" fill="#20B2AA" stroke="#1E9B95" stroke-width="2"/>
    <!-- Grid lines -->
    ${Array.from({length: 3}, (_, i) => {
        const y = (i - 1) * globeRadius * 0.4;
        return `<line x1="${-globeRadius}" y1="${y}" x2="${globeRadius}" y2="${y}" stroke="#1E9B95" stroke-width="2"/>`;
    }).join('\n    ')}
    ${Array.from({length: 3}, (_, i) => {
        const x = (i - 1) * globeRadius * 0.4;
        return `<line x1="${x}" y1="${-globeRadius}" x2="${x}" y2="${globeRadius}" stroke="#1E9B95" stroke-width="2"/>`;
    }).join('\n    ')}
  </g>
  
  <!-- GLORY Text (Dark Blue, 3D effect) -->
  <g transform="translate(${centerX}, ${textY})">
    <!-- Shadow -->
    <text x="4" y="4" font-family="Arial, sans-serif" font-size="${textSize}" font-weight="bold" 
          fill="rgba(0,0,0,0.3)" text-anchor="middle" dominant-baseline="middle">GLORY</text>
    <!-- Main text -->
    <text x="0" y="0" font-family="Arial, sans-serif" font-size="${textSize}" font-weight="bold" 
          fill="#1E3A8A" text-anchor="middle" dominant-baseline="middle">GLORY</text>
  </g>
</svg>`;
    
    // Save SVG
    const svgPath = path.join(__dirname, '../public/images/glory-logo.svg');
    fs.writeFileSync(svgPath, svg);
    console.log('✅ SVG logo generated!');
    console.log(`📁 Saved to: ${svgPath}`);
    
    // Instructions to convert to PNG
    console.log('\n📝 To convert SVG to PNG, you can:');
    console.log('   1. Open the SVG in a browser or image editor');
    console.log('   2. Export as PNG (1024x1024)');
    console.log('   3. Save as: public/images/glory-logo.png');
    console.log('\n   OR use an online converter:');
    console.log('   https://convertio.co/svg-png/');
    console.log('   https://cloudconvert.com/svg-to-png');
}

// Run
try {
    generateLogoSVG();
} catch (error) {
    console.error('Error generating logo:', error.message);
    process.exit(1);
}


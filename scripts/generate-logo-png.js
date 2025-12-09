const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generateLogoPNG() {
    const size = 1024;
    // Use 15% padding for maximum visibility
    const padding = size * 0.15;
    const contentSize = size - (padding * 2);
    const centerX = size / 2;
    const centerY = size / 2;
    
    // Circle radius - large and centered
    const circleRadius = contentSize * 0.42;
    
    // Create a simple geometric star design in a circular badge
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- White background -->
  <rect width="${size}" height="${size}" fill="#FFFFFF"/>
  
  <!-- Outer circle (badge) with gradient effect -->
  <circle cx="${centerX}" cy="${centerY}" r="${circleRadius}" 
          fill="#667eea" stroke="#5568d3" stroke-width="10"/>
  
  <!-- Inner highlight circle -->
  <circle cx="${centerX}" cy="${centerY}" r="${circleRadius * 0.95}" 
          fill="#667eea" stroke="none"/>
  
  <!-- Simple geometric star (5-pointed) - pure shapes -->
  <g transform="translate(${centerX}, ${centerY})">
    <!-- Star shape using polygons -->
    <polygon points="0,${-circleRadius * 0.35} ${circleRadius * 0.12},${-circleRadius * 0.10} ${circleRadius * 0.35},${-circleRadius * 0.10} ${circleRadius * 0.18},${circleRadius * 0.05} ${circleRadius * 0.28},${circleRadius * 0.25} 0,${circleRadius * 0.12} ${-circleRadius * 0.28},${circleRadius * 0.25} ${-circleRadius * 0.18},${circleRadius * 0.05} ${-circleRadius * 0.35},${-circleRadius * 0.10} ${-circleRadius * 0.12},${-circleRadius * 0.10}" 
             fill="#FFFFFF" 
             stroke="#FFFFFF" 
             stroke-width="8"
             stroke-linejoin="round"/>
  </g>
</svg>`;
    
    // Convert SVG to PNG using Sharp
    try {
        const outputPath = path.join(__dirname, '../public/images/glory-logo.png');
        const buffer = Buffer.from(svg);
        
        await sharp(buffer)
            .resize(size, size, {
                fit: 'contain',
                background: { r: 255, g: 255, b: 255, alpha: 1 }
            })
            .png({ quality: 100, compressionLevel: 9 })
            .toFile(outputPath);
        
        console.log('✅ NEW icon generated successfully!');
        console.log(`📁 Saved to: ${outputPath}`);
        console.log(`📐 Size: ${size}x${size} pixels`);
        console.log(`🎨 Design: Simple 5-pointed star in purple circular badge`);
        console.log(`🎨 Colors: Purple badge (#667eea) with white star`);
        console.log(`✨ Pure geometric shapes - guaranteed to render correctly!`);
        console.log('\n✨ New icon is ready! Now run:');
        console.log('   npm run android:assets');
    } catch (error) {
        console.error('Error converting SVG to PNG:', error.message);
        console.log('\n💡 Saving SVG instead. You can convert it manually:');
        const svgPath = path.join(__dirname, '../public/images/glory-logo.svg');
        fs.writeFileSync(svgPath, svg);
        console.log(`📁 SVG saved to: ${svgPath}`);
    }
}

// Run
generateLogoPNG().catch(error => {
    console.error('Error generating logo:', error.message);
    process.exit(1);
});

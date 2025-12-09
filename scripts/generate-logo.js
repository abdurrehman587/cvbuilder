const fs = require('fs');
const path = require('path');

// Check if canvas is available, if not, provide instructions
let canvas;
try {
    canvas = require('canvas');
} catch (e) {
    console.error('Canvas library not found. Installing...');
    console.log('Please run: npm install canvas');
    process.exit(1);
}

const { createCanvas } = canvas;

function generateLogo() {
    const size = 1024;
    const padding = size * 0.25; // 25% padding
    const contentSize = size - (padding * 2);
    const centerX = size / 2;
    
    // Create canvas
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);
    
    // Calculate positions - everything centered vertically in content area
    const contentStartY = padding;
    const contentEndY = size - padding;
    const contentCenterY = (contentStartY + contentEndY) / 2;
    
    // Crown dimensions
    const crownWidth = contentSize * 0.4;
    const crownHeight = contentSize * 0.2;
    const crownY = contentStartY + contentSize * 0.15;
    
    // Draw Crown (Golden)
    ctx.save();
    ctx.translate(centerX, crownY);
    ctx.fillStyle = '#FFD700';
    ctx.strokeStyle = '#FFA500';
    ctx.lineWidth = 4;
    
    // Crown base (rounded rectangle)
    const crownBaseWidth = crownWidth;
    const crownBaseHeight = crownHeight * 0.4;
    ctx.beginPath();
    ctx.roundRect(-crownBaseWidth/2, 0, crownBaseWidth, crownBaseHeight, 5);
    ctx.fill();
    ctx.stroke();
    
    // Crown peaks (5 peaks)
    const peakWidth = crownWidth / 5;
    for (let i = -2; i <= 2; i++) {
        const x = i * peakWidth;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + peakWidth/2, -crownHeight * 0.6);
        ctx.lineTo(x - peakWidth/2, -crownHeight * 0.6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    ctx.restore();
    
    // Draw Leaves/Laurels (Golden, below crown)
    const leavesY = crownY + crownHeight * 0.8;
    const leavesSize = contentSize * 0.25;
    
    ctx.save();
    ctx.translate(centerX, leavesY);
    ctx.fillStyle = '#FFD700';
    ctx.strokeStyle = '#FFA500';
    ctx.lineWidth = 3;
    
    // Left laurel branch
    ctx.beginPath();
    ctx.arc(-leavesSize * 0.3, 0, leavesSize * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-leavesSize * 0.5, leavesSize * 0.1);
    ctx.quadraticCurveTo(-leavesSize * 0.35, 0, -leavesSize * 0.3, -leavesSize * 0.05);
    ctx.stroke();
    
    // Right laurel branch
    ctx.beginPath();
    ctx.arc(leavesSize * 0.3, 0, leavesSize * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(leavesSize * 0.5, leavesSize * 0.1);
    ctx.quadraticCurveTo(leavesSize * 0.35, 0, leavesSize * 0.3, -leavesSize * 0.05);
    ctx.stroke();
    ctx.restore();
    
    // Draw Globe (Teal, centered)
    const globeY = leavesY + leavesSize * 0.4;
    const globeRadius = contentSize * 0.15;
    
    ctx.save();
    ctx.translate(centerX, globeY);
    ctx.fillStyle = '#20B2AA';
    ctx.beginPath();
    ctx.arc(0, 0, globeRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Grid lines on globe
    ctx.strokeStyle = '#1E9B95';
    ctx.lineWidth = 2;
    // Horizontal lines
    for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(-globeRadius, i * globeRadius * 0.4);
        ctx.lineTo(globeRadius, i * globeRadius * 0.4);
        ctx.stroke();
    }
    // Vertical lines
    for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(i * globeRadius * 0.4, -globeRadius);
        ctx.lineTo(i * globeRadius * 0.4, globeRadius);
        ctx.stroke();
    }
    ctx.restore();
    
    // Draw Text "GLORY" (Dark Blue, 3D effect)
    const textY = globeY + globeRadius + contentSize * 0.15;
    
    ctx.save();
    ctx.translate(centerX, textY);
    ctx.fillStyle = '#1E3A8A';
    ctx.font = `bold ${contentSize * 0.15}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 3D shadow effect
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;
    
    ctx.fillText('GLORY', 0, 0);
    ctx.restore();
    
    // Save to file
    const outputPath = path.join(__dirname, '../public/images/glory-logo.png');
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    
    console.log('✅ Logo generated successfully!');
    console.log(`📁 Saved to: ${outputPath}`);
    console.log(`📐 Size: ${size}x${size} pixels`);
    console.log(`🎨 Padding: ${(padding/size*100).toFixed(0)}%`);
}

// Run
try {
    generateLogo();
} catch (error) {
    console.error('Error generating logo:', error.message);
    console.log('\n💡 Make sure you have installed canvas:');
    console.log('   npm install canvas');
    process.exit(1);
}


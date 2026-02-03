const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const width = 1200;
const height = 630;

const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Background gradient (light pink to cream)
const bgGradient = ctx.createLinearGradient(0, 0, width, height);
bgGradient.addColorStop(0, '#fff0f5');
bgGradient.addColorStop(1, '#faf8f5');
ctx.fillStyle = bgGradient;
ctx.fillRect(0, 0, width, height);

// Decorative circles
ctx.fillStyle = 'rgba(255, 107, 157, 0.1)';
ctx.beginPath();
ctx.arc(100, 100, 60, 0, Math.PI * 2);
ctx.fill();

ctx.beginPath();
ctx.arc(1100, 530, 80, 0, Math.PI * 2);
ctx.fill();

ctx.fillStyle = 'rgba(196, 69, 105, 0.08)';
ctx.beginPath();
ctx.arc(1050, 120, 40, 0, Math.PI * 2);
ctx.fill();

ctx.beginPath();
ctx.arc(150, 500, 50, 0, Math.PI * 2);
ctx.fill();

// Main card
ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
ctx.shadowBlur = 32;
ctx.shadowOffsetY = 8;
ctx.fillStyle = 'white';
ctx.beginPath();
ctx.roundRect(200, 115, 800, 400, 40);
ctx.fill();

// Reset shadow
ctx.shadowColor = 'transparent';
ctx.shadowBlur = 0;
ctx.shadowOffsetY = 0;

// Baby emoji (using text since we can't easily render emoji)
ctx.font = '120px serif';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('👶', 600, 220);

// Title with gradient effect (simulated with solid pink)
ctx.font = 'bold 64px -apple-system, BlinkMacSystemFont, sans-serif';
const titleGradient = ctx.createLinearGradient(400, 0, 800, 0);
titleGradient.addColorStop(0, '#ff6b9d');
titleGradient.addColorStop(1, '#c44569');
ctx.fillStyle = titleGradient;
ctx.fillText('Baby G', 600, 340);

// Subtitle
ctx.font = '28px -apple-system, BlinkMacSystemFont, sans-serif';
ctx.fillStyle = '#6e6e73';
ctx.fillText("KC & Jonathan's Journey", 600, 400);

// Hearts
ctx.font = '32px serif';
ctx.fillText('💕', 420, 470);
ctx.font = '24px serif';
ctx.fillText('🤍', 600, 470);
ctx.font = '32px serif';
ctx.fillText('💕', 780, 470);

// Save to file
const buffer = canvas.toBuffer('image/png');
const outputPath = path.join(__dirname, '..', 'public', 'baby-g-preview.png');
fs.writeFileSync(outputPath, buffer);
console.log('Preview image created at:', outputPath);

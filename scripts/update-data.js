import fs from 'fs';

let content = fs.readFileSync('src/modelsData.js', 'utf-8');
content = content.replace(/(id:\s*"([^"]+)",)/g, '$1\n    thumbnail: "thumbnails/$2.png",');
fs.writeFileSync('src/modelsData.js', content, 'utf-8');
console.log('Updated src/modelsData.js with thumbnails');

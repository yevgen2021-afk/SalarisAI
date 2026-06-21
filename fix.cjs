const fs = require('fs');
const files = ['src/App.tsx', 'src/components/WallpaperSettings.tsx'];
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/whileTap=\{\{ scale: 0\.95 \}\}/g, '');
  fs.writeFileSync(file, content);
});
console.log('Done');

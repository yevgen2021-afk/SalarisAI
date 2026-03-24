const fs = require('fs');

function replaceInFile(file, replacements) {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  replacements.forEach(([from, to]) => {
    content = content.split(from).join(to);
  });
  fs.writeFileSync(file, content, 'utf8');
}

const files = [
  'src/App.tsx', 
  'src/components/Sidebar.tsx', 
  'src/components/AuthScreen.tsx',
  'src/components/ChatMessage.tsx',
  'src/components/Dashboard.tsx',
  'src/components/ReportModal.tsx',
  'src/components/BlockedScreen.tsx',
  'src/components/WallpaperSettings.tsx'
];

const replacements = [
  // Shadows
  ['shadow-[0_0_15px_rgba(0,0,0,0.3)]', 'shadow-[0_0_15px_rgba(0,0,0,0.1)]'],
  ['shadow-[0_0_15px_rgba(0,0,0,0.4)]', 'shadow-[0_0_15px_rgba(0,0,0,0.15)]'],

  // Common ternaries
  ["theme === 'dark' ? 'text-gray-400' : 'text-gray-500'", "theme === 'dark' ? 'text-white' : 'text-black'"],
  ["theme === 'dark' ? 'text-gray-500' : 'text-gray-400'", "theme === 'dark' ? 'text-white' : 'text-black'"],
  ["theme === 'dark' ? 'text-gray-400' : 'text-gray-600'", "theme === 'dark' ? 'text-white' : 'text-black'"],
  ["theme === 'dark' ? 'text-gray-300' : 'text-gray-700'", "theme === 'dark' ? 'text-white' : 'text-black'"],
  ["theme === 'dark' ? 'text-gray-200' : 'text-gray-800'", "theme === 'dark' ? 'text-white' : 'text-black'"],
  ["theme === 'dark' ? 'text-gray-100' : 'text-gray-800'", "theme === 'dark' ? 'text-white' : 'text-black'"],
  ["theme === 'dark' ? 'text-white' : 'text-gray-900'", "theme === 'dark' ? 'text-white' : 'text-black'"],
  ["theme === 'dark' ? 'text-gray-100' : 'text-gray-900'", "theme === 'dark' ? 'text-white' : 'text-black'"],

  // Hover states
  ["hover:bg-white/10 text-gray-400", "hover:bg-white/10 text-white"],
  ["hover:bg-black/5 text-gray-500", "hover:bg-black/5 text-black"],
  ["text-gray-500 hover:text-gray-400", "text-white hover:text-white/80"],
  ["text-gray-400 hover:text-gray-500", "text-black hover:text-black/80"],
  ["text-gray-400 hover:text-gray-200", "text-white hover:text-white/80"],
  ["text-gray-500 hover:text-gray-700", "text-black hover:text-black/80"],

  // Drop shadows
  ["text-gray-500 drop-shadow", "text-white drop-shadow"],
  ["text-gray-400 drop-shadow", "text-black drop-shadow"],

  // Placeholders
  ["placeholder:text-gray-400", "placeholder:text-black/60"],
  ["placeholder:text-gray-500", "placeholder:text-white/60"],
  ["placeholder:text-gray-600", "placeholder:text-white/60"],
  ["placeholder:text-gray-300", "placeholder:text-black/60"],
  ["placeholder-gray-500", "placeholder-white/60"],
  ["placeholder-gray-400", "placeholder-black/60"],

  // Remaining specific gray classes
  ["text-gray-900", "text-black"],
  ["text-gray-800", "text-black"],
  ["text-gray-700", "text-black"],
  ["text-gray-600", "text-black"],
  ["text-gray-500", "text-black"], // In light mode contexts usually
  ["text-gray-400", "text-white"], // In dark mode contexts usually
  ["text-gray-300", "text-white"],
  ["text-gray-200", "text-white"],
  ["text-gray-100", "text-white"],
];

files.forEach(file => {
  replaceInFile(file, replacements);
});

console.log('Done');

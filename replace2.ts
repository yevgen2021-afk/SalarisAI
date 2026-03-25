import fs from 'fs';

const content = fs.readFileSync('src/App.tsx', 'utf8');

const startMarker = '      {/* Global Chat Menu Backdrop */}\n      <AnimatePresence>\n        {activeChatMenu && (';
const endMarker = '          </motion.div>\n        )}\n      </AnimatePresence>\n\n      <UpdateModal';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error('Markers not found');
  process.exit(1);
}

const newContent = content.substring(0, startIndex) + `      <GlobalChatMenu
        activeChatMenu={activeChatMenu}
        setActiveChatMenu={setActiveChatMenu}
        isChatMenuInteracting={isChatMenuInteracting}
        setIsChatMenuInteracting={setIsChatMenuInteracting}
        startEditingChat={startEditingChat}
        deleteChat={deleteChat}
        theme={theme}
      />\n\n      <UpdateModal` + content.substring(endIndex + endMarker.length - '<UpdateModal'.length);

fs.writeFileSync('src/App.tsx', newContent);
console.log('Replaced successfully');

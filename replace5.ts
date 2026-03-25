import fs from 'fs';

const content = fs.readFileSync('src/App.tsx', 'utf8');

const startMarker = '      {/* Modals at the end for proper stacking context */}\n      <AnimatePresence>\n        {editingChatId && (';
const endMarker = '          </div>\n        )}\n      </AnimatePresence>\n\n      <DeleteConfirmModal';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error('Markers not found');
  process.exit(1);
}

const newContent = content.substring(0, startIndex) + `      {/* Modals at the end for proper stacking context */}
      <RenameChatModal
        editingChatId={editingChatId}
        setEditingChatId={setEditingChatId}
        editingTitle={editingTitle}
        setEditingTitle={setEditingTitle}
        saveChatTitle={saveChatTitle}
        theme={theme}
        getAccentClass={getAccentClass}
      />\n\n      <DeleteConfirmModal` + content.substring(endIndex + endMarker.length - '<DeleteConfirmModal'.length);

fs.writeFileSync('src/App.tsx', newContent);
console.log('Replaced successfully');

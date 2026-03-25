import fs from 'fs';

const content = fs.readFileSync('src/App.tsx', 'utf8');

const startMarker = '              {/* Action Menu Content */}\n              <AnimatePresence mode="wait">\n                {isActionMenuOpen && (';
const endMarker = '                  )\n                )}\n              </AnimatePresence>\n            </div>\n\n            <div className="relative group flex-1">';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error('Markers not found');
  process.exit(1);
}

const newContent = content.substring(0, startIndex) + `              {/* Action Menu Content */}
              <ActionMenu
                isActionMenuOpen={isActionMenuOpen}
                setIsActionMenuOpen={setIsActionMenuOpen}
                actionMenuView={actionMenuView}
                setActionMenuView={setActionMenuView}
                isActionMenuInteracting={isActionMenuInteracting}
                setIsActionMenuInteracting={setIsActionMenuInteracting}
                isThinkingMode={isThinkingMode}
                setIsThinkingMode={setIsThinkingMode}
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
                fileInputRef={fileInputRef}
                theme={theme}
                getAccentClass={getAccentClass}
              />\n            </div>\n\n            <div className="relative group flex-1">` + content.substring(endIndex + endMarker.length);

fs.writeFileSync('src/App.tsx', newContent);
console.log('Replaced successfully');

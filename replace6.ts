import fs from 'fs';

const content = fs.readFileSync('src/App.tsx', 'utf8');

const startMarker = '            <div className="relative group flex-1">';
const endMarker = '                </motion.button>\n                </div>\n              </div>\n            </div>';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error('Markers not found');
  process.exit(1);
}

const newContent = content.substring(0, startIndex) + `<ChatInputBar
              input={input}
              setInput={setInput}
              handleSend={handleSend}
              handleStopGeneration={handleStopGeneration}
              isGenerating={isGenerating}
              isLoading={isLoading}
              isThinkingMode={isThinkingMode}
              setIsThinkingMode={setIsThinkingMode}
              selectedFiles={selectedFiles}
              setSelectedFiles={setSelectedFiles}
              fileInputRef={fileInputRef}
              textareaRef={textareaRef}
              theme={theme}
              backgroundImage={backgroundImage}
              isGlowEnabled={isGlowEnabled}
              getAccentClass={getAccentClass}
            />` + content.substring(endIndex + endMarker.length);

fs.writeFileSync('src/App.tsx', newContent);
console.log('Replaced successfully');

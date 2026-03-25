import fs from 'fs';

const content = fs.readFileSync('src/App.tsx', 'utf8');

const startMarker = '<AnimatePresence>\n        {isSettingsOpen && (\n          <motion.div\n            key="settings-backdrop"';
const endMarker = '          )\n        )}\n      </AnimatePresence>\n\n      <ReportModal';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error('Markers not found');
  process.exit(1);
}

const newContent = content.substring(0, startIndex) + `<SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        setTheme={setTheme}
        user={user}
        profile={profile}
        handleUpdateProfile={handleUpdateProfile}
        handleAvatarUpload={handleAvatarUpload}
        accentColor={accentColor}
        setAccentColor={setAccentColor}
        wallpaper={wallpaper}
        setWallpaper={setWallpaper}
        handleLogout={handleLogout}
        handleDeleteAccount={handleDeleteAccount}
        handleReport={handleReport}
        deleteAllChats={deleteAllChats}
        getAvatarColor={getAvatarColor}
      />\n\n      <ReportModal` + content.substring(endIndex + endMarker.length - '<ReportModal'.length);

fs.writeFileSync('src/App.tsx', newContent);
console.log('Replaced successfully');

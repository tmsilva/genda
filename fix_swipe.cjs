const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\/\/ Swipe Gestures Logic[\s\S]*?const isRightSwipe = distanceX < -minSwipeDistance;[\s\S]*?if \(isRightSwipe && currentIndex > 0\) {[\s\S]*?setActiveTab\(tabs\[currentIndex - 1\]\);[\s\S]*?if \(currentIndex - 1 < 4\) setMobileNavPage\(0\);[\s\S]*?}[\s\S]*?}[\s\S]*?}[\s\S]*?};/m;

const match = code.match(regex);
if (match) {
    const swipeLogic = match[0];
    code = code.replace(swipeLogic, 'return () => {\n      document.removeEventListener(\'mousedown\', handleClickOutside);\n    };\n  }, [isNotificationsOpen]);');
    // I messed up the replacement in the previous script.
    // The previous script replaced `return (` with the swipe logic.
    // Actually the previous replacement was:
    // code = code.replace(/  return \(/, swipeLogic);
    // So the original was `  return () => {` ? No, `return () => {` doesn't match `/  return \(/`. Wait, `/  return \(/` doesn't match `return () => {`. 
}

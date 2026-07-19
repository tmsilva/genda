const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /  \/\/ Swipe Gestures Logic[\s\S]*?const isRightSwipe = distanceX < -minSwipeDistance;[\s\S]*?if \(isRightSwipe && currentIndex > 0\) {[\s\S]*?setActiveTab\(tabs\[currentIndex - 1\]\);[\s\S]*?if \(currentIndex - 1 < 4\) setMobileNavPage\(0\);[\s\S]*?}[\s\S]*?}[\s\S]*?}[\s\S]*?};\n\n/m;

const match = code.match(regex);
if (match) {
    const swipeLogic = match[0];
    code = code.replace(swipeLogic, '');
    
    // Insert it before `// Auto-dismiss simulated push notification after 8 seconds`
    const targetMatch = code.match(/  \/\/ Auto-dismiss simulated push notification after 8 seconds/);
    if (targetMatch) {
        code = code.replace(targetMatch[0], swipeLogic + targetMatch[0]);
        fs.writeFileSync('src/App.tsx', code);
        console.log("Success");
    } else {
        console.log("Could not find target match");
    }
} else {
    console.log("Not found swipe logic");
}

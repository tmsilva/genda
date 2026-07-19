const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /    \/\/ Swipe Gestures Logic[\s\S]*?const isRightSwipe = distanceX < -minSwipeDistance;[\s\S]*?if \(isRightSwipe && currentIndex > 0\) {[\s\S]*?setActiveTab\(tabs\[currentIndex - 1\]\);[\s\S]*?if \(currentIndex - 1 < 4\) setMobileNavPage\(0\);[\s\S]*?}[\s\S]*?}[\s\S]*?}[\s\S]*?};\n\n  return \(/m;

const match = code.match(regex);
if (match) {
    console.log("Found swipe logic to remove");
    code = code.replace(match[0], '  return (');
} else {
    // Try without indentation on the first line
    const regex2 = /  \/\/ Swipe Gestures Logic[\s\S]*?};\n\n  return \(/m;
    const match2 = code.match(regex2);
    if (match2) {
        console.log("Found swipe logic 2");
        code = code.replace(match2[0], '  return (');
    } else {
        console.log("Not found");
    }
}
fs.writeFileSync('src/App.tsx', code);

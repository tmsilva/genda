const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /  \/\/ Swipe Gestures Logic[\s\S]*?const isRightSwipe = distanceX < -minSwipeDistance;[\s\S]*?if \(isRightSwipe && currentIndex > 0\) {[\s\S]*?setActiveTab\(tabs\[currentIndex - 1\]\);[\s\S]*?if \(currentIndex - 1 < 4\) setMobileNavPage\(0\);[\s\S]*?}[\s\S]*?}[\s\S]*?}[\s\S]*?};\n\n/m;

const match = code.match(regex);
if (match) {
    console.log("Found swipe logic to remove");
    const swipeLogic = match[0];
    code = code.replace(swipeLogic, '');
    
    // Now insert it right before the final `return (` of the `App` component
    // The final return should look like:
    //   return (
    //     <div className={`h-[100dvh] w-full overflow-hidden
    const finalReturnMatch = code.match(/  return \(\n    <div className=\{`h-\[100dvh\]/);
    if (finalReturnMatch) {
        code = code.replace(finalReturnMatch[0], swipeLogic + finalReturnMatch[0]);
        fs.writeFileSync('src/App.tsx', code);
        console.log("Success");
    } else {
        console.log("Could not find final return");
    }
} else {
    console.log("Not found swipe logic");
}

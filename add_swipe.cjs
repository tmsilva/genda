const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const swipeLogic = `  // Swipe Gestures Logic
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe || isRightSwipe) {
      const tabs: Array<'dashboard' | 'agenda' | 'clients' | 'finance' | 'services' | 'estoque' | 'ai' | 'settings'> = [
        'dashboard', 'agenda', 'clients', 'finance', 'services', 'estoque', 'ai', 'settings'
      ];
      const currentIndex = tabs.indexOf(activeTab);
      
      if (isLeftSwipe && currentIndex < tabs.length - 1) {
        setActiveTab(tabs[currentIndex + 1]);
        if (currentIndex + 1 >= 4) setMobileNavPage(1);
      }
      if (isRightSwipe && currentIndex > 0) {
        setActiveTab(tabs[currentIndex - 1]);
        if (currentIndex - 1 < 4) setMobileNavPage(0);
      }
    }
  };

  return (`;

code = code.replace(/  return \(/, swipeLogic);
fs.writeFileSync('src/App.tsx', code);

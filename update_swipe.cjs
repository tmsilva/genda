const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldSwipe = `  // Swipe Gestures Logic
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
  };`;

const newSwipe = `  // Swipe Gestures Logic
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchEndY, setTouchEndY] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEndX(null);
    setTouchEndY(null);
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchStartY(e.targetTouches[0].clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
    setTouchEndY(e.targetTouches[0].clientY);
  };

  const onTouchEnd = () => {
    if (!touchStartX || !touchEndX || !touchStartY || !touchEndY) return;
    
    const distanceX = touchStartX - touchEndX;
    const distanceY = touchStartY - touchEndY;
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;
    
    // Ensure horizontal swipe is more pronounced than vertical swipe
    if (Math.abs(distanceX) > Math.abs(distanceY)) {
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
    }
  };`;

code = code.replace(oldSwipe, newSwipe);
fs.writeFileSync('src/App.tsx', code);

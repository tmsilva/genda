const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldEffect = `
  useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      if (profile.themeColor === 'roxo') {
        metaThemeColor.setAttribute('content', isDark ? '#1e1b4b' : '#312e81');
      } else if (profile.themeColor === 'azul') {
        metaThemeColor.setAttribute('content', isDark ? '#0f172a' : '#1e3a8a');
      } else if (profile.themeColor === 'verde') {
        metaThemeColor.setAttribute('content', isDark ? '#064e3b' : '#065f46');
      } else {
        metaThemeColor.setAttribute('content', isDark ? '#09090b' : '#18181b');
      }
    }
    
    // Add PWA classes to body
    document.body.classList.add('overscroll-none');
    document.body.style.overscrollBehaviorY = 'none';
  }, [profile.themeColor, isDark]);
`;

code = code.replace(oldEffect, '');

const isDarkDecl = `const isDark = profile.isDarkMode ?? true;`;
code = code.replace(isDarkDecl, isDarkDecl + '\n' + oldEffect);

fs.writeFileSync('src/App.tsx', code);

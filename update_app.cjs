const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('import InstallPWA')) {
  code = code.replace("import Logo from './components/Logo';", "import Logo from './components/Logo';\nimport InstallPWA from './components/InstallPWA';");
}

const endDiv = '</div>\n    </div>\n  );\n}';
if (code.includes(endDiv)) {
  code = code.replace(endDiv, '  <InstallPWA isDark={isDark} />\n      </div>\n    </div>\n  );\n}');
} else {
  // Let's just find the last </div>
  const lastIndex = code.lastIndexOf('</div>');
  if (lastIndex !== -1) {
    code = code.substring(0, lastIndex) + '  <InstallPWA isDark={isDark} />\n    ' + code.substring(lastIndex);
  }
}

fs.writeFileSync('src/App.tsx', code);

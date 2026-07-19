const fs = require('fs');
let code = fs.readFileSync('src/components/Logo.tsx', 'utf8');

const oldTextStyles2 = `            style={{
              fontFamily: '"Outfit", sans-serif',
              fontWeight: 200,
              fontSize: size === 'sm' ? '1.4rem' : size === 'lg' ? '2.4rem' : size === 'xl' ? '3.4rem' : '1.9rem',
              color: lightMode ? '#0f172a' : '#ffffff',
              letterSpacing: '-0.04em',
            }}`;

const newTextStyles2 = `            style={{
              fontFamily: '"Outfit", sans-serif',
              fontWeight: 200,
              color: lightMode ? '#0f172a' : '#ffffff',
              letterSpacing: '-0.04em',
            }}
            className={\`font-display tracking-tight leading-none font-extralight \${
              size === 'sm' ? 'text-[1.4rem]' : 
              size === 'lg' ? 'text-[2rem] sm:text-[2.4rem]' : 
              size === 'xl' ? 'text-[2.6rem] sm:text-[3.4rem]' : 
              'text-[1.9rem]'
            }\`}`;

code = code.replace(oldTextStyles2, newTextStyles2);
code = code.replace(`className="font-display tracking-tight leading-none font-extralight"`, ``);

fs.writeFileSync('src/components/Logo.tsx', code);

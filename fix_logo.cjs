const fs = require('fs');
let code = fs.readFileSync('src/components/Logo.tsx', 'utf8');

const oldSlogan = `        <div 
          className="font-sans font-bold tracking-[0.2em] uppercase leading-none mt-2.5 whitespace-nowrap"
          style={{
            fontSize: size === 'sm' ? '5.5px' : size === 'lg' ? '8px' : size === 'xl' ? '11px' : '7.2px',
            color: lightMode ? '#64748b' : '#94a3b8',
          }}
        >
          SUA AGENDA. SEU TEMPO. SEU NEGÓCIO.
        </div>`;

const newSlogan = `        <div 
          className="font-sans font-bold tracking-[0.2em] uppercase leading-tight mt-2.5 w-full text-center"
          style={{
            fontSize: size === 'sm' ? '5.5px' : size === 'lg' ? '8px' : size === 'xl' ? '10px' : '7.2px',
            color: lightMode ? '#64748b' : '#94a3b8',
          }}
        >
          SUA AGENDA. SEU TEMPO. SEU NEGÓCIO.
        </div>`;
code = code.replace(oldSlogan, newSlogan);

const oldSvgClass = `      className={\`\${isFull ? {
        sm: 'h-6 w-6',
        md: 'h-10 w-10',
        lg: 'h-14 w-14',
        xl: 'h-20 w-20',
      }[size] : (variant === 'icon' ? 'w-full h-full' : 'w-auto h-full shrink-0')} overflow-visible\`}`;

const newSvgClass = `      className={\`\${isFull ? {
        sm: 'h-6 w-6',
        md: 'h-10 w-10',
        lg: 'h-12 w-12 sm:h-14 sm:w-14',
        xl: 'h-16 w-16 sm:h-20 sm:w-20',
      }[size] : (variant === 'icon' ? 'w-full h-full' : 'w-auto h-full shrink-0')} overflow-visible\`}`;
code = code.replace(oldSvgClass, newSvgClass);

const oldTextStyles = `            style={{
              fontFamily: '"Outfit", sans-serif',
              fontWeight: 200,
              fontSize: size === 'sm' ? '1.4rem' : size === 'lg' ? '2.4rem' : size === 'xl' ? '3.4rem' : '1.9rem',
              color: lightMode ? '#0f172a' : '#ffffff',
              letterSpacing: '-0.04em',
            }}`;

const newTextStyles = `            style={{
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
code = code.replace(oldTextStyles, newTextStyles);
code = code.replace(`className="font-display tracking-tight leading-none font-extralight"`, ``);

fs.writeFileSync('src/components/Logo.tsx', code);

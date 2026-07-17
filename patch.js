const fs = require('fs');
let code = fs.readFileSync('./src/components/SettingsView.tsx', 'utf-8');

code = code.replace(
  `      {/* Sidebar navigation menu */}
      <div className={\`lg:col-span-1 \${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-white border-slate-100 text-slate-700'} rounded-2xl p-4 border shadow-sm flex flex-col justify-between lg:min-h-[400px] gap-6 text-xs font-semibold\`}>
        
        <div className="flex flex-col gap-1.5">`,
  `      {/* Sidebar navigation menu */}
      <div className={\`lg:col-span-1 \${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-white border-slate-100 text-slate-700'} rounded-2xl p-2 lg:p-4 border shadow-sm flex flex-col justify-between lg:min-h-[400px] gap-6 text-xs font-semibold overflow-hidden\`}>
        
        <div className="flex lg:flex-col gap-1.5 overflow-x-auto scrollbar-none pb-1 lg:pb-0">`
);

code = code.replace(
  `            className={\`w-full p-2.5 rounded-xl text-left flex items-center gap-2 transition-all cursor-pointer \${`,
  `            className={\`w-full p-2 lg:p-2.5 rounded-xl text-left flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap \${`
);

// I need to replace all instances of that className for the 5 buttons
code = code.replace(/className=\{\`w-full p-2\.5 rounded-xl text-left flex items-center gap-2 transition-all cursor-pointer \$\{/g, 
  \`className={\\\`w-full p-2 lg:p-2.5 rounded-xl text-left flex items-center justify-center lg:justify-start gap-2 transition-all cursor-pointer whitespace-nowrap \${\`);

fs.writeFileSync('./src/components/SettingsView.tsx', code);

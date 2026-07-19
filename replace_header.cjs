const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const titleLogic = `
  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Painel';
      case 'agenda': return 'Agenda';
      case 'clients': return 'Clientes';
      case 'services': return 'Serviços';
      case 'finance': return 'Financeiro';
      case 'estoque': return 'Controle de Estoque';
      case 'ai': return 'Genda AI';
      case 'settings': return 'Ajustes';
      default: return profile.name;
    }
  };
`;

code = code.replace('const handleUpdateProfile = async (prof: ProfessionalProfile) => {', titleLogic + '\n  const handleUpdateProfile = async (prof: ProfessionalProfile) => {');

const headerReplace = `{/* Brand Logo & Professional Name info */}
                <div className="flex items-center gap-2.5">
                  {profile.avatarUrl ? (
                    <img 
                      src={profile.avatarUrl} 
                      alt={profile.name}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-xl object-cover shadow-md border border-slate-200/50"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <Logo variant="icon" className="w-9 h-9 shadow-md rounded-xl" />
                  )}
                  <div className="text-left">
                    {/* Desktop Title */}
                    <span className={\`hidden md:block font-display font-extrabold \${isDark ? 'text-white' : 'text-slate-950'} text-sm sm:text-base leading-tight max-w-[100px] sm:max-w-[200px] md:max-w-none truncate\`}>
                      {profile.name}
                    </span>
                    <span className={\`hidden md:block text-[9px] sm:text-[10px] font-mono \${isDark ? 'text-zinc-500' : 'text-slate-400'} -mt-0.5 truncate max-w-[100px] sm:max-w-[200px] md:max-w-none\`}>
                      {profile.category} • Agenda Genda
                    </span>
                    {/* Mobile Title */}
                    <span className={\`md:hidden font-display font-extrabold \${isDark ? 'text-white' : 'text-slate-950'} text-base leading-tight block truncate\`}>
                      {getPageTitle()}
                    </span>
                    <span className={\`md:hidden text-[10px] font-mono \${isDark ? 'text-zinc-500' : 'text-slate-400'} block -mt-0.5 truncate\`}>
                      {profile.name}
                    </span>
                  </div>
                </div>`;

const searchHeader = `{/* Brand Logo & Professional Name info */}
                <div className="flex items-center gap-2.5">
                  {profile.avatarUrl ? (
                    <img 
                      src={profile.avatarUrl} 
                      alt={profile.name}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-xl object-cover shadow-md border border-slate-200/50"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <Logo variant="icon" className="w-9 h-9 shadow-md rounded-xl" />
                  )}
                  <div className="text-left">
                    <span className={\`font-display font-extrabold \${isDark ? 'text-white' : 'text-slate-950'} text-sm sm:text-base leading-tight block max-w-[100px] sm:max-w-[200px] md:max-w-none truncate\`}>
                      {profile.name}
                    </span>
                    <span className={\`text-[9px] sm:text-[10px] font-mono \${isDark ? 'text-zinc-500' : 'text-slate-400'} block -mt-0.5 truncate max-w-[100px] sm:max-w-[200px] md:max-w-none\`}>
                      {profile.category} • Agenda Genda
                    </span>
                  </div>
                </div>`;

code = code.replace(searchHeader, headerReplace);
fs.writeFileSync('src/App.tsx', code);

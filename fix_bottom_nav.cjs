const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const startMatch = '{/* MOBILE "MAIS" MENU OVERLAY */}';
const startIndex = code.indexOf(startMatch);
const endMatch = '</div>          </div>\n        </motion.div>';
const endIndex = code.indexOf(endMatch, startIndex) + endMatch.length;

if (startIndex !== -1 && endIndex !== -1) {
    const replacement = `            {/* PERSISTENT BOTTOM NAVIGATION TAB BAR */}
            <div className="fixed bottom-0 left-0 right-0 z-40 themed-mobile-bar backdrop-blur-md border-t shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] px-2 sm:px-6 py-2 flex items-center justify-between gap-1 sm:gap-4 md:hidden pb-safe">
              <AnimatePresence mode="wait">
                {mobileNavPage === 0 ? (
                  <motion.div 
                    key="page0"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 flex items-center justify-between gap-1 sm:gap-4 w-full"
                  >
                    {/* Tab 0: Dashboard */}
                    <button
                      onClick={() => { setActiveClientId(null); setActiveTab('dashboard'); }}
                      className={\`flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shrink-0 min-w-[56px] sm:min-w-[64px] \${
                        activeTab === 'dashboard' 
                          ? (isDark ? 'text-indigo-400 scale-105 font-bold' : 'text-indigo-600 scale-105 font-bold') 
                          : 'themed-mobile-inactive'
                      }\`}
                    >
                      <div className={\`p-1 sm:p-1.5 rounded-xl transition-all \${
                        activeTab === 'dashboard' 
                          ? (isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600') 
                          : 'bg-transparent'
                      }\`}>
                        <Package className="w-5 h-5 sm:w-5 sm:h-5" />
                      </div>
                      <span className="text-[9px] sm:text-[10px] truncate max-w-full">Painel</span>
                    </button>

                    {/* Tab 1: Agenda */}
                    <button
                      onClick={() => { setActiveClientId(null); setActiveTab('agenda'); }}
                      className={\`flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shrink-0 min-w-[56px] sm:min-w-[64px] \${
                        activeTab === 'agenda' 
                          ? (isDark ? 'text-indigo-400 scale-105 font-bold' : 'text-indigo-600 scale-105 font-bold') 
                          : 'themed-mobile-inactive'
                      }\`}
                    >
                      <div className={\`p-1 sm:p-1.5 rounded-xl transition-all \${
                        activeTab === 'agenda' 
                          ? (isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600') 
                          : 'bg-transparent'
                      }\`}>
                        <Calendar className="w-5 h-5 sm:w-5 sm:h-5" />
                      </div>
                      <span className="text-[9px] sm:text-[10px] truncate max-w-full">Agenda</span>
                    </button>

                    {/* Tab 2: Clients */}
                    <button
                      onClick={() => { setActiveClientId(null); setActiveTab('clients'); }}
                      className={\`flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shrink-0 min-w-[56px] sm:min-w-[64px] \${
                        activeTab === 'clients' 
                          ? (isDark ? 'text-indigo-400 scale-105 font-bold' : 'text-indigo-600 scale-105 font-bold') 
                          : 'themed-mobile-inactive'
                      }\`}
                    >
                      <div className={\`p-1 sm:p-1.5 rounded-xl transition-all \${
                        activeTab === 'clients' 
                          ? (isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600') 
                          : 'bg-transparent'
                      }\`}>
                        <Users className="w-5 h-5 sm:w-5 sm:h-5" />
                      </div>
                      <span className="text-[9px] sm:text-[10px] truncate max-w-full">Clientes</span>
                    </button>

                    {/* Tab 3: Finance */}
                    <button
                      onClick={() => { setActiveClientId(null); setActiveTab('finance'); }}
                      className={\`flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shrink-0 min-w-[56px] sm:min-w-[64px] \${
                        activeTab === 'finance' 
                          ? (isDark ? 'text-indigo-400 scale-105 font-bold' : 'text-indigo-600 scale-105 font-bold') 
                          : 'themed-mobile-inactive'
                      }\`}
                    >
                      <div className={\`p-1 sm:p-1.5 rounded-xl transition-all \${
                        activeTab === 'finance' 
                          ? (isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600') 
                          : 'bg-transparent'
                      }\`}>
                        <DollarSign className="w-5 h-5 sm:w-5 sm:h-5" />
                      </div>
                      <span className="text-[9px] sm:text-[10px] truncate max-w-full">Finance</span>
                    </button>

                    {/* Next Page Arrow */}
                    <button
                      onClick={() => setMobileNavPage(1)}
                      className="flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shrink-0 min-w-[40px] sm:min-w-[48px] text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                      <div className="p-1 sm:p-1.5 rounded-xl transition-all bg-indigo-500/10 text-indigo-500 flex items-center justify-center h-[28px] w-[28px] sm:h-[32px] sm:w-[32px]">
                        <ChevronRight className="w-5 h-5 sm:w-5 sm:h-5" />
                      </div>
                      <span className="text-[9px] sm:text-[10px] truncate max-w-full font-bold">Mais</span>
                    </button>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="page1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 flex items-center justify-between gap-1 sm:gap-4 w-full"
                  >
                    {/* Prev Page Arrow */}
                    <button
                      onClick={() => setMobileNavPage(0)}
                      className="flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shrink-0 min-w-[40px] sm:min-w-[48px] text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                      <div className="p-1 sm:p-1.5 rounded-xl transition-all bg-indigo-500/10 text-indigo-500 flex items-center justify-center h-[28px] w-[28px] sm:h-[32px] sm:w-[32px]">
                        <ChevronLeft className="w-5 h-5 sm:w-5 sm:h-5" />
                      </div>
                      <span className="text-[9px] sm:text-[10px] truncate max-w-full font-bold">Voltar</span>
                    </button>

                    {/* Tab 4: Serviços */}
                    <button
                      onClick={() => { setActiveClientId(null); setActiveTab('services'); }}
                      className={\`flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shrink-0 min-w-[56px] sm:min-w-[64px] \${
                        activeTab === 'services' 
                          ? (isDark ? 'text-indigo-400 scale-105 font-bold' : 'text-indigo-600 scale-105 font-bold') 
                          : 'themed-mobile-inactive'
                      }\`}
                    >
                      <div className={\`p-1 sm:p-1.5 rounded-xl transition-all \${
                        activeTab === 'services' 
                          ? (isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600') 
                          : 'bg-transparent'
                      }\`}>
                        <Clipboard className="w-5 h-5 sm:w-5 sm:h-5" />
                      </div>
                      <span className="text-[9px] sm:text-[10px] truncate max-w-full">Serviços</span>
                    </button>

                    {/* Tab 5: Estoque */}
                    <button
                      onClick={() => { setActiveClientId(null); setActiveTab('estoque'); }}
                      className={\`flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shrink-0 min-w-[56px] sm:min-w-[64px] \${
                        activeTab === 'estoque' 
                          ? (isDark ? 'text-indigo-400 scale-105 font-bold' : 'text-indigo-600 scale-105 font-bold') 
                          : 'themed-mobile-inactive'
                      }\`}
                    >
                      <div className={\`p-1 sm:p-1.5 rounded-xl transition-all \${
                        activeTab === 'estoque' 
                          ? (isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600') 
                          : 'bg-transparent'
                      }\`}>
                        <Package className="w-5 h-5 sm:w-5 sm:h-5" />
                      </div>
                      <span className="text-[9px] sm:text-[10px] truncate max-w-full">Estoque</span>
                    </button>
                    
                    {/* Tab 6: Genda AI */}
                    <button
                      onClick={() => { setActiveClientId(null); setActiveTab('ai'); }}
                      className={\`flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shrink-0 min-w-[56px] sm:min-w-[64px] \${
                        activeTab === 'ai' 
                          ? (isDark ? 'text-indigo-400 scale-105 font-bold' : 'text-indigo-600 scale-105 font-bold') 
                          : 'themed-mobile-inactive'
                      }\`}
                    >
                      <div className={\`p-1 sm:p-1.5 rounded-xl transition-all \${
                        activeTab === 'ai' 
                          ? (isDark ? 'bg-indigo-500 text-white' : 'bg-indigo-50 text-indigo-600') 
                          : 'bg-transparent'
                      }\`}>
                        <Bot className="w-5 h-5 sm:w-5 sm:h-5" />
                      </div>
                      <span className="text-[9px] sm:text-[10px] truncate max-w-full">Genda AI</span>
                    </button>

                    {/* Tab 7: Ajustes */}
                    <button
                      onClick={() => { setActiveClientId(null); setActiveTab('settings'); }}
                      className={\`flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shrink-0 min-w-[56px] sm:min-w-[64px] \${
                        activeTab === 'settings' 
                          ? (isDark ? 'text-indigo-400 scale-105 font-bold' : 'text-indigo-600 scale-105 font-bold') 
                          : 'themed-mobile-inactive'
                      }\`}
                    >
                      <div className={\`p-1 sm:p-1.5 rounded-xl transition-all \${
                        activeTab === 'settings' 
                          ? (isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600') 
                          : 'bg-transparent'
                      }\`}>
                        <Settings className="w-5 h-5 sm:w-5 sm:h-5" />
                      </div>
                      <span className="text-[9px] sm:text-[10px] truncate max-w-full">Ajustes</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>          </div>
        </motion.div>`;
    code = code.substring(0, startIndex) + replacement + code.substring(endIndex);
    fs.writeFileSync('src/App.tsx', code);
    console.log('Replaced');
} else {
    console.log('Not found');
}

const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
const startMatch = '{/* PERSISTENT BOTTOM NAVIGATION TAB BAR */}';
const startIndex = code.indexOf(startMatch);
const endMatch = '</div>          </div>\n        </motion.div>';
const endIndex = code.indexOf(endMatch, startIndex) + endMatch.length;

const newBottomNav = `{/* PERSISTENT BOTTOM NAVIGATION TAB BAR */}
            <div className="fixed bottom-0 left-0 right-0 z-40 themed-mobile-bar backdrop-blur-md border-t shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] px-2 sm:px-6 py-2 flex items-center justify-between gap-1 sm:gap-4 md:hidden pb-safe">
                <button
                  onClick={() => { setActiveClientId(null); setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
                  className={\`flex flex-col items-center justify-center gap-1 cursor-pointer transition-all shrink-0 min-w-[56px] sm:min-w-[64px] \${
                    activeTab === 'dashboard' && !isMobileMenuOpen
                      ? (isDark ? 'text-indigo-400 scale-105 font-bold' : 'text-indigo-600 scale-105 font-bold')
                      : 'themed-mobile-inactive'
                  }\`}
                >
                  <div className={\`p-1 sm:p-1.5 rounded-xl transition-all \${
                    activeTab === 'dashboard' && !isMobileMenuOpen
                      ? (isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600')
                      : 'bg-transparent'
                  }\`}>
                    <Package className="w-5 h-5 sm:w-5 sm:h-5" />
                  </div>
                  <span className="text-[9px] sm:text-[10px] truncate max-w-full">Painel</span>
                </button>

                <button
                  onClick={() => { setActiveClientId(null); setActiveTab('agenda'); setIsMobileMenuOpen(false); }}
                  className={\`flex flex-col items-center justify-center gap-1 cursor-pointer transition-all shrink-0 min-w-[56px] sm:min-w-[64px] \${
                    activeTab === 'agenda' && !isMobileMenuOpen
                      ? (isDark ? 'text-indigo-400 scale-105 font-bold' : 'text-indigo-600 scale-105 font-bold')
                      : 'themed-mobile-inactive'
                  }\`}
                >
                  <div className={\`p-1 sm:p-1.5 rounded-xl transition-all \${
                    activeTab === 'agenda' && !isMobileMenuOpen
                      ? (isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600')
                      : 'bg-transparent'
                  }\`}>
                    <Calendar className="w-5 h-5 sm:w-5 sm:h-5" />
                  </div>
                  <span className="text-[9px] sm:text-[10px] truncate max-w-full">Agenda</span>
                </button>

                <button
                  onClick={() => { setActiveClientId(null); setActiveTab('clients'); setIsMobileMenuOpen(false); }}
                  className={\`flex flex-col items-center justify-center gap-1 cursor-pointer transition-all shrink-0 min-w-[56px] sm:min-w-[64px] \${
                    activeTab === 'clients' && !isMobileMenuOpen
                      ? (isDark ? 'text-indigo-400 scale-105 font-bold' : 'text-indigo-600 scale-105 font-bold')
                      : 'themed-mobile-inactive'
                  }\`}
                >
                  <div className={\`p-1 sm:p-1.5 rounded-xl transition-all \${
                    activeTab === 'clients' && !isMobileMenuOpen
                      ? (isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600')
                      : 'bg-transparent'
                  }\`}>
                    <Users className="w-5 h-5 sm:w-5 sm:h-5" />
                  </div>
                  <span className="text-[9px] sm:text-[10px] truncate max-w-full">Clientes</span>
                </button>

                <button
                  onClick={() => { setActiveClientId(null); setActiveTab('finance'); setIsMobileMenuOpen(false); }}
                  className={\`flex flex-col items-center justify-center gap-1 cursor-pointer transition-all shrink-0 min-w-[56px] sm:min-w-[64px] \${
                    activeTab === 'finance' && !isMobileMenuOpen
                      ? (isDark ? 'text-indigo-400 scale-105 font-bold' : 'text-indigo-600 scale-105 font-bold')
                      : 'themed-mobile-inactive'
                  }\`}
                >
                  <div className={\`p-1 sm:p-1.5 rounded-xl transition-all \${
                    activeTab === 'finance' && !isMobileMenuOpen
                      ? (isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600')
                      : 'bg-transparent'
                  }\`}>
                    <DollarSign className="w-5 h-5 sm:w-5 sm:h-5" />
                  </div>
                  <span className="text-[9px] sm:text-[10px] truncate max-w-full">Finance</span>
                </button>

                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className={\`flex flex-col items-center justify-center gap-1 cursor-pointer transition-all shrink-0 min-w-[56px] sm:min-w-[64px] \${
                    isMobileMenuOpen
                      ? (isDark ? 'text-indigo-400 scale-105 font-bold' : 'text-indigo-600 scale-105 font-bold')
                      : 'themed-mobile-inactive'
                  }\`}
                >
                  <div className={\`p-1 sm:p-1.5 rounded-xl transition-all \${
                    isMobileMenuOpen
                      ? (isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600')
                      : 'bg-transparent'
                  }\`}>
                    <Menu className="w-5 h-5 sm:w-5 sm:h-5" />
                  </div>
                  <span className="text-[9px] sm:text-[10px] truncate max-w-full">Mais</span>
                </button>
            </div>          </div>
        </motion.div>`;

code = code.substring(0, startIndex) + newBottomNav + code.substring(endIndex);
fs.writeFileSync('src/App.tsx', code);

const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const menuJSX = `
            {/* MOBILE "MAIS" MENU OVERLAY */}
            <AnimatePresence>
              {isMobileMenuOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-sm md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                  <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className={\`fixed bottom-[64px] left-0 right-0 z-30 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:hidden overflow-hidden flex flex-col \${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-100'} border-t\`}
                    style={{ maxHeight: 'calc(100vh - 100px)' }}
                  >
                    <div className="p-2 flex justify-center border-b border-transparent">
                      <div className={\`w-12 h-1.5 rounded-full \${isDark ? 'bg-zinc-700' : 'bg-slate-200'}\`} />
                    </div>
                    <div className="p-4 overflow-y-auto pb-safe flex-1 space-y-4">
                      <h3 className={\`font-display font-bold px-2 \${isDark ? 'text-zinc-100' : 'text-slate-900'}\`}>Menu</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => { setActiveTab('services'); setIsMobileMenuOpen(false); }}
                          className={\`flex items-center gap-3 p-4 rounded-2xl border transition-all \${isDark ? 'bg-zinc-950/50 border-zinc-800 text-zinc-300' : 'bg-slate-50 border-slate-100 text-slate-700'}\`}
                        >
                          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                            <Clipboard className="w-5 h-5" />
                          </div>
                          <span className="font-semibold text-sm">Serviços</span>
                        </button>
                        <button
                          onClick={() => { setActiveTab('estoque'); setIsMobileMenuOpen(false); }}
                          className={\`flex items-center gap-3 p-4 rounded-2xl border transition-all \${isDark ? 'bg-zinc-950/50 border-zinc-800 text-zinc-300' : 'bg-slate-50 border-slate-100 text-slate-700'}\`}
                        >
                          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                            <Package className="w-5 h-5" />
                          </div>
                          <span className="font-semibold text-sm">Estoque</span>
                        </button>
                        <button
                          onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
                          className={\`flex items-center gap-3 p-4 rounded-2xl border transition-all col-span-2 \${isDark ? 'bg-zinc-950/50 border-zinc-800 text-zinc-300' : 'bg-slate-50 border-slate-100 text-slate-700'}\`}
                        >
                          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                            <Settings className="w-5 h-5" />
                          </div>
                          <div className="text-left flex-1">
                            <span className="font-semibold text-sm block">Configurações e Perfil</span>
                            <span className={\`text-[10px] block \${isDark ? 'text-zinc-500' : 'text-slate-400'}\`}>Ajustes, Backup, Tema</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </button>
                        <button
                          onClick={() => { setActiveTab('ai'); setIsMobileMenuOpen(false); }}
                          className={\`flex items-center gap-3 p-4 rounded-2xl border transition-all col-span-2 \${isDark ? 'bg-indigo-950/40 border-indigo-900/50 text-indigo-300' : 'bg-indigo-50 border-indigo-100 text-indigo-700'}\`}
                        >
                          <div className="p-2 rounded-xl bg-indigo-500 text-white">
                            <Bot className="w-5 h-5" />
                          </div>
                          <div className="text-left flex-1">
                            <span className="font-semibold text-sm block">Genda AI</span>
                            <span className={\`text-[10px] block \${isDark ? 'text-indigo-400/70' : 'text-indigo-500/70'}\`}>Assistente Virtual</span>
                          </div>
                          <Sparkles className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* PERSISTENT BOTTOM NAVIGATION TAB BAR */}
`;

const insertMatch = '{/* PERSISTENT BOTTOM NAVIGATION TAB BAR */}';
code = code.replace(insertMatch, menuJSX);

fs.writeFileSync('src/App.tsx', code);

#!/bin/bash
awk '
BEGIN { in_nav = 0; }
/^{\/\* PERSISTENT BOTTOM NAVIGATION TAB BAR \*\/}$/ {
  in_nav = 1;
  print "            {/* PERSISTENT BOTTOM NAVIGATION TAB BAR */}"
  print "            <div className=\"fixed bottom-0 left-0 right-0 z-40 themed-mobile-bar backdrop-blur-md border-t shadow-lg px-2 sm:px-6 py-2 flex items-center justify-between gap-1 sm:gap-4 md:hidden pb-safe\">"
  print "                <button"
  print "                  onClick={() => { setActiveClientId(null); setActiveTab(\"dashboard\"); setIsMobileMenuOpen(false); }}"
  print "                  className={`flex flex-col items-center justify-center gap-1 cursor-pointer transition-all shrink-0 min-w-[56px] sm:min-w-[64px] ${"
  print "                    activeTab === \"dashboard\" && !isMobileMenuOpen"
  print "                      ? (isDark ? \"text-indigo-400 scale-105 font-bold\" : \"text-indigo-600 scale-105 font-bold\")"
  print "                      : \"themed-mobile-inactive\""
  print "                  }`}"
  print "                >"
  print "                  <div className={`p-1 sm:p-1.5 rounded-xl transition-all ${"
  print "                    activeTab === \"dashboard\" && !isMobileMenuOpen"
  print "                      ? (isDark ? \"bg-indigo-500/10 text-indigo-400\" : \"bg-indigo-50 text-indigo-600\")"
  print "                      : \"bg-transparent\""
  print "                  }`}>\n                    <Package className=\"w-5 h-5 sm:w-5 sm:h-5\" />\n                  </div>\n                  <span className=\"text-[9px] sm:text-[10px] truncate max-w-full\">Painel</span>\n                </button>"
  print "                <button"
  print "                  onClick={() => { setActiveClientId(null); setActiveTab(\"agenda\"); setIsMobileMenuOpen(false); }}"
  print "                  className={`flex flex-col items-center justify-center gap-1 cursor-pointer transition-all shrink-0 min-w-[56px] sm:min-w-[64px] ${"
  print "                    activeTab === \"agenda\" && !isMobileMenuOpen"
  print "                      ? (isDark ? \"text-indigo-400 scale-105 font-bold\" : \"text-indigo-600 scale-105 font-bold\")"
  print "                      : \"themed-mobile-inactive\""
  print "                  }`}"
  print "                >"
  print "                  <div className={`p-1 sm:p-1.5 rounded-xl transition-all ${"
  print "                    activeTab === \"agenda\" && !isMobileMenuOpen"
  print "                      ? (isDark ? \"bg-indigo-500/10 text-indigo-400\" : \"bg-indigo-50 text-indigo-600\")"
  print "                      : \"bg-transparent\""
  print "                  }`}>\n                    <Calendar className=\"w-5 h-5 sm:w-5 sm:h-5\" />\n                  </div>\n                  <span className=\"text-[9px] sm:text-[10px] truncate max-w-full\">Agenda</span>\n                </button>"
  print "                <button"
  print "                  onClick={() => { setActiveClientId(null); setActiveTab(\"clients\"); setIsMobileMenuOpen(false); }}"
  print "                  className={`flex flex-col items-center justify-center gap-1 cursor-pointer transition-all shrink-0 min-w-[56px] sm:min-w-[64px] ${"
  print "                    activeTab === \"clients\" && !isMobileMenuOpen"
  print "                      ? (isDark ? \"text-indigo-400 scale-105 font-bold\" : \"text-indigo-600 scale-105 font-bold\")"
  print "                      : \"themed-mobile-inactive\""
  print "                  }`}"
  print "                >"
  print "                  <div className={`p-1 sm:p-1.5 rounded-xl transition-all ${"
  print "                    activeTab === \"clients\" && !isMobileMenuOpen"
  print "                      ? (isDark ? \"bg-indigo-500/10 text-indigo-400\" : \"bg-indigo-50 text-indigo-600\")"
  print "                      : \"bg-transparent\""
  print "                  }`}>\n                    <Users className=\"w-5 h-5 sm:w-5 sm:h-5\" />\n                  </div>\n                  <span className=\"text-[9px] sm:text-[10px] truncate max-w-full\">Clientes</span>\n                </button>"
  print "                <button"
  print "                  onClick={() => { setActiveClientId(null); setActiveTab(\"finance\"); setIsMobileMenuOpen(false); }}"
  print "                  className={`flex flex-col items-center justify-center gap-1 cursor-pointer transition-all shrink-0 min-w-[56px] sm:min-w-[64px] ${"
  print "                    activeTab === \"finance\" && !isMobileMenuOpen"
  print "                      ? (isDark ? \"text-indigo-400 scale-105 font-bold\" : \"text-indigo-600 scale-105 font-bold\")"
  print "                      : \"themed-mobile-inactive\""
  print "                  }`}"
  print "                >"
  print "                  <div className={`p-1 sm:p-1.5 rounded-xl transition-all ${"
  print "                    activeTab === \"finance\" && !isMobileMenuOpen"
  print "                      ? (isDark ? \"bg-indigo-500/10 text-indigo-400\" : \"bg-indigo-50 text-indigo-600\")"
  print "                      : \"bg-transparent\""
  print "                  }`}>\n                    <DollarSign className=\"w-5 h-5 sm:w-5 sm:h-5\" />\n                  </div>\n                  <span className=\"text-[9px] sm:text-[10px] truncate max-w-full\">Financeiro</span>\n                </button>"
  print "                <button"
  print "                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}"
  print "                  className={`flex flex-col items-center justify-center gap-1 cursor-pointer transition-all shrink-0 min-w-[56px] sm:min-w-[64px] ${"
  print "                    isMobileMenuOpen"
  print "                      ? (isDark ? \"text-indigo-400 scale-105 font-bold\" : \"text-indigo-600 scale-105 font-bold\")"
  print "                      : \"themed-mobile-inactive\""
  print "                  }`}"
  print "                >"
  print "                  <div className={`p-1 sm:p-1.5 rounded-xl transition-all ${"
  print "                    isMobileMenuOpen"
  print "                      ? (isDark ? \"bg-indigo-500/10 text-indigo-400\" : \"bg-indigo-50 text-indigo-600\")"
  print "                      : \"bg-transparent\""
  print "                  }`}>\n                    <Menu className=\"w-5 h-5 sm:w-5 sm:h-5\" />\n                  </div>\n                  <span className=\"text-[9px] sm:text-[10px] truncate max-w-full\">Mais</span>\n                </button>"
  print "            </div>          </div>"
  print "        </motion.div>"
  next;
}
/^\s*<\/motion.div>$/ {
  if (in_nav == 1) {
    in_nav = 0;
    next;
  }
}
/^\s*<\/\AnimatePresence>$/ {
    if (in_nav == 1) {
        # continue ignoring until we get out
        next;
    }
}
{
  if (in_nav == 0 && !/^\s*<div className="fixed bottom-0 left-0 right-0 z-40 themed-mobile-bar/ && !/mobileNavPage/ && !/key="page0"/ && !/key="page1"/ && !/activeTab === 'services'/ && !/activeTab === 'estoque'/) {
    # It is risky, I will just use sed.
  }
}
' src/App.tsx > tmp.tsx

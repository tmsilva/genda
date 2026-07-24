import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles, Globe, Hourglass, RefreshCw, Package, Gift, Coins,
  Bell, Bot, Target, TrendingUp, Crown, Tag, Megaphone, UserX,
  QrCode, Building2, Users, Receipt, Timer, ChevronDown, ChevronLeft, ChevronRight, Search,
  CheckCircle2, Compass, Lightbulb, Rocket
} from 'lucide-react';

interface RoadmapItem {
  id: string;
  icon: React.ElementType;
  title: string;
  category: string;
  badgeText?: string;
  description: string;
  examplesTitle?: string;
  examples?: string[];
  bulletTitle?: string;
  bulletPoints?: string[];
  quote?: string;
  footerNote?: string;
}

const ROADMAP_ITEMS: RoadmapItem[] = [
  {
    id: 'agendamento-online',
    icon: Globe,
    title: 'Agendamento Online',
    category: 'Atendimento & Cliente',
    badgeText: 'Em desenvolvimento',
    description: 'Permita que seus clientes realizem agendamentos através de um link exclusivo do seu perfil, escolhendo serviço, data e horário disponível, tudo sincronizado automaticamente com sua agenda.'
  },
  {
    id: 'lista-espera',
    icon: Hourglass,
    title: 'Lista de Espera Inteligente',
    category: 'Agenda & Otimização',
    badgeText: 'Em desenvolvimento',
    description: 'Quando ocorrer um cancelamento, o Genda notificará automaticamente clientes interessados naquele horário, preenchendo vagas de forma rápida e reduzindo horários ociosos.'
  },
  {
    id: 'reagendamento-inteligente',
    icon: RefreshCw,
    title: 'Reagendamento Inteligente',
    category: 'Atendimento & Cliente',
    badgeText: 'Em desenvolvimento',
    description: 'Caso um cliente precise cancelar um atendimento, ele poderá escolher outro horário disponível sem precisar entrar em contato diretamente com o profissional.'
  },
  {
    id: 'programa-fidelidade',
    icon: Gift,
    title: 'Programa de Fidelidade',
    category: 'Fidelização',
    badgeText: 'Em desenvolvimento',
    description: 'Crie programas de recompensa para incentivar o retorno dos clientes.',
    examplesTitle: 'Mecanismos de recompensa:',
    examples: ['A cada 10 atendimentos, ganhe 1 gratuito.', 'Acumule pontos e troque por benefícios.']
  },
  {
    id: 'cashback',
    icon: Coins,
    title: 'Cashback',
    category: 'Fidelização & Financeiro',
    badgeText: 'Em desenvolvimento',
    description: 'Ofereça créditos para que seus clientes utilizem em futuros agendamentos, aumentando a fidelização.'
  },
  {
    id: 'lembretes-inteligentes',
    icon: Bell,
    title: 'Lembretes Inteligentes',
    category: 'Comunicação',
    badgeText: 'Em desenvolvimento',
    description: 'O Genda identificará automaticamente clientes que costumam retornar em determinado período e sugerirá o envio de lembretes personalizados.',
    quote: 'Seu cliente costuma retornar a cada 30 dias. Deseja enviar um lembrete?'
  },
  {
    id: 'inteligencia-artificial',
    icon: Bot,
    title: 'Inteligência Artificial',
    category: 'IA & Gestão',
    badgeText: 'Em desenvolvimento',
    description: 'Receba recomendações inteligentes baseadas nos dados do seu negócio.',
    bulletTitle: 'Insights automáticos:',
    bulletPoints: [
      'Melhor horário para promoções.',
      'Serviços mais vendidos.',
      'Sugestões de vendas adicionais.',
      'Clientes com maior chance de retorno.',
      'Horários ociosos.'
    ]
  },
  {
    id: 'metas',
    icon: Target,
    title: 'Metas',
    category: 'Gestão & Desempenho',
    badgeText: 'Em desenvolvimento',
    description: 'Defina objetivos mensais e acompanhe sua evolução através de indicadores práticos:',
    bulletTitle: 'Indicadores monitorados:',
    bulletPoints: ['Faturamento', 'Número de clientes', 'Ticket médio', 'Quantidade de atendimentos']
  },
  {
    id: 'ranking-servicos',
    icon: TrendingUp,
    title: 'Ranking de Serviços',
    category: 'Relatórios & Inteligência',
    badgeText: 'Em desenvolvimento',
    description: 'Descubra quais serviços geram mais faturamento e quais possuem maior procura.'
  },
  {
    id: 'ranking-clientes',
    icon: Crown,
    title: 'Ranking de Clientes',
    category: 'Relatórios & Inteligência',
    badgeText: 'Em desenvolvimento',
    description: 'Veja quais clientes mais frequentam seu negócio e quais geram maior receita.'
  },
  {
    id: 'crm-inteligente',
    icon: Tag,
    title: 'CRM Inteligente',
    category: 'Clientes & CRM',
    badgeText: 'Em desenvolvimento',
    description: 'Organize seus clientes utilizando etiquetas personalizadas.',
    examplesTitle: 'Exemplos de etiquetas:',
    examples: ['VIP', 'Novo Cliente', 'Inativo', 'Aniversariante', 'Premium', 'Faltoso'],
    footerNote: 'Essas informações poderão ser utilizadas em campanhas futuras.'
  },
  {
    id: 'marketing-inteligente',
    icon: Megaphone,
    title: 'Marketing Inteligente',
    category: 'Marketing',
    badgeText: 'Em desenvolvimento',
    description: 'Envie campanhas segmentadas diretamente para grupos específicos de clientes.',
    examplesTitle: 'Públicos segmentados:',
    examples: ['Clientes aniversariantes', 'Clientes inativos', 'Clientes VIP', 'Clientes que utilizam determinado serviço']
  },
  {
    id: 'controle-faltas',
    icon: UserX,
    title: 'Controle de Faltas',
    category: 'Gestão & Proteção',
    badgeText: 'Em desenvolvimento',
    description: 'Acompanhe o histórico de comparecimento dos clientes. O sistema poderá identificar clientes recorrentes em faltas e sugerir cobrança antecipada para novos agendamentos.'
  },
  {
    id: 'sinal-pix',
    icon: QrCode,
    title: 'Sinal via PIX',
    category: 'Financeiro & Pagamentos',
    badgeText: 'Em desenvolvimento',
    description: 'Permita solicitar um valor antecipado para confirmação do agendamento. O horário será reservado somente após a confirmação automática do pagamento.'
  },
  {
    id: 'multiempresa',
    icon: Building2,
    title: 'Multiempresa',
    category: 'Expansão & Estrutura',
    badgeText: 'Em desenvolvimento',
    description: 'Gerencie diversas empresas utilizando apenas uma conta.',
    bulletTitle: 'Cada empresa possuirá:',
    bulletPoints: ['Agenda própria', 'Financeiro independente', 'Clientes', 'Serviços', 'Configurações']
  },
  {
    id: 'multi-profissional',
    icon: Users,
    title: 'Multi Profissional',
    category: 'Equipes & Gestão',
    badgeText: 'Em desenvolvimento',
    description: 'Ideal para equipes. Cada profissional poderá possuir:',
    bulletTitle: 'Controles individuais por profissional:',
    bulletPoints: ['Agenda individual', 'Horários próprios', 'Comissão', 'Metas', 'Serviços específicos']
  },
  {
    id: 'controle-comissoes',
    icon: Receipt,
    title: 'Controle de Comissões',
    category: 'Financeiro & Equipes',
    badgeText: 'Em desenvolvimento',
    description: 'Calcule automaticamente as comissões dos colaboradores com base nos atendimentos realizados.'
  },
  {
    id: 'tempo-inteligente-servicos',
    icon: Timer,
    title: 'Tempo Inteligente dos Serviços',
    category: 'IA & Otimização',
    badgeText: 'Em desenvolvimento',
    description: 'O sistema aprenderá automaticamente quanto tempo cada serviço realmente leva para ser concluído, permitindo previsões cada vez mais precisas e uma agenda mais eficiente.'
  }
];

interface RoadmapViewProps {
  isDark?: boolean;
}

export default function RoadmapView({ isDark = false }: RoadmapViewProps) {
  const ITEMS_PER_PAGE = 6;

  // Single open accordion state
  const [openId, setOpenId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const toggleAccordion = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const filteredItems = ROADMAP_ITEMS.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-fadeIn pb-12">
      {/* HEADER SECTION */}
      <div className={`rounded-3xl p-6 sm:p-10 border transition-all relative overflow-hidden shadow-lg ${
        isDark 
          ? 'bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-indigo-950/40 border-zinc-800 text-zinc-100' 
          : 'bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/40 border-slate-200/80 text-slate-900'
      }`}>
        {/* Glow Effects Background */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-display flex items-center gap-3">
            O que está por vir ✨
          </h1>

          <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
            Estamos trabalhando constantemente para tornar o Genda ainda mais completo. Confira algumas funcionalidades que já estão em nosso roadmap.
          </p>
        </div>
      </div>

      {/* SEARCH BAR & SUMMARY CONTROLS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${
            isDark ? 'text-zinc-500' : 'text-slate-400'
          }`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar funcionalidade em breve..."
            className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-2xl border transition-all outline-none ${
              isDark
                ? 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => handleSearchChange('')}
              className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold px-2 py-0.5 rounded-md ${
                isDark ? 'bg-zinc-800 text-zinc-400 hover:text-zinc-200' : 'bg-slate-100 text-slate-500 hover:text-slate-800'
              }`}
            >
              Limpar
            </button>
          )}
        </div>

        <div className="text-xs font-medium text-slate-500 dark:text-zinc-400 flex items-center gap-2 self-end sm:self-center">
          <span>Exibindo <strong>{paginatedItems.length}</strong> de {filteredItems.length} itens (Página {currentPage} de {totalPages})</span>
        </div>
      </div>

      {/* ACCORDION LIST */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className={`p-8 text-center rounded-2xl border ${
            isDark ? 'bg-zinc-900/50 border-zinc-800 text-zinc-400' : 'bg-white border-slate-200 text-slate-500'
          }`}>
            <Lightbulb className="w-8 h-8 mx-auto text-amber-500 mb-2 opacity-80" />
            <p className="font-semibold text-sm">Nenhuma funcionalidade encontrada para "{searchQuery}"</p>
            <p className="text-xs mt-1">Tente pesquisar por outros termos como "agendamento", "PIX", "IA" ou "clientes".</p>
          </div>
        ) : (
          paginatedItems.map((item) => {
            const IconComponent = item.icon;
            const isOpen = openId === item.id;

            return (
              <div
                key={item.id}
                className={`rounded-2xl border transition-all duration-200 shadow-sm overflow-hidden ${
                  isOpen
                    ? (isDark 
                        ? 'bg-zinc-900 border-indigo-500/50 shadow-indigo-500/5 ring-1 ring-indigo-500/30' 
                        : 'bg-white border-indigo-200 shadow-indigo-100/50 ring-1 ring-indigo-500/20')
                    : (isDark 
                        ? 'bg-zinc-900/80 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900' 
                        : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow')
                }`}
              >
                {/* ACCORDION HEADER (Click to toggle) */}
                <button
                  onClick={() => toggleAccordion(item.id)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left cursor-pointer transition-colors select-none"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform ${
                      isOpen
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105'
                        : (isDark ? 'bg-zinc-800 text-indigo-400' : 'bg-indigo-50 text-indigo-600')
                    }`}>
                      <IconComponent className="w-5 h-5 sm:w-5 sm:h-5" />
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className={`font-bold text-sm sm:text-base tracking-tight truncate ${
                          isDark ? 'text-zinc-100' : 'text-slate-850'
                        }`}>
                          {item.title}
                        </h3>
                      </div>
                      <span className={`text-[11px] font-medium block ${
                        isDark ? 'text-zinc-500' : 'text-slate-400'
                      }`}>
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {/* Expand/Collapse Chevron */}
                    <div className={`p-1.5 rounded-lg transition-transform duration-300 ${
                      isOpen 
                        ? 'rotate-180 bg-indigo-500/10 text-indigo-500' 
                        : (isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-slate-400 hover:text-slate-700')
                    }`}>
                      <ChevronDown className="w-5 h-5" />
                    </div>
                  </div>
                </button>

                {/* ACCORDION EXPANDABLE CONTENT */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className={`p-4 sm:p-5 pt-0 border-t space-y-4 text-xs sm:text-sm leading-relaxed ${
                        isDark ? 'border-zinc-800/80 text-zinc-300' : 'border-slate-100 text-slate-600'
                      }`}>
                        <p className="pt-3">{item.description}</p>

                        {/* EXAMPLES LIST */}
                        {item.examples && item.examples.length > 0 && (
                          <div className={`p-3.5 rounded-xl border space-y-2 ${
                            isDark ? 'bg-zinc-950/60 border-zinc-800/80' : 'bg-slate-50/80 border-slate-200/60'
                          }`}>
                            {item.examplesTitle && (
                              <span className="font-semibold text-xs text-indigo-500 dark:text-indigo-400 block">
                                {item.examplesTitle}
                              </span>
                            )}
                            <ul className="space-y-1.5 pl-1">
                              {item.examples.map((ex, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-xs">
                                  <span className="text-indigo-500 font-bold shrink-0">•</span>
                                  <span>{ex}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* BULLET POINTS */}
                        {item.bulletPoints && item.bulletPoints.length > 0 && (
                          <div className={`p-3.5 rounded-xl border space-y-2 ${
                            isDark ? 'bg-zinc-950/60 border-zinc-800/80' : 'bg-slate-50/80 border-slate-200/60'
                          }`}>
                            {item.bulletTitle && (
                              <span className="font-semibold text-xs text-indigo-500 dark:text-indigo-400 block">
                                {item.bulletTitle}
                              </span>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                              {item.bulletPoints.map((bp, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-xs">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                  <span>{bp}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* QUOTE / HIGHLIGHT */}
                        {item.quote && (
                          <div className={`p-3.5 rounded-xl border-l-4 border-indigo-500 bg-indigo-500/5 p-3 text-xs italic ${
                            isDark ? 'text-indigo-200' : 'text-indigo-900'
                          }`}>
                            "{item.quote}"
                          </div>
                        )}

                        {/* FOOTER NOTE */}
                        {item.footerNote && (
                          <p className="text-[11px] text-slate-400 dark:text-zinc-500 italic pt-1">
                            {item.footerNote}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>

      {/* PAGINATION CONTROLS */}
      {totalPages > 1 && (
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl border ${
          isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-slate-200/80 shadow-sm'
        }`}>
          <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
            Mostrando {startIndex + 1} a {Math.min(startIndex + ITEMS_PER_PAGE, filteredItems.length)} de {filteredItems.length} itens
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                isDark
                  ? 'bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title="Página anterior"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Anterior</span>
            </button>

            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    currentPage === page
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 font-bold scale-105'
                      : isDark
                        ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                isDark
                  ? 'bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title="Próxima página"
            >
              <span className="hidden sm:inline">Próxima</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* FOOTER CALLOUT */}
      <div className={`p-6 rounded-2xl border text-center space-y-2 ${
        isDark ? 'bg-zinc-900/60 border-zinc-800 text-zinc-400' : 'bg-slate-50 border-slate-200 text-slate-600'
      }`}>
        <p className="text-xs sm:text-sm font-medium">
          Tem alguma sugestão de funcionalidade para o Genda?
        </p>
        <p className="text-xs text-slate-400 dark:text-zinc-500">
          Esta tela é apenas informativa. Nosso time de desenvolvimento está trabalhando continuamente para lançar cada uma dessas novidades em breve!
        </p>
      </div>
    </div>
  );
}

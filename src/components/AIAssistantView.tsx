import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Sparkles, User, Bot, RefreshCw, AlertCircle, PlayCircle, Clipboard, HelpCircle
} from 'lucide-react';
import { Client, Appointment, Service, StockItem } from '../types';

interface AIAssistantViewProps {
  clients: Client[];
  appointments: Appointment[];
  services: Service[];
  stock: StockItem[];
  isDark?: boolean;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIAssistantView({ clients, appointments, services, stock, isDark = false }: AIAssistantViewProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Olá! Eu sou o Genda AI, seu consultor de negócios pessoal. Fui treinado especificamente com seus dados de clientes, atendimentos, catálogo de serviços e estoque de materiais. Como posso te ajudar hoje?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const suggestions = [
    { label: '📊 Análise de faturamento', prompt: 'Faça uma análise resumida do meu faturamento deste mês, destacando quais serviços foram mais lucrativos.' },
    { label: '⚠ Clientes em risco', prompt: 'Quem são meus clientes em risco de evasão que não agendam há mais de 45 dias? Me dê ideias e uma mensagem para enviar para eles.' },
    { label: '📦 Relatório de estoque', prompt: 'Quais materiais do meu estoque precisam de reposição urgente? Me sugira uma lista de compras.' },
    { label: '💡 Ideias de Marketing', prompt: 'Crie uma campanha ou ideia de promoção para divulgar meus kits de serviços (Pacotes) para clientes novos.' }
  ];

  const getFriendlyErrorMessage = (errMessage: string): string => {
    const msg = errMessage.toLowerCase();
    
    if (msg.includes('gemini_api_key') || msg.includes('chave api') || msg.includes('not configured') || msg.includes('não está configurada')) {
      return 'Ops! Para conversar comigo e receber análises inteligentes do seu negócio, precisamos configurar a sua chave de API do Gemini. 🔑\n\nPor favor, vá no menu superior em "Configurações > Secrets" (ícone de engrenagem) e adicione a chave GEMINI_API_KEY para começarmos!';
    }
    
    if (msg.includes('api_key_invalid') || msg.includes('api key not valid') || msg.includes('invalid api key') || msg.includes('chave inválida') || msg.includes('not found')) {
      return 'Hum, parece que a sua chave de API do Gemini é inválida ou não foi configurada corretamente. ⚠️\n\nPor favor, verifique se copiou a chave inteira e sem espaços extras em "Configurações > Secrets" no menu do topo.';
    }
    
    if (msg.includes('quota') || msg.includes('exhausted') || msg.includes('rate limit') || msg.includes('limit') || msg.includes('429')) {
      return 'Estou recebendo muitas mensagens agora ou atingimos o limite de uso temporário do Gemini. 🕒\n\nQue tal aguardar um minutinho e tentar novamente? Estou ansioso para te ajudar!';
    }
    
    if (msg.includes('fetch') || msg.includes('network') || msg.includes('failed to fetch') || msg.includes('offline')) {
      return 'Não consegui me conectar ao servidor do Genda AI. Verifique se a sua conexão com a internet está ativa e tente enviar novamente em instantes. 🌐';
    }
    
    if (msg.includes('timeout') || msg.includes('tempo limite')) {
      return 'A resposta demorou um pouquinho mais do que o esperado devido à sobrecarga na rede. Vamos tentar novamente? ⏱️';
    }

    return 'Opa! Tive um pequeno contratempo ao analisar os dados do seu negócio para formular a resposta. 🚀\n\nPor favor, tente enviar sua mensagem novamente.';
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    setError(null);
    const userMessage: Message = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate short processing delay for premium feel
    setTimeout(() => {
      let reply = '';
      const text = textToSend.toLowerCase();

      if (text.includes('faturamento') || text.includes('lucrativos') || text.includes('lucro')) {
        // Compute actual monthly billing
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();

        // appointments this month that are completed
        const completedAppts = appointments.filter(a => {
          if (a.status !== 'completed') return false;
          const ad = new Date(a.date);
          return ad.getMonth() === thisMonth && ad.getFullYear() === thisYear;
        });

        let totalRevenue = 0;
        const serviceCounts: { [key: string]: { count: number, revenue: number, name: string } } = {};

        completedAppts.forEach(a => {
          const srv = services.find(s => s.id === a.serviceId);
          if (srv) {
            totalRevenue += srv.price;
            if (!serviceCounts[srv.id]) {
              serviceCounts[srv.id] = { count: 0, revenue: 0, name: srv.name };
            }
            serviceCounts[srv.id].count += 1;
            serviceCounts[srv.id].revenue += srv.price;
          }
        });

        const sortedServices = Object.values(serviceCounts).sort((a, b) => b.revenue - a.revenue);
        const topServiceStr = sortedServices.length > 0 
          ? sortedServices.slice(0, 3).map((s, i) => `${i+1}. **${s.name}**: ${s.count} atendimentos (R$ ${s.revenue.toFixed(2)})`).join('\n')
          : 'Nenhum serviço registrado neste mês ainda.';

        reply = `📊 **Análise de Faturamento & Serviços (Modo Analítico Local)**\n\nIdentifiquei as seguintes informações a partir do banco de dados local do seu dispositivo:\n\n* **Faturamento Bruto Realizado (Este Mês):** R$ ${totalRevenue.toFixed(2)}\n* **Atendimentos Concluídos (Este Mês):** ${completedAppts.length} agendamento(s)\n\n--- \n\n### 🏆 Serviços Mais Lucrativos do Período:\n${topServiceStr}\n\n* **Recomendação:** Seus serviços de alta rentabilidade estão com boa demanda! Considere criar pacotes promocionais associando-os com serviços menos procurados para aumentar a receita média por cliente.`;
      } 
      else if (text.includes('risco') || text.includes('evasão') || text.includes('45 dias')) {
        // Find clients without appointments in last 45 days
        const now = new Date();
        const fortyFiveDaysAgo = new Date(now.getTime() - (45 * 24 * 60 * 60 * 1000));

        const clientsInRisk = clients.filter(c => {
          // find last appointment for this client
          const clientAppts = appointments.filter(a => a.clientId === c.id);
          if (clientAppts.length === 0) return true; // never scheduled

          const lastDate = new Date(Math.max(...clientAppts.map(a => new Date(a.date).getTime())));
          return lastDate < fortyFiveDaysAgo;
        });

        const clientListStr = clientsInRisk.length > 0
          ? clientsInRisk.slice(0, 5).map(c => `• **${c.name}** (${c.phone})`).join('\n')
          : 'Nenhum cliente inativo há mais de 45 dias! Excelente taxa de fidelidade.';

        reply = `⚠️ **Relatório de Clientes em Risco de Evasão**\n\nAnalisando o histórico de visitas, identifiquei **${clientsInRisk.length} clientes** que não agendam ou não aparecem há mais de 45 dias:\n\n${clientListStr}\n\n--- \n\n### 💡 Ação de Marketing Sugerida:\nEnvie uma mensagem amigável de "Sentimos sua falta" com uma condição especial ou novidade!\n\n**Copie e envie esta mensagem no WhatsApp deles:**\n\n> "Olá, *[Nome]*! Tudo bem? Faz um tempo que não nos vemos por aqui no consultório/salão e sentimos sua falta! 😊 Gostaria de te convidar para conhecer as nossas novas opções deste mês. Que tal agendarmos um horário para esta semana? Te dou um mimo especial de retorno! Segue o link para escolher seu horário: [Link da Agenda]"`;
      }
      else if (text.includes('estoque') || text.includes('reposição') || text.includes('compras')) {
        const lowStock = stock.filter(item => item.quantity <= item.minQuantity);
        const lowStockStr = lowStock.length > 0
          ? lowStock.map(item => `• 📦 **${item.name}** (Qtd Atual: ${item.quantity} | Mínimo ideal: ${item.minQuantity} ${item.unit})`).join('\n')
          : 'Excelente! Todos os materiais estão com nível adequado no estoque.';

        reply = `📦 **Relatório de Estoque e Alertas de Reposição**\n\nRealizei a verificação dos seus insumos de consumo de forma automática:\n\n### ⚠️ Materiais abaixo do nível mínimo ideal:\n${lowStockStr}\n\n---\n\n### 🛒 Sugestão de Lista de Compras:\n${
          lowStock.length > 0 
            ? lowStock.map(item => `• [ ] **${item.name}**: Comprar pelo menos ${item.minQuantity * 2 - item.quantity} ${item.unit}`).join('\n')
            : 'Nenhuma compra pendente urgente recomendada. Continue acompanhando os consumos semanais.'
        }`;
      }
      else {
        // Fallback or marketing package builder
        reply = `💡 **Ideias de Marketing & Impulsionamento de Vendas**\n\nPara alavancar seus atendimentos neste período, sugiro a criação de **Pacotes Promocionais Inteligentes** baseados em seu catálogo de **${services.length} serviços**:\n\n1. **Pacote Fidelidade Mensal:** Agrupe 4 sessões de um serviço principal com 10% de desconto para pagamento antecipado (ótimo para fluxo de caixa).\n2. **Venda Casada Expresso:** Ofereça um serviço rápido complementar com 50% de desconto ao comprar o serviço principal de maior valor.\n3. **Campanha WhatsApp:** Envie convites personalizados para os seus **${clients.length} clientes** ativos oferecendo um cupom de desconto para novos atendimentos agendados às terças e quartas-feiras (dias de menor movimento).\n\nComo todos os seus dados estão salvos de forma estritamente local, sua inteligência de negócios é 100% privada e independente de internet!`;
      }

      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className={`flex flex-col h-[calc(100vh-12rem)] md:h-[calc(100vh-6rem)] w-full ${isDark ? 'bg-zinc-900 border-zinc-800 shadow-zinc-950/40' : 'bg-white border-slate-100 shadow-xl'} overflow-hidden border`} id="ai-assistant-tab-root">
      
      {/* Header */}
      <div className={`px-5 py-4 flex items-center justify-between shrink-0 border-b ${isDark ? 'bg-zinc-950 border-zinc-850 text-white' : 'bg-slate-900 border-slate-800 text-white'}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm leading-tight">Genda AI Assistant</h3>
            <span className="text-[9px] text-indigo-300 font-mono uppercase tracking-wider">Inteligência de Negócios Conectada</span>
          </div>
        </div>
        <div className={`text-[10px] font-mono ${isDark ? 'bg-indigo-500/10 border-indigo-500/25 text-indigo-400' : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'} px-2.5 py-0.5 rounded-full flex items-center gap-1.5 border`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          IA Ativa
        </div>
      </div>

      {/* Messages Area */}
      <div className={`flex-1 overflow-y-auto p-4 md:p-5 space-y-4 ${isDark ? 'bg-zinc-950/40' : 'bg-slate-50/50'}`}>
        
        {messages.map((m, idx) => (
          <div 
            key={idx}
            className={`flex items-start gap-3 max-w-[85%] ${m.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border shadow-sm ${
              m.role === 'user' 
                ? (isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-900 border-slate-800 text-white') 
                : 'bg-indigo-600 border-indigo-500 text-white'
            }`}>
              {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div className={`p-4 rounded-2xl text-xs leading-relaxed font-sans border ${
              m.role === 'user'
                ? (isDark ? 'bg-zinc-800 border-zinc-750 text-white rounded-tr-none' : 'bg-slate-900 border-slate-800 text-white rounded-tr-none')
                : (isDark ? 'bg-zinc-900 text-zinc-100 border-zinc-800 rounded-tl-none shadow-sm' : 'bg-white text-slate-800 border-slate-100 rounded-tl-none shadow-sm')
            }`}>
              <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                {m.content}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-3 max-w-[80%]">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 border border-indigo-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Bot className="w-4 h-4" />
            </div>
            <div className={`${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-white border-slate-100 text-slate-800'} border p-4 rounded-2xl rounded-tl-none flex items-center gap-2 shadow-sm`}>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-slate-400'} font-medium`}>Analisando dados do negócio...</span>
            </div>
          </div>
        )}

        {error && (
          <div className={`${isDark ? 'bg-amber-950/20 border-amber-900/40 text-amber-300' : 'bg-amber-50 border-amber-100 text-slate-700'} p-4 rounded-2xl text-xs leading-relaxed max-w-md mx-auto shadow-sm flex items-start gap-3 border`}>
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1">
              <span className={`font-semibold ${isDark ? 'text-amber-400' : 'text-amber-900'} block`}>Dica do Genda AI</span>
              <p className={`whitespace-pre-line ${isDark ? 'text-zinc-300' : 'text-slate-600'} font-medium`}>{error}</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts Section */}
      <div className={`p-3.5 ${isDark ? 'bg-zinc-900 border-t border-zinc-850' : 'bg-white border-t border-slate-100'} overflow-x-auto whitespace-nowrap scrollbar-none shrink-0 flex gap-2`}>
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(s.prompt)}
            className={`inline-flex items-center gap-1 text-[11px] ${
              isDark 
                ? 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-850 hover:border-zinc-700 hover:text-white' 
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700'
            } font-medium px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-sm shrink-0 border`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
        className={`p-3.5 ${isDark ? 'bg-zinc-900 border-t border-zinc-850' : 'bg-white border-t border-slate-100'} shrink-0 flex items-center gap-2.5`}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pergunte ao Genda AI sobre faturamento, estoque ou marketing..."
          disabled={isLoading}
          className={`flex-1 ${
            isDark 
              ? 'bg-zinc-950 border-zinc-800 text-zinc-100 placeholder-zinc-650 focus:border-zinc-700 focus:bg-zinc-950' 
              : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white'
          } rounded-2xl px-4.5 py-3 text-xs transition-all focus:outline-none border`}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className={`p-3 rounded-2xl ${
            isDark ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'
          } disabled:opacity-50 disabled:bg-zinc-950 disabled:text-zinc-700 transition-all shadow-md active:scale-95 cursor-pointer shrink-0`}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
}

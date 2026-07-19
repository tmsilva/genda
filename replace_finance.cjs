const fs = require('fs');
let code = fs.readFileSync('src/components/FinanceView.tsx', 'utf8');

const tableCode = `<div className="w-full">
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs min-w-[600px]">
                  <thead>
                    <tr className={\`border-b font-display font-bold tracking-wider uppercase text-[10px] sticky top-0 z-10 \${
                      isDark ? 'bg-zinc-900 border-zinc-900 text-zinc-400' : 'bg-slate-50 border-slate-100 text-slate-500'
                    }\`}>
                      <th className="py-3 px-4">Serviço</th>
                      <th className="py-3 px-4">Cliente</th>
                      <th className="py-3 px-4">Data</th>
                      <th className="py-3 px-4">Pagamento</th>
                      <th className="py-3 px-4 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className={\`divide-y \${isDark ? 'divide-zinc-900/60' : 'divide-slate-100'}\`}>
                    {reportAppointments.map((appt) => {
                      const sName = getServiceName(appt.serviceId);
                      const cName = getClientName(appt.clientId);
                      const isPaid = appt.paymentStatus === 'paid';
                      const isInstallments = appt.paymentStatus === 'installments';

                      // Theme aware badge style
                      const badgeClass = isPaid
                        ? (isDark ? 'bg-emerald-950/40 text-emerald-300 border-emerald-900/30' : 'bg-emerald-50 text-emerald-700 border-emerald-100')
                        : isInstallments
                        ? (isDark ? 'bg-purple-950/40 text-purple-300 border-purple-900/30' : 'bg-purple-50 text-purple-700 border-purple-100')
                        : (isDark ? 'bg-amber-950/40 text-amber-300 border-amber-900/30' : 'bg-amber-50 text-amber-700 border-amber-100');

                      return (
                        <tr 
                          key={appt.id}
                          className={\`transition-colors duration-150 \${
                            isDark ? 'hover:bg-zinc-900/20' : 'hover:bg-slate-50/50'
                          }\`}
                        >
                          <td className="py-3 px-4 font-semibold">
                            <span className={isDark ? 'text-zinc-200' : 'text-slate-900'}>{sName}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={isDark ? 'text-zinc-300' : 'text-slate-700'}>{cName}</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                            {appt.date.split('-').reverse().join('/')}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className={\`text-[9px] px-2 py-0.5 rounded font-semibold border \${badgeClass}\`}>
                                {isPaid ? 'Pago' : isInstallments ? 'Parcelado' : 'Pendente'}
                              </span>
                              {appt.paymentMethod && (
                                <span className="text-[9px] text-slate-400 uppercase font-mono">
                                  ({appt.paymentMethod})
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-bold font-mono">
                            <span className={isDark ? 'text-zinc-100' : 'text-slate-900'}>R$ {formatPrice(appt.price)}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden flex flex-col gap-3 p-3">
                {reportAppointments.map((appt) => {
                  const sName = getServiceName(appt.serviceId);
                  const cName = getClientName(appt.clientId);
                  const isPaid = appt.paymentStatus === 'paid';
                  const isInstallments = appt.paymentStatus === 'installments';

                  const badgeClass = isPaid
                    ? (isDark ? 'bg-emerald-950/40 text-emerald-300 border-emerald-900/30' : 'bg-emerald-50 text-emerald-700 border-emerald-100')
                    : isInstallments
                    ? (isDark ? 'bg-purple-950/40 text-purple-300 border-purple-900/30' : 'bg-purple-50 text-purple-700 border-purple-100')
                    : (isDark ? 'bg-amber-950/40 text-amber-300 border-amber-900/30' : 'bg-amber-50 text-amber-700 border-amber-100');

                  return (
                    <div 
                      key={appt.id}
                      className={\`p-4 rounded-xl border flex flex-col gap-2 \${
                        isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-slate-50 border-slate-100'
                      }\`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span className={\`font-bold text-sm \${isDark ? 'text-zinc-100' : 'text-slate-900'}\`}>{sName}</span>
                          <span className={\`text-xs \${isDark ? 'text-zinc-400' : 'text-slate-500'}\`}>{cName}</span>
                        </div>
                        <span className={\`font-mono font-bold text-sm \${isDark ? 'text-emerald-400' : 'text-emerald-600'}\`}>R$ {formatPrice(appt.price)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-dashed border-slate-200/20">
                        <span className="font-mono text-[10px] text-slate-400">
                          {appt.date.split('-').reverse().join('/')}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={\`text-[9px] px-2 py-0.5 rounded font-semibold border \${badgeClass}\`}>
                            {isPaid ? 'Pago' : isInstallments ? 'Parcelado' : 'Pendente'}
                          </span>
                          {appt.paymentMethod && (
                            <span className="text-[9px] text-slate-400 uppercase font-mono">
                              ({appt.paymentMethod})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>`;

code = code.replace(/<div className="w-full overflow-x-auto">[\s\S]*?<\/table>\s*<\/div>/, tableCode);
fs.writeFileSync('src/components/FinanceView.tsx', code);

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
         RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';

interface ProfileAnalysisProps {
  profileAnalysis: {
    profile: string;
    total_contatos: number;
    mensagens_enviadas: number;
    mensagens_respondidas: number;
    taxa_resposta: number;
    tempo_medio_resposta?: number;
    melhor_horario?: string;
    color?: string;
  }[];
}

export const ProfileAnalysis = ({ profileAnalysis }: ProfileAnalysisProps) => {
  // Preparar dados para o radar chart
  const radarData = profileAnalysis.map(p => ({
    perfil: p.profile.length > 15 ? p.profile.substring(0, 15) + '...' : p.profile,
    'Taxa de Resposta': p.taxa_resposta,
    'Engajamento': p.total_contatos > 0 ? (p.mensagens_respondidas / p.total_contatos) * 10 : 0, // normalizar para escala 0-10
    'Volume': Math.min((p.mensagens_enviadas / 100), 100), // normalizar para escala 0-100
  }));

  return (
    <div className="space-y-6">
      {/* Cards Comparativos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {profileAnalysis.slice(0, 3).map((profile, idx) => (
          <Card key={idx} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-lg text-slate-900 truncate" title={profile.profile}>
                  {profile.profile}
                </h3>
                <span className="text-2xl">
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                </span>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-600 mb-1">Taxa de Resposta</p>
                  <p className="text-2xl font-bold text-blue-600">{profile.taxa_resposta.toFixed(1)}%</p>
                  <div className="mt-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(profile.taxa_resposta, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-600">Contatos</p>
                    <p className="font-semibold text-slate-900">{profile.total_contatos.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Respostas</p>
                    <p className="font-semibold text-slate-900">{profile.mensagens_respondidas.toLocaleString()}</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-xs text-slate-600">⏱️ Tempo Médio</span>
                    <span className="font-medium text-slate-700">
                      {profile.tempo_medio_resposta ? `${profile.tempo_medio_resposta}min` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-xs text-slate-600">🕐 Melhor Horário</span>
                    <span className="font-medium text-slate-700">{profile.melhor_horario || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Gráfico Radar - Performance por Perfil */}
      {radarData.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Performance Comparativa por Perfil</CardTitle>
            <CardDescription>Visualização multidimensional do desempenho</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <defs>
                  <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis 
                  dataKey="perfil" 
                  stroke="#64748b"
                  style={{ fontSize: '12px' }}
                />
                <PolarRadiusAxis 
                  stroke="#64748b"
                  style={{ fontSize: '11px' }}
                />
                <Radar 
                  name="Taxa de Resposta" 
                  dataKey="Taxa de Resposta" 
                  stroke="#2563EB" 
                  fill="url(#radarGradient)"
                  fillOpacity={0.6} 
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                  formatter={(value: number, name: string) => {
                    if (name === 'Taxa de Resposta') return [`${value.toFixed(1)}%`, name];
                    return [value.toFixed(1), name];
                  }}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
      
      {/* Gráfico de Barras - Taxa de Resposta */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Taxa de Resposta por Perfil</CardTitle>
          <CardDescription>Comparação de efetividade entre perfis</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={profileAnalysis} margin={{ bottom: 60 }}>
              <defs>
                <linearGradient id="profileBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.5}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="profile" 
                angle={-45} 
                textAnchor="end" 
                height={100}
                stroke="#64748b"
                style={{ fontSize: '11px' }}
              />
              <YAxis 
                stroke="#64748b"
                style={{ fontSize: '12px' }}
                label={{ value: 'Taxa (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Taxa de Resposta']}
              />
              <Bar 
                dataKey="taxa_resposta" 
                fill="url(#profileBarGradient)" 
                animationDuration={1000}
                animationEasing="ease-out"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* Tabela Detalhada */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Análise Detalhada por Perfil</CardTitle>
          <CardDescription>Métricas completas de cada perfil de contato</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left p-3 text-sm font-semibold text-slate-700">Perfil</th>
                  <th className="text-right p-3 text-sm font-semibold text-slate-700">Contatos</th>
                  <th className="text-right p-3 text-sm font-semibold text-slate-700">Enviadas</th>
                  <th className="text-right p-3 text-sm font-semibold text-slate-700">Respondidas</th>
                  <th className="text-right p-3 text-sm font-semibold text-slate-700">Taxa</th>
                  <th className="text-right p-3 text-sm font-semibold text-slate-700">Tempo Médio</th>
                  <th className="text-center p-3 text-sm font-semibold text-slate-700">Melhor Horário</th>
                </tr>
              </thead>
              <tbody>
                {profileAnalysis.map((profile, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-medium text-slate-900">{profile.profile}</td>
                    <td className="text-right p-3 text-slate-700">{profile.total_contatos.toLocaleString()}</td>
                    <td className="text-right p-3 text-slate-700">{profile.mensagens_enviadas.toLocaleString()}</td>
                    <td className="text-right p-3 text-slate-700">{profile.mensagens_respondidas.toLocaleString()}</td>
                    <td className="text-right p-3">
                      <span className={`font-semibold ${
                        profile.taxa_resposta > 15 ? 'text-green-600' :
                        profile.taxa_resposta > 10 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {profile.taxa_resposta.toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-right p-3 text-slate-700">
                      {profile.tempo_medio_resposta ? (
                        <span className="inline-flex items-center gap-1">
                          ⏱️ {profile.tempo_medio_resposta}min
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="text-center p-3">
                      {profile.melhor_horario ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm font-medium">
                          🕐 {profile.melhor_horario}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Insights de Perfil */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">👥 Insights de Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {profileAnalysis.length > 0 && (
              <>
                <p className="text-sm text-slate-700">
                  <strong>Perfil Mais Responsivo:</strong>{' '}
                  <span className="text-green-600 font-semibold">
                    {profileAnalysis.sort((a, b) => b.taxa_resposta - a.taxa_resposta)[0]?.profile}
                  </span>
                  {' '}com taxa de{' '}
                  <span className="text-green-600 font-semibold">
                    {profileAnalysis.sort((a, b) => b.taxa_resposta - a.taxa_resposta)[0]?.taxa_resposta.toFixed(1)}%
                  </span>
                </p>
                <p className="text-sm text-slate-700">
                  <strong>Total de Perfis:</strong> {profileAnalysis.length} perfis diferentes identificados
                </p>
                {profileAnalysis.some(p => p.tempo_medio_resposta) && (
                  <p className="text-sm text-slate-700">
                    <strong>Perfil Mais Rápido:</strong>{' '}
                    <span className="text-blue-600 font-semibold">
                      {profileAnalysis
                        .filter(p => p.tempo_medio_resposta !== null)
                        .sort((a, b) => (a.tempo_medio_resposta || Infinity) - (b.tempo_medio_resposta || Infinity))[0]?.profile}
                    </span>
                    {' '}responde em média em{' '}
                    <span className="text-blue-600 font-semibold">
                      {profileAnalysis
                        .filter(p => p.tempo_medio_resposta !== null)
                        .sort((a, b) => (a.tempo_medio_resposta || Infinity) - (b.tempo_medio_resposta || Infinity))[0]?.tempo_medio_resposta}
                      min
                    </span>
                  </p>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


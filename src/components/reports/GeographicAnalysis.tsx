import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip as MapTooltip } from 'react-leaflet';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import 'leaflet/dist/leaflet.css';

// Coordenadas principais do Paraná
const PARANA_COORDS: Record<string, [number, number]> = {
  'Curitiba': [-25.4284, -49.2733],
  'Londrina': [-23.3045, -51.1696],
  'Maringá': [-23.4205, -51.9333],
  'Ponta Grossa': [-25.0916, -50.1668],
  'Cascavel': [-24.9555, -53.4552],
  'Foz do Iguaçu': [-25.5478, -54.5882],
  'São José dos Pinhais': [-25.5331, -49.2064],
  'Colombo': [-25.2917, -49.2244],
  'Guarapuava': [-25.3905, -51.4618],
  'Paranaguá': [-25.5163, -48.5234],
  'Araucária': [-25.5928, -49.4105],
  'Toledo': [-24.7139, -53.7428],
  'Apucarana': [-23.5508, -51.4608],
  'Pinhais': [-25.4448, -49.1926],
  'Campo Largo': [-25.4594, -49.5274],
  'Arapongas': [-23.4190, -51.4248],
  'Almirante Tamandaré': [-25.3247, -49.3103],
  'Umuarama': [-23.7663, -53.3250],
  'Piraquara': [-25.4422, -49.0628],
  'Cambé': [-23.2755, -51.2778],
  'Pato Branco': [-26.2287, -52.6708],
  'Paranavaí': [-23.0773, -52.4650],
  'Sarandi': [-23.4428, -51.8792],
  'Fazenda Rio Grande': [-25.6596, -49.3089],
  'Telêmaco Borba': [-24.3236, -50.6155],
  'Castro': [-24.7911, -50.0118],
  'Irati': [-25.4661, -50.6506],
  'Francisco Beltrão': [-26.0809, -53.0551],
  'União da Vitória': [-26.2280, -51.0867],
  'Rolândia': [-23.3102, -51.3687],
};

interface GeographicAnalysisProps {
  geographicData: {
    cidade: string;
    total_contatos: number;
    mensagens_enviadas: number;
    mensagens_respondidas: number;
    taxa_resposta: number;
    sentimento_predominante: string;
  }[];
}

export const GeographicAnalysis = ({ geographicData }: GeographicAnalysisProps) => {
  const getSentimentEmoji = (sentiment: string) => {
    const emojiMap: Record<string, string> = {
      'super_engajado': '🔥',
      'positivo': '😊',
      'neutro': '😐',
      'negativo': '😞',
    };
    return emojiMap[sentiment] || '😐';
  };

  const getSentimentColor = (sentiment: string) => {
    const colorMap: Record<string, string> = {
      'super_engajado': 'bg-orange-100 text-orange-800',
      'positivo': 'bg-green-100 text-green-800',
      'neutro': 'bg-gray-100 text-gray-800',
      'negativo': 'bg-red-100 text-red-800',
    };
    return colorMap[sentiment] || 'bg-gray-100 text-gray-800';
  };

  const getSentimentLabel = (sentiment: string) => {
    const labelMap: Record<string, string> = {
      'super_engajado': 'Super Engajado',
      'positivo': 'Positivo',
      'neutro': 'Neutro',
      'negativo': 'Negativo',
    };
    return labelMap[sentiment] || sentiment;
  };

  return (
    <div className="space-y-6">
      {/* Top 10 Cidades - Tabela */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Top 10 Cidades por Engajamento</CardTitle>
          <CardDescription>Cidades com maior número de contatos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left p-3 text-sm font-semibold text-slate-700">Cidade</th>
                  <th className="text-right p-3 text-sm font-semibold text-slate-700">Contatos</th>
                  <th className="text-right p-3 text-sm font-semibold text-slate-700">Mensagens</th>
                  <th className="text-right p-3 text-sm font-semibold text-slate-700">Respostas</th>
                  <th className="text-right p-3 text-sm font-semibold text-slate-700">Taxa</th>
                  <th className="text-center p-3 text-sm font-semibold text-slate-700">Sentimento</th>
                </tr>
              </thead>
              <tbody>
                {geographicData.slice(0, 10).map((city, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-medium text-slate-900">{city.cidade}</td>
                    <td className="text-right p-3 text-slate-700">{city.total_contatos.toLocaleString()}</td>
                    <td className="text-right p-3 text-slate-700">{city.mensagens_enviadas.toLocaleString()}</td>
                    <td className="text-right p-3 text-slate-700">{city.mensagens_respondidas.toLocaleString()}</td>
                    <td className="text-right p-3">
                      <span className={`font-semibold ${
                        city.taxa_resposta > 15 ? 'text-green-600' :
                        city.taxa_resposta > 10 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {city.taxa_resposta.toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-center p-3">
                      <span className={`text-xs px-2 py-1 rounded-full inline-flex items-center gap-1 ${getSentimentColor(city.sentimento_predominante)}`}>
                        {getSentimentEmoji(city.sentimento_predominante)}
                        {getSentimentLabel(city.sentimento_predominante)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Gráfico de Barras */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Taxa de Resposta por Cidade</CardTitle>
          <CardDescription>Comparação de performance entre cidades</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={geographicData.slice(0, 10)} margin={{ bottom: 80 }}>
              <defs>
                <linearGradient id="colorTaxaResposta" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.4}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="cidade" 
                angle={-45} 
                textAnchor="end" 
                height={100}
                stroke="#64748b"
                style={{ fontSize: '12px' }}
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
                fill="url(#colorTaxaResposta)" 
                animationDuration={1000}
                animationEasing="ease-out"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* Mapa do Paraná */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Mapa de Engajamento - Paraná</CardTitle>
          <CardDescription>Visualização geográfica do engajamento por cidade</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg overflow-hidden border border-slate-200" style={{ height: '500px', width: '100%' }}>
            <MapContainer 
              center={[-25.2521, -52.0215]} 
              zoom={7} 
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {geographicData.map((city, idx) => {
                const coords = PARANA_COORDS[city.cidade];
                if (!coords) return null;
                
                // Tamanho do círculo baseado no número de contatos
                const radius = Math.min(Math.max(city.total_contatos / 10, 8), 35);
                
                // Cor baseada na taxa de resposta
                const color = city.taxa_resposta > 15 ? '#10B981' : 
                             city.taxa_resposta > 10 ? '#FBBF24' : 
                             city.taxa_resposta > 5 ? '#F97316' : '#EF4444';
                
                return (
                  <CircleMarker
                    key={idx}
                    center={coords}
                    radius={radius}
                    fillColor={color}
                    fillOpacity={0.7}
                    color="#fff"
                    weight={2}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-bold text-lg mb-2">{city.cidade}</h3>
                        <div className="space-y-1 text-sm">
                          <p><strong>Contatos:</strong> {city.total_contatos.toLocaleString()}</p>
                          <p><strong>Mensagens:</strong> {city.mensagens_enviadas.toLocaleString()}</p>
                          <p><strong>Respostas:</strong> {city.mensagens_respondidas.toLocaleString()}</p>
                          <p><strong>Taxa:</strong> <span className="font-semibold text-blue-600">{city.taxa_resposta.toFixed(1)}%</span></p>
                          <p>
                            <strong>Sentimento:</strong>{' '}
                            <span className={`text-xs px-2 py-0.5 rounded ${getSentimentColor(city.sentimento_predominante)}`}>
                              {getSentimentEmoji(city.sentimento_predominante)} {getSentimentLabel(city.sentimento_predominante)}
                            </span>
                          </p>
                        </div>
                      </div>
                    </Popup>
                    <MapTooltip direction="top" offset={[0, -10]} opacity={0.9}>
                      <strong>{city.cidade}</strong>
                      <br />
                      Taxa: {city.taxa_resposta.toFixed(1)}%
                    </MapTooltip>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>
          
          {/* Legenda do Mapa */}
          <div className="mt-4 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span className="text-slate-600">&gt; 15% Taxa</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
              <span className="text-slate-600">10-15% Taxa</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-orange-500"></div>
              <span className="text-slate-600">5-10% Taxa</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span className="text-slate-600">&lt; 5% Taxa</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights Geográficos */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">📍 Insights Geográficos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {geographicData.length > 0 && (
              <>
                <p className="text-sm text-slate-700">
                  <strong>Melhor Cidade:</strong>{' '}
                  <span className="text-green-600 font-semibold">
                    {geographicData.sort((a, b) => b.taxa_resposta - a.taxa_resposta)[0]?.cidade}
                  </span>
                  {' '}com taxa de resposta de{' '}
                  <span className="text-green-600 font-semibold">
                    {geographicData.sort((a, b) => b.taxa_resposta - a.taxa_resposta)[0]?.taxa_resposta.toFixed(1)}%
                  </span>
                </p>
                <p className="text-sm text-slate-700">
                  <strong>Total de Cidades:</strong> {geographicData.length} cidades com dados
                </p>
                <p className="text-sm text-slate-700">
                  <strong>Total de Contatos:</strong>{' '}
                  {geographicData.reduce((acc, city) => acc + city.total_contatos, 0).toLocaleString()} contatos mapeados
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


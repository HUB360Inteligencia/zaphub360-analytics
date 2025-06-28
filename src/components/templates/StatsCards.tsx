
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Zap, Star, Variable } from 'lucide-react';

interface StatsCardsProps {
  totalTemplates: number;
  activeTemplates: number;
  mostUsedTemplate: string;
  mostUsedCount: number;
  categoriesCount: number;
}

export const StatsCards = ({ 
  totalTemplates, 
  activeTemplates, 
  mostUsedTemplate, 
  mostUsedCount, 
  categoriesCount 
}: StatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-white border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total de Templates</p>
              <p className="text-2xl font-bold text-slate-900">{totalTemplates}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Templates Ativos</p>
              <p className="text-2xl font-bold text-slate-900">{activeTemplates}</p>
            </div>
            <Zap className="w-8 h-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Mais Usado</p>
              <p className="text-2xl font-bold text-slate-900">{mostUsedTemplate}</p>
              <p className="text-xs text-slate-500">{mostUsedCount} usos</p>
            </div>
            <Star className="w-8 h-8 text-yellow-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Categorias</p>
              <p className="text-2xl font-bold text-slate-900">{categoriesCount}</p>
            </div>
            <Variable className="w-8 h-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

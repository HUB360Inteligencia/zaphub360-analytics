
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { MessageSquare, FileText } from 'lucide-react';
import { TemplateActions } from './TemplateActions';

interface Template {
  id: string; // Changed from number to string to match Supabase UUID
  name: string;
  description: string;
  category: string;
  content: string;
  variables: string[];
  usageCount: number;
  createdAt: string;
  lastUsed: string;
  isActive: boolean;
  tags: string[];
}

interface Category {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface TemplateCardProps {
  template: Template;
  category?: Category;
  categories: Category[];
  onPreview: (template: Template) => void;
  onUse?: (template: Template) => void;
}

export const TemplateCard = ({ template, category, categories, onPreview, onUse }: TemplateCardProps) => {
  const IconComponent = category?.icon || FileText;
  
  return (
    <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${category?.color}20`, color: category?.color }}
            >
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <CardDescription className="text-sm">{template.description}</CardDescription>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className="text-xs"
            style={{ borderColor: category?.color, color: category?.color }}
          >
            {category?.name}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Content Preview */}
        <div>
          <Label className="text-sm font-medium">Prévia do Conteúdo</Label>
          <div className="mt-1 p-3 bg-slate-50 rounded text-sm max-h-32 overflow-hidden">
            {template.content.substring(0, 150)}...
          </div>
        </div>

        {/* Variables */}
        <div>
          <Label className="text-sm font-medium">Variáveis ({template.variables.length})</Label>
          <div className="mt-1 flex flex-wrap gap-1">
            {template.variables.slice(0, 4).map(variable => (
              <Badge key={variable} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                {`{{${variable}}}`}
              </Badge>
            ))}
            {template.variables.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{template.variables.length - 4}
              </Badge>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex justify-between text-sm text-slate-600">
          <span>Usado {template.usageCount} vezes</span>
          <span>Criado em {new Date(template.createdAt).toLocaleDateString('pt-BR')}</span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {template.tags.slice(0, 3).map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-2 border-t">
          <TemplateActions 
            template={template}
            categories={categories}
            onPreview={onPreview}
          />
          <Button 
            size="sm" 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => onUse?.(template)}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Usar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

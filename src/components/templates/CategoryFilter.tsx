
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MESSAGE_CATEGORIES } from '@/lib/messageCategories';
import { Template } from '@/hooks/useTemplates';

interface CategoryFilterProps {
  templates: Template[];
  categoryFilter: string;
  setCategoryFilter: (filter: string) => void;
}

export const CategoryFilter = ({ 
  templates, 
  categoryFilter, 
  setCategoryFilter 
}: CategoryFilterProps) => {
  return (
    <Card className="bg-card border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={categoryFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCategoryFilter('all')}
          >
            Todas ({templates.length})
          </Button>
          {MESSAGE_CATEGORIES.map(category => {
            const count = templates.filter(t => t.category === category.id).length;
            const IconComponent = category.icon;
            const isSelected = categoryFilter === category.id;
            
            return (
              <Button
                key={category.id}
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategoryFilter(category.id)}
                className={`transition-all duration-200 ${
                  isSelected 
                    ? 'text-white border-0' 
                    : 'hover:bg-accent/10 border-border'
                }`}
                style={isSelected ? { 
                  backgroundColor: category.color,
                  borderColor: category.color 
                } : {}}
              >
                <IconComponent className="w-4 h-4 mr-2" />
                {category.name} ({count})
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

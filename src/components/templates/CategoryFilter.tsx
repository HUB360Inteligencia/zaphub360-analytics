
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Category {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface Template {
  category: string;
}

interface CategoryFilterProps {
  categories: Category[];
  templates: Template[];
  categoryFilter: string;
  setCategoryFilter: (filter: string) => void;
}

export const CategoryFilter = ({ 
  categories, 
  templates, 
  categoryFilter, 
  setCategoryFilter 
}: CategoryFilterProps) => {
  return (
    <Card className="bg-white border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={categoryFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCategoryFilter('all')}
            className={categoryFilter === 'all' ? 'bg-slate-900' : ''}
          >
            Todas ({templates.length})
          </Button>
          {categories.map(category => {
            const count = templates.filter(t => t.category === category.id).length;
            const IconComponent = category.icon;
            return (
              <Button
                key={category.id}
                variant={categoryFilter === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategoryFilter(category.id)}
                className={categoryFilter === category.id ? '' : 'hover:bg-slate-50'}
                style={categoryFilter === category.id ? { backgroundColor: category.color } : {}}
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

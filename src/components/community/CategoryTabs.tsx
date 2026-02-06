// Category Tabs Component for filtering activities
import { motion } from 'framer-motion';

interface CategoryTab {
  value: string;
  label: string;
  icon: string;
  count?: number;
}

interface CategoryTabsProps {
  categories: CategoryTab[];
  selected: string;
  onChange: (value: string) => void;
}

export const CategoryTabs = ({ categories, selected, onChange }: CategoryTabsProps) => {
  return (
    <div className="relative">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => onChange(cat.value)}
            className={`relative px-4 py-2.5 rounded-xl whitespace-nowrap transition-all text-sm flex items-center gap-2 ${
              selected === cat.value
                ? 'text-primary-foreground'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
            }`}
          >
            {selected === cat.value && (
              <motion.div
                layoutId="categoryBg"
                className="absolute inset-0 bg-primary rounded-xl"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
              />
            )}
            <span className="relative z-10">{cat.icon}</span>
            <span className="relative z-10 font-medium">{cat.label}</span>
            {cat.count !== undefined && cat.count > 0 && (
              <span className={`relative z-10 text-xs px-1.5 py-0.5 rounded-full ${
                selected === cat.value 
                  ? 'bg-primary-foreground/20 text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {cat.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryTabs;

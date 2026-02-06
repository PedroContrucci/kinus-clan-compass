// Filter Chips Component — Horizontal scrollable chips for filtering
import { motion } from 'framer-motion';

interface FilterChip {
  value: string;
  label: string;
  icon?: string;
  count?: number;
}

interface FilterChipsProps {
  chips: FilterChip[];
  selected: string;
  onChange: (value: string) => void;
}

export const FilterChips = ({ chips, selected, onChange }: FilterChipsProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
      {chips.map((chip) => (
        <button
          key={chip.value}
          onClick={() => onChange(chip.value)}
          className={`relative px-4 py-2 rounded-full whitespace-nowrap transition-all text-sm flex items-center gap-1.5 flex-shrink-0 ${
            selected === chip.value
              ? 'text-primary-foreground'
              : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
          }`}
        >
          {selected === chip.value && (
            <motion.div
              layoutId="filterChipBg"
              className="absolute inset-0 bg-primary rounded-full"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
            />
          )}
          {chip.icon && <span className="relative z-10">{chip.icon}</span>}
          <span className="relative z-10 font-medium">{chip.label}</span>
          {chip.count !== undefined && chip.count > 0 && (
            <span className={`relative z-10 text-[10px] px-1.5 py-0.5 rounded-full ${
              selected === chip.value 
                ? 'bg-primary-foreground/20 text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}>
              {chip.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default FilterChips;

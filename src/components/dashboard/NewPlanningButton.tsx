// NewPlanningButton — CTA for new planning

import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NewPlanningButtonProps {
  className?: string;
}

export const NewPlanningButton = ({ className = '' }: NewPlanningButtonProps) => {
  const navigate = useNavigate();

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate('/planejar')}
      className={`w-full flex items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-4 px-6 rounded-xl shadow-lg shadow-emerald-500/20 transition-colors ${className}`}
    >
      <Plus size={22} strokeWidth={2.5} />
      <span className="font-['Outfit'] text-lg">Novo Planejamento</span>
    </motion.button>
  );
};

export default NewPlanningButton;

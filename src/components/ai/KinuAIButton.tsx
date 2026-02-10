import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { useKinuAI } from "@/contexts/KinuAIContext";

export function KinuAIButton() {
  const { setIsOpen, insights, isEmergencyMode } = useKinuAI();
  const unreadInsights = insights.length;
  const hasHighPriority = insights.some(i => i.priority === "high");

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setIsOpen(true)}
      className={`fixed bottom-24 right-4 z-[60] w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors ${
        isEmergencyMode
          ? "bg-red-500 shadow-red-500/30"
          : "bg-emerald-500 shadow-emerald-500/30 hover:bg-emerald-600"
      }`}
    >
      {/* KINU Icon */}
      <span className="text-2xl">🌿</span>

      {/* Notification Badge */}
      {unreadInsights > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 text-[10px] font-bold text-[#0f172a] flex items-center justify-center"
        >
          {unreadInsights}
        </motion.span>
      )}

      {/* Pulse animation for high priority */}
      {hasHighPriority && (
        <motion.div
          className="absolute inset-0 rounded-full bg-emerald-500"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
    </motion.button>
  );
}

export default KinuAIButton;

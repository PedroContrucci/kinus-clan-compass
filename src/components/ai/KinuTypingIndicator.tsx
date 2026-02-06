import { motion } from "framer-motion";

export function KinuTypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-[#0f172a] border-l-4 border-emerald-500 rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm">🌿</span>
          <span className="text-xs font-medium text-emerald-400">KINU</span>
        </div>
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-2 h-2 rounded-full bg-emerald-400"
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default KinuTypingIndicator;

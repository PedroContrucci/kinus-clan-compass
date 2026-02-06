import { useState } from 'react';
import { motion } from 'framer-motion';
import { useDestinationPhoto, getFallbackStyles } from '@/hooks/useUnsplash';

interface UnsplashImageProps {
  query: string;
  category?: string;
  alt?: string;
  className?: string;
  showCredit?: boolean;
  creditPosition?: 'bottom-left' | 'bottom-right';
  fallbackClassName?: string;
  onLoad?: () => void;
}

export const UnsplashImage = ({
  query,
  category,
  alt,
  className = '',
  showCredit = true,
  creditPosition = 'bottom-right',
  fallbackClassName = '',
  onLoad,
}: UnsplashImageProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { imageUrl, credit, loading, fallbackGradient, fallbackEmoji, backgroundColor } = 
    useDestinationPhoto(query, category);

  const handleImageLoad = () => {
    setImageLoaded(true);
    onLoad?.();
  };

  const handleImageError = () => {
    setImageError(true);
  };

  // Show fallback if no image or error
  if (!imageUrl || imageError) {
    const styles = getFallbackStyles(category);
    return (
      <div 
        className={`relative flex items-center justify-center bg-gradient-to-br ${styles.gradient} ${className} ${fallbackClassName}`}
      >
        <span className="text-4xl opacity-60">{styles.emoji}</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ backgroundColor }}>
      {/* Loading skeleton */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}

      {/* Image */}
      <motion.img
        src={imageUrl}
        alt={alt || query}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        initial={{ opacity: 0 }}
        animate={{ opacity: imageLoaded ? 1 : 0 }}
      />

      {/* Credit overlay */}
      {showCredit && credit && imageLoaded && (
        <a
          href={credit.photoLink}
          target="_blank"
          rel="noopener noreferrer"
          className={`absolute ${
            creditPosition === 'bottom-left' ? 'bottom-1 left-1' : 'bottom-1 right-1'
          } text-[9px] text-white/60 hover:text-white/90 transition-colors bg-black/30 backdrop-blur-sm px-1.5 py-0.5 rounded`}
        >
          📷 {credit.name}
        </a>
      )}
    </div>
  );
};

// Simple image component without credit (for cards where space is limited)
export const UnsplashThumbnail = ({
  query,
  category,
  alt,
  className = '',
}: {
  query: string;
  category?: string;
  alt?: string;
  className?: string;
}) => {
  return (
    <UnsplashImage
      query={query}
      category={category}
      alt={alt}
      className={className}
      showCredit={false}
    />
  );
};

export default UnsplashImage;

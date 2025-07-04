'use client';

import { ShareIcon } from "lucide-react";
import { Button } from "./button";

interface ShareButtonProps {
  title?: string;
  text?: string;
  url?: string;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  children?: React.ReactNode;
}

export function ShareButton({ 
  title = "Mister White - Juego de Deducción Social",
  text = "¡Descubre este increíble juego multijugador online!",
  url,
  className,
  size = "lg",
  variant = "outline",
  children
}: ShareButtonProps) {
  const handleShare = async () => {
    const shareUrl = url || window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url: shareUrl
        });
      } catch (error) {
        // User cancelled or error occurred
        console.log('Share cancelled or failed:', error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copiado al portapapeles');
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        // Ultimate fallback: show the URL
        prompt('Copia este enlace:', shareUrl);
      }
    }
  };

  return (
    <Button 
      variant={variant} 
      size={size} 
      className={className}
      onClick={handleShare}
    >
      {children || (
        <>
          <ShareIcon className="mr-2 h-5 w-5" />
          Compartir con Amigos
        </>
      )}
    </Button>
  );
}

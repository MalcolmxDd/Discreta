import { Zap, Gem, Droplets, HeartHandshake, Shirt, Leaf } from "lucide-react";
import type { ReactNode } from "react";

export const categoryIcons: Record<string, ReactNode> = {
  vibradores: <Zap size={16} />,
  dildos: <Gem size={16} />,
  lubricantes: <Droplets size={16} />,
  parejas: <HeartHandshake size={16} />,
  lenceria: <Shirt size={16} />,
  bienestar: <Leaf size={16} />,
};

export const categoryIconsSmall: Record<string, ReactNode> = {
  vibradores: <Zap size={14} />,
  dildos: <Gem size={14} />,
  lubricantes: <Droplets size={14} />,
  parejas: <HeartHandshake size={14} />,
  lenceria: <Shirt size={14} />,
  bienestar: <Leaf size={14} />,
};

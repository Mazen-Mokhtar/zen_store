// صور خلفية مختلفة للفئات
export const categoryHeroImages = {
  steam: [
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1486572788966-cfd3df1f5b42?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=1920&q=80"
  ],
  action: [
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1486572788966-cfd3df1f5b42?auto=format&fit=crop&w=1920&q=80"
  ],
  adventure: [
    "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80"
  ],
  subscription: [
    "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1556742044-3c52d6e88c62?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1556742045-0cfed4f6a45d?auto=format&fit=crop&w=1920&q=80"
  ],
  default: [
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=1920&q=80"
  ]
};

// تحديد نوع الفئة للحصول على الصور المناسبة
export const getCategoryType = (name: string): keyof typeof categoryHeroImages => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('steam') || lowerName.includes('ستيم')) return 'steam';
  if (lowerName.includes('action') || lowerName.includes('قتال')) return 'action';
  if (lowerName.includes('adventure') || lowerName.includes('مغامرة')) return 'adventure';
  if (lowerName.includes('subscription') || lowerName.includes('اشتراك')) return 'subscription';
  return 'default';
};

// Sort options for games
export const sortOptions = [
  { value: 'name', label: 'الاسم' },
  { value: 'popular', label: 'الأكثر شعبية' },
  { value: 'newest', label: 'الأحدث' }
] as const;

export type SortBy = 'name' | 'popular' | 'newest';
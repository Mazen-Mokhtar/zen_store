# Category Dashboard Page

## نظرة عامة
صفحة Category Dashboard هي نسخة محسنة من صفحة Dashboard الرئيسية، مصممة خصيصاً لعرض الألعاب حسب الفئات المحددة.

## المميزات

### 🎯 مخصصة للفئات
- عرض الألعاب حسب الفئة المحددة
- صور خلفية مختلفة حسب نوع الفئة (Steam, Action, Adventure, Subscription, Default)
- عنوان ديناميكي يعرض اسم الفئة
- دعم خاص لفئات Steam مع وصف مخصص

### 🔍 البحث والتصفية
- شريط بحث للعثور على ألعاب محددة
- خيارات ترتيب متعددة:
  - ترتيب بالاسم
  - الأكثر شعبية
  - الأحدث

### 🎮 عرض الألعاب
- قسم الألعاب الشائعة في الفئة
- قسم جميع الألعاب في الفئة
- عداد الألعاب المتاحة
- تأثيرات بصرية محسنة (hover effects)
- **نقر تفاعلي**: عند النقر على لعبة، يتغير الكرت ليظهر السعر وزر "Buy Now"
- **جلب الباقات**: يتم جلب باقات اللعبة تلقائياً عند تحديدها
- **عرض الأسعار**: عرض السعر النهائي والسعر الأصلي (في حالة العروض)

### 🎨 تصميم محسن
- Header مع زر رجوع
- Hero section مع carousel للصور
- تصميم متجاوب للجميع الأجهزة
- دعم اللغات المتعددة

## كيفية الاستخدام

### الانتقال للصفحة
```javascript
// من صفحة أخرى
router.push(`/category-dashboard?category=${categoryId}&name=${categoryName}`);

// مثال
router.push('/category-dashboard?category=68847d21bcb9d10e1b12e76a&name=ألعاب القتال');
```

### المعاملات المطلوبة
- `category`: معرف الفئة (مطلوب)
- `name`: اسم الفئة (اختياري، الافتراضي: "الفئة المحددة")

### مثال على الاستخدام
```javascript
// في صفحة الفئات
const handleCategoryClick = (category) => {
  router.push(`/category-dashboard?category=${category._id}&name=${category.name}`);
};
```

## الاختلافات عن Dashboard الرئيسي

| الميزة | Dashboard الرئيسي | Category Dashboard |
|--------|------------------|-------------------|
| الفئة | جميع الألعاب | فئة محددة |
| البحث | ❌ | ✅ |
| الترتيب | ❌ | ✅ |
| زر الرجوع | ❌ | ✅ |
| الصور الخلفية | ثابتة | حسب نوع الفئة |
| العنوان | ثابت | ديناميكي |
| دعم Steam | ❌ | ✅ |
| نقر تفاعلي على الألعاب | ❌ | ✅ |
| عرض الأسعار والباقات | ❌ | ✅ |

## الملفات المرتبطة

- `page.tsx` - الصفحة الرئيسية
- `layout.tsx` - تخطيط الصفحة
- `README.md` - هذا الملف

## الترجمة

الصفحة تدعم الترجمة التلقائية مع إضافة الترجمات التالية:

```typescript
dashboard: {
  exploreGames: 'استكشف الألعاب',
  loadMore: 'تحميل المزيد',
  gamesAvailable: 'لعبة متاحة',
  searchGames: 'البحث في الألعاب...',
  sortByName: 'ترتيب بالاسم',
  sortByPopular: 'الأكثر شعبية',
  sortByNewest: 'الأحدث',
  noGamesMatchSearch: 'لا توجد ألعاب تطابق البحث',
  tryDifferentSearch: 'جرب البحث بكلمات مختلفة',
  allGamesInCategory: 'جميع ألعاب',
}
```

## التخصيص

### إضافة أنواع فئات جديدة
```javascript
const categoryHeroImages = {
  steam: [...],
  action: [...],
  adventure: [...],
  subscription: [...],
  puzzle: [
    "https://images.unsplash.com/photo-...",
    "https://images.unsplash.com/photo-...",
    "https://images.unsplash.com/photo-..."
  ],
  default: [...]
};
```

### تعديل منطق تحديد نوع الفئة
```javascript
const getCategoryType = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('steam') || lowerName.includes('ستيم')) return 'steam';
  if (lowerName.includes('puzzle') || lowerName.includes('لغز')) return 'puzzle';
  // ... باقي الأنواع
  return 'default';
};
```

### دعم Steam
```javascript
// في مكون GlareCardDemo
const isSteamCategory = category.type === 'steam' || 
                       category.name.toLowerCase().includes('steam') ||
                       category.name.toLowerCase().includes('ستيم');

if (isSteamCategory) {
  router.push(`/category-dashboard?category=${category._id}&name=${encodeURIComponent(category.name)}`);
} else {
  router.push(`/dashboard?category=${category._id}`);
}
``` 
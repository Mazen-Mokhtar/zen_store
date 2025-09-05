import { settingsManager } from './settings';

export interface Translation {
  [key: string]: string | Translation;
}

export interface Language {
  code: string;
  name: string;
  flag: string;
  direction: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸', direction: 'ltr' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', direction: 'rtl' },
  { code: 'pt', name: 'Português', flag: '🇧🇷', direction: 'ltr' },
  { code: 'es', name: 'Español', flag: '🇪🇸', direction: 'ltr' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', direction: 'ltr' },
];

// Translations
const translations: Record<string, Translation> = {
  en: {
    common: {
      loading: 'Loading...',
      error: 'Error',
      retry: 'Try Again',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      search: 'Search',
      filter: 'Filter',
      sort: 'Sort',
      view: 'View',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      submit: 'Submit',
      reset: 'Reset',
      confirm: 'Confirm',
      yes: 'Yes',
      no: 'No',
      ok: 'OK',
    },
    dashboard: {
      title: 'Dashboard',
      popular: 'Popular',
      mobileGames: 'Mobile Games',
      seeAll: 'See All',
       showLess: 'Show Less',
       buyNow: 'Buy Now',
      newUltraSkin: 'NEW ULTRA SKIN & VARIOUS REWARDS',
      bloodStrike: 'Blood Strike',
      endex: 'ENDEX',
      storeDescription: 'A loja de recargas que estará sempre à sua disposição.',
      enter: 'Enter',
      filteredBy: 'Filtered by',
      clearFilter: 'Clear Filter',
      noGamesInCategory: 'No games found in this category',
      tryDifferentCategory: 'Try selecting a different category',
      exploreGames: 'Explore Games',
      loadMore: 'Load More',
      gamesAvailable: 'games available',
      searchGames: 'Search games...',
      sortByName: 'Sort by name',
      sortByPopular: 'Most popular',
      sortByNewest: 'Newest',
      noGamesMatchSearch: 'No games match your search',
      tryDifferentSearch: 'Try searching with different keywords',
      allGamesInCategory: 'All games in',
      steamGames: 'Steam Games',
      steamDescription: 'Discover the best Steam games and digital content',
      loading: 'Loading...',
      noPackagesAvailable: 'No packages available',
    },
    orders: {
      title: 'My Orders',
      myOrders: 'My Orders',
      orderDetails: 'Order Details',
      orderNumber: 'Order Number',
      orderDate: 'Order Date',
      orderStatus: 'Order Status',
      paymentMethod: 'Payment Method',
      totalAmount: 'Total Amount',
      accountInfo: 'Account Information',
      adminNote: 'Admin Note',
      orderTimeline: 'Order Timeline',
      refundInfo: 'Refund Information',
      refundAmount: 'Refund Amount',
      refundDate: 'Refund Date',
      cancelOrder: 'Cancel Order',
      viewDetails: 'View Details',
      noOrders: 'No Orders',
      noOrdersDescription: 'You haven\'t created any orders yet',
      browseGames: 'Browse Games',
      orderCreated: 'Order Created',
      orderPaid: 'Order Paid',
      orderDelivered: 'Order Delivered',
      orderRejected: 'Order Rejected',
      cardPayment: 'Credit Card',
      cashPayment: 'Cash Payment',
      status: {
        pending: 'Pending',
        paid: 'Paid',
        delivered: 'Delivered',
        rejected: 'Rejected'
      },
      statusDescription: {
        pending: 'Your order is under review and will be processed soon',
        paid: 'Payment received and order is being processed',
        delivered: 'Your order has been delivered successfully',
        rejected: 'Order has been rejected'
      }
    },
    navigation: {
      home: 'Home',
      games: 'Games',
      packages: 'Packages',
      categories: 'Categories',
      profile: 'Profile',
      settings: 'Settings',
      help: 'Help',
      about: 'About',
    },
    errors: {
      networkError: 'Network error. Please check your connection.',
      serverError: 'Internal server error. Please try again later.',
      notFound: 'The requested resource was not found.',
      unauthorized: 'You are not authorized to access this resource.',
      forbidden: 'Access to this resource is forbidden.',
      unknownError: 'An unexpected error occurred.',
      dataLoadFailed: 'Failed to load data. Please try again later.',
      categoryDashboard: {
        categoryIdRequired: 'Category ID is required',
        invalidCategoryId: 'Invalid category ID. Please choose a valid category.',
      },
    },
    notifications: {
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      info: 'Information',
      dataLoaded: 'Data loaded successfully',
      dataLoadFailed: 'Failed to load data',
      connectionRestored: 'Connection restored',
      connectionLost: 'Connection lost',
    },
  },
  ar: {
    common: {
      loading: 'جاري التحميل...',
      error: 'خطأ',
      retry: 'حاول مرة أخرى',
      cancel: 'إلغاء',
      save: 'حفظ',
      delete: 'حذف',
      edit: 'تعديل',
      add: 'إضافة',
      search: 'بحث',
      filter: 'تصفية',
      sort: 'ترتيب',
      view: 'عرض',
      close: 'إغلاق',
      back: 'رجوع',
      next: 'التالي',
      previous: 'السابق',
      submit: 'إرسال',
      reset: 'إعادة تعيين',
      confirm: 'تأكيد',
      yes: 'نعم',
      no: 'لا',
      ok: 'موافق',
    },
    dashboard: {
      title: 'لوحة التحكم',
      popular: 'شائع',
      mobileGames: 'ألعاب الهاتف المحمول',
      seeAll: 'عرض الكل',
      showLess: 'عرض أقل',
      buyNow: 'اشتر الآن',
      newUltraSkin: 'جلد فائق جديد ومكافآت متنوعة',
      bloodStrike: 'ضربة الدم',
      endex: 'إندكس',
      storeDescription: 'متجر الشحنات الذي سيكون دائماً تحت تصرفك.',
      enter: 'دخول',
      filteredBy: 'مفلتر بواسطة',
      clearFilter: 'إزالة الفلتر',
      noGamesInCategory: 'لا توجد ألعاب في هذه الفئة',
      tryDifferentCategory: 'جرب اختيار فئة مختلفة',
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
      steamGames: 'ألعاب ستيم',
      steamDescription: 'اكتشف أفضل ألعاب ستيم والمحتوى الرقمي',
      loading: 'جاري التحميل...',
      noPackagesAvailable: 'لا توجد باقات متاحة',
      viewDetails: 'عرض التفاصيل',
      steamGameDetails: 'تفاصيل لعبة ستيم',
      aboutThisGame: 'حول هذه اللعبة',
      gameTrailer: 'عرض اللعبة',
      screenshots: 'لقطات الشاشة',
      gameInformation: 'معلومات اللعبة',
      requiredInformation: 'المعلومات المطلوبة',
      securePurchase: 'شراء آمن',
      completePurchase: 'إتمام الشراء',
      accountInformation: 'معلومات الحساب',
    },
    orders: {
      title: 'طلباتي',
      myOrders: 'طلباتي',
      orderDetails: 'تفاصيل الطلب',
      orderNumber: 'رقم الطلب',
      orderDate: 'تاريخ الطلب',
      orderStatus: 'حالة الطلب',
      paymentMethod: 'طريقة الدفع',
      totalAmount: 'المبلغ الإجمالي',
      accountInfo: 'معلومات الحساب',
      adminNote: 'ملاحظة الإدارة',
      orderTimeline: 'تاريخ الطلب',
      refundInfo: 'معلومات الاسترداد',
      refundAmount: 'مبلغ الاسترداد',
      refundDate: 'تاريخ الاسترداد',
      cancelOrder: 'إلغاء الطلب',
      viewDetails: 'عرض التفاصيل',
      noOrders: 'لا توجد طلبات',
      noOrdersDescription: 'لم تقم بإنشاء أي طلبات بعد',
      browseGames: 'تصفح الألعاب',
      orderCreated: 'تم إنشاء الطلب',
      orderPaid: 'تم الدفع',
      orderDelivered: 'تم التسليم',
      orderRejected: 'تم الرفض/الإلغاء',
      cardPayment: 'بطاقة ائتمان',
      cashPayment: 'دفع نقدي',
      status: {
        pending: 'قيد الانتظار',
        paid: 'مدفوع',
        delivered: 'تم التسليم',
        rejected: 'مرفوض'
      },
      statusDescription: {
        pending: 'طلبك قيد المراجعة وسيتم معالجته قريباً',
        paid: 'تم استلام الدفع وجاري معالجة الطلب',
        delivered: 'تم تسليم طلبك بنجاح',
        rejected: 'تم رفض أو إلغاء الطلب'
      }
    },
    navigation: {
      home: 'الرئيسية',
      games: 'الألعاب',
      packages: 'الحزم',
      categories: 'الفئات',
      profile: 'الملف الشخصي',
      settings: 'الإعدادات',
      help: 'المساعدة',
      about: 'حول',
    },
    errors: {
      networkError: 'خطأ في الشبكة. يرجى التحقق من الاتصال.',
      serverError: 'خطأ داخلي في الخادم. حاول مرة أخرى لاحقًا.',
      notFound: 'المورد المطلوب غير موجود.',
      unauthorized: 'غير مخول للوصول إلى هذا المورد.',
      forbidden: 'الوصول إلى هذا المورد محظور.',
      unknownError: 'حدث خطأ غير متوقع.',
      dataLoadFailed: 'فشل في تحميل البيانات. حاول مرة أخرى لاحقًا.',
      categoryDashboard: {
        categoryIdRequired: 'معرّف الفئة مطلوب',
        invalidCategoryId: 'معرّف الفئة غير صالح. يرجى اختيار فئة صالحة.',
      },
    },
    notifications: {
      success: 'نجح',
      error: 'خطأ',
      warning: 'تحذير',
      info: 'معلومات',
      dataLoaded: 'تم تحميل البيانات بنجاح',
      dataLoadFailed: 'فشل في تحميل البيانات',
      connectionRestored: 'تم استعادة الاتصال',
      connectionLost: 'فقد الاتصال',
    },
  },
  pt: {
    common: {
      loading: 'Carregando...',
      error: 'Erro',
      retry: 'Tentar Novamente',
      cancel: 'Cancelar',
      save: 'Salvar',
      delete: 'Excluir',
      edit: 'Editar',
      add: 'Adicionar',
      search: 'Pesquisar',
      filter: 'Filtrar',
      sort: 'Ordenar',
      view: 'Visualizar',
      close: 'Fechar',
      back: 'Voltar',
      next: 'Próximo',
      previous: 'Anterior',
      submit: 'Enviar',
      reset: 'Redefinir',
      confirm: 'Confirmar',
      yes: 'Sim',
      no: 'Não',
      ok: 'OK',
    },
    dashboard: {
      title: 'Painel',
      popular: 'Populares',
      mobileGames: 'Jogos Mobile',
      seeAll: 'Ver todos',
      buyNow: 'Comprar agora',
      newUltraSkin: 'NOVA SKIN ULTRA E VÁRIAS RECOMPENSAS',
      bloodStrike: 'Blood Strike',
      endex: 'ENDEX',
      storeDescription: 'A loja de recargas que estará sempre à sua disposição.',
      enter: 'Entrar',
      filteredBy: 'Filtrado por',
      clearFilter: 'Limpar Filtro',
      noGamesInCategory: 'Nenhum jogo encontrado nesta categoria',
      tryDifferentCategory: 'Tente selecionar uma categoria diferente',
    },
    navigation: {
      home: 'Início',
      games: 'Jogos',
      packages: 'Pacotes',
      categories: 'Categorias',
      profile: 'Perfil',
      settings: 'Configurações',
      help: 'Ajuda',
      about: 'Sobre',
    },
    errors: {
      networkError: 'Erro de rede. Verifique sua conexão.',
      serverError: 'Erro interno do servidor. Tente novamente mais tarde.',
      notFound: 'O recurso solicitado não foi encontrado.',
      unauthorized: 'Você não está autorizado a acessar este recurso.',
      forbidden: 'Acesso a este recurso é proibido.',
      unknownError: 'Ocorreu um erro inesperado.',
      dataLoadFailed: 'Falha ao carregar dados. Tente novamente mais tarde.',
      categoryDashboard: {
        categoryIdRequired: 'É necessário o ID da categoria',
        invalidCategoryId: 'ID de categoria inválido. Por favor, escolha uma categoria válida.',
      },
    },
    notifications: {
      success: 'Sucesso',
      error: 'Erro',
      warning: 'Aviso',
      info: 'Informação',
      dataLoaded: 'Dados carregados com sucesso',
      dataLoadFailed: 'Falha ao carregar dados',
      connectionRestored: 'Conexão restaurada',
      connectionLost: 'Conexão perdida',
    },
  },
};

class I18nManager {
  private currentLanguage: string;

  constructor() {
    this.currentLanguage = settingsManager.get('language');
    this.applyLanguage();
  }

  private applyLanguage() {
    if (typeof window === 'undefined') return;

    const language = this.getCurrentLanguage();
    document.documentElement.lang = language.code;
    document.documentElement.dir = language.direction;
  }

  getCurrentLanguage(): Language {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === this.currentLanguage) || SUPPORTED_LANGUAGES[0];
  }

  setLanguage(languageCode: string) {
    const language = SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode);
    if (language) {
      this.currentLanguage = languageCode;
      settingsManager.set('language', languageCode);
      this.applyLanguage();
    }
  }

  t(key: string, params?: Record<string, string>): string {
    const keys = key.split('.');
    let value: any = translations[this.currentLanguage] || translations['en'];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English
        value = this.getFallbackValue(key);
        break;
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    // Replace parameters
    if (params) {
      return value.replace(/\{(\w+)\}/g, (match, param) => {
        return params[param] || match;
      });
    }

    return value;
  }

  private getFallbackValue(key: string): string {
    const keys = key.split('.');
    let value: any = translations['en'];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }

    return typeof value === 'string' ? value : key;
  }

  getSupportedLanguages(): Language[] {
    return SUPPORTED_LANGUAGES;
  }

  isRTL(): boolean {
    return this.getCurrentLanguage().direction === 'rtl';
  }

  formatNumber(number: number): string {
    const language = this.getCurrentLanguage();
    return new Intl.NumberFormat(language.code).format(number);
  }

  formatDate(date: Date): string {
    const language = this.getCurrentLanguage();
    return new Intl.DateTimeFormat(language.code).format(date);
  }

  formatCurrency(amount: number, currency: string = 'USD'): string {
    const language = this.getCurrentLanguage();
    return new Intl.NumberFormat(language.code, {
      style: 'currency',
      currency,
    }).format(amount);
  }
}

export const i18n = new I18nManager();

// React hook for translations
export const useTranslation = () => {
  const { useMemo } = require('react');
  
  return useMemo(() => ({
    t: i18n.t.bind(i18n),
    currentLanguage: i18n.getCurrentLanguage(),
    setLanguage: i18n.setLanguage.bind(i18n),
    isRTL: i18n.isRTL.bind(i18n),
    supportedLanguages: i18n.getSupportedLanguages(),
  }), []);
};
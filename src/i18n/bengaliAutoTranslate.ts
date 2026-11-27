import type { LanguageCode } from './translations';

/**
 * Smart Bengali localization helpers for dynamic catalog entities (product names,
 * descriptions, variants, order statuses, payment methods, dates, and store places)
 * when explicit Admin Bengali translations are not manually entered.
 *
 * English remains 100% untouched when lang === 'en'.
 */

const EXACT_BENGALI_PHRASES: Record<string, string> = {
  // Categories & Collections
  'all gifts': 'সব উপহার',
  'photo frame': 'ফটো ফ্রেম',
  'photo frames': 'ফটো ফ্রেম',
  'coffee mug': 'কফি মগ',
  'coffee mugs': 'কফি মগ',
  't-shirt print': 'টি-শার্ট প্রিন্ট',
  't-shirt prints': 'টি-শার্ট প্রিন্ট',
  'tshirt prints': 'টি-শার্ট প্রিন্ট',
  'home decor': 'হোম ডেকর',
  'hand made': 'হ্যান্ড মেইড',
  handmade: 'হ্যান্ড মেইড',
  keychain: 'কী-চেইন',
  keychains: 'কী-চেইন',
  'key chain': 'কী-চেইন',
  'key chains': 'কী-চেইন',
  'gifts bag + box': 'গিফট ব্যাগ ও বক্স',
  'gift bag + box': 'গিফট ব্যাগ ও বক্স',
  'gift hamper box': 'গিফট হ্যাম্পার বক্স',
  'led lighting': 'এলইডি লাইটিং',
  'led lamp': 'এলইডি ল্যাম্প',
  'led lamps': 'এলইডি ল্যাম্প',
  'pvc card': 'পিভিসি কার্ড',
  'pvc cards': 'পিভিসি কার্ড',
  'custom bottles': 'কাস্টম বোতল',
  'customized gifts': 'কাস্টমাইজড উপহার',
  'personalized gifts': 'পার্সোনালাইজড উপহার',
  'corporate gifts': 'কর্পোরেট উপহার',
  'couple gifts': 'কাপল উপহার',

  // Common GiftKart Product Names
  'customized magic photo mug': 'কাস্টমাইজড ম্যাজিক ফটো মগ',
  'personalized coffee mug': 'পার্সোনালাইজড কফি মগ',
  'wooden collage photo frame': 'উডেন কোলাজ ফটো ফ্রেম',
  'led glowing photo frame': 'এলইডি গ্লোয়িং ফটো ফ্রেম',
  'custom printed cotton t-shirt': 'কাস্টম প্রিন্টেড কটন টি-শার্ট',
  'acrylic name keychain': 'অ্যাক্রিলিক নেম কী-চেইন',
  'wooden photo keychain': 'উডেন ফটো কী-চেইন',
  'premium gift hamper box': 'প্রিমিয়াম গিফট হ্যাম্পার বক্স',
  'handmade explosion gift box': 'হ্যান্ডমেইড এক্সপ্লোশন গিফট বক্স',
  'custom heart cushion': 'কাস্টম হার্ট কুশন',
  'personalized water bottle': 'পার্সোনালাইজড ওয়াটার বোতল',
  'couple name led lamp': 'কাপল নেম এলইডি ল্যাম্প',

  // Variant Group Names & Options
  size: 'সাইজ',
  color: 'রঙ',
  colour: 'রঙ',
  finish: 'ফিনিশ',
  style: 'স্টাইল',
  material: 'উপাদান',
  pack: 'প্যাক',
  shape: 'আকৃতি',
  type: 'ধরন',
  black: 'কালো',
  white: 'সাদা',
  red: 'লাল',
  pink: 'গোলাপি',
  purple: 'বেগুনি',
  blue: 'নীল',
  green: 'সবুজ',
  yellow: 'হলুদ',
  gold: 'সোনালী',
  golden: 'সোনালী',
  silver: 'রুপালী',
  brown: 'বাদামী',
  wooden: 'কাঠের',
  wood: 'কাঠ',
  acrylic: 'অ্যাক্রিলিক',
  metal: 'মেটাল',
  glass: 'কাঁচ',
  ceramic: 'সিরামিক',
  cotton: 'সুতি',
  matte: 'ম্যাট',
  glossy: 'গ্লসি',
  small: 'ছোট (S)',
  medium: 'মাঝারি (M)',
  large: 'বড় (L)',
  standard: 'স্ট্যান্ডার্ড',
  premium: 'প্রিমিয়াম',
  classic: 'ক্লাসিক',
  heart: 'হার্ট শেপ',
  round: 'গোল',
  square: 'চৌকো',
  rectangle: 'আয়তাকার',
  single: 'সিঙ্গেল',
  'pack of 2': '২টির প্যাক',
  'pack of 3': '৩টির প্যাক',
  'pack of 4': '৪টির প্যাক',
  'warm white': 'ওয়ার্ম হোয়াইট',
  'multi color': 'মাল্টি কালার',
  multicolor: 'মাল্টি কালার',

  // Locations & Store Info
  jalchak: 'জলচক',
  'paschim medinipur': 'পশ্চিম মেদিনীপুর',
  'west bengal': 'পশ্চিমবঙ্গ',
  'jalchak, west bengal': 'জলচক, পশ্চিমবঙ্গ',
  'jalchak, paschim medinipur, wb': 'জলচক, পশ্চিম মেদিনীপুর, পশ্চিমবঙ্গ',
  'jalchak, paschim medinipur, west bengal': 'জলচক, পশ্চিম মেদিনীপুর, পশ্চিমবঙ্গ',
  kolkata: 'কলকাতা',
  medinipur: 'মেদিনীপুর',
  kharagpur: 'খড়্গপুর',
  india: 'ভারত',

  // Gift Wrap Styles
  'classic festive wrap': 'ক্লাসিক ফেস্টিভ র‍্যাপ',
  'royal purple silk wrap': 'রয়্যাল পার্পল সিল্ক র‍্যাপ',
  'luxury pink ribbon box': 'লাক্সারি পিঙ্ক রিবন বক্স',
  'minimal kraft eco wrap': 'মিনিমাল ক্রাফট ইকো র‍্যাপ',
  'standard gift wrap': 'স্ট্যান্ডার্ড গিফট র‍্যাপ',
  'premium gift wrap': 'প্রিমিয়াম গিফট র‍্যাপ',
  'birthday theme wrap': 'জন্মদিনের থিম র‍্যাপ',
  'anniversary special wrap': 'বার্ষিকী স্পেশাল র‍্যাপ',
};

const WORD_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bpersonalized\b/gi, 'পার্সোনালাইজড'],
  [/\bcustomized\b/gi, 'কাস্টমাইজড'],
  [/\bcustom\b/gi, 'কাস্টম'],
  [/\bphoto frames\b/gi, 'ফটো ফ্রেম'],
  [/\bphoto frame\b/gi, 'ফটো ফ্রেম'],
  [/\bcoffee mugs\b/gi, 'কফি মগ'],
  [/\bcoffee mug\b/gi, 'কফি মগ'],
  [/\bmagic mug\b/gi, 'ম্যাজিক মগ'],
  [/\bmugs\b/gi, 'মগ'],
  [/\bmug\b/gi, 'মগ'],
  [/\bt-shirts\b/gi, 'টি-শার্ট'],
  [/\bt-shirt\b/gi, 'টি-শার্ট'],
  [/\btshirt\b/gi, 'টি-শার্ট'],
  [/\bprinted\b/gi, 'প্রিন্টেড'],
  [/\bprints\b/gi, 'প্রিন্ট'],
  [/\bprint\b/gi, 'প্রিন্ট'],
  [/\bkeychains\b/gi, 'কী-চেইন'],
  [/\bkeychain\b/gi, 'কী-চেইন'],
  [/\bkey chain\b/gi, 'কী-চেইন'],
  [/\bgift box\b/gi, 'গিফট বক্স'],
  [/\bgift bag\b/gi, 'গিফট ব্যাগ'],
  [/\bgifts\b/gi, 'উপহার'],
  [/\bgift\b/gi, 'উপহার'],
  [/\bhamper\b/gi, 'হ্যাম্পার'],
  [/\bwooden\b/gi, 'উডেন'],
  [/\bacrylic\b/gi, 'অ্যাক্রিলিক'],
  [/\bled lighting\b/gi, 'এলইডি লাইটিং'],
  [/\bled lamp\b/gi, 'এলইডি ল্যাম্প'],
  [/\bled\b/gi, 'এলইডি'],
  [/\bpvc card\b/gi, 'পিভিসি কার্ড'],
  [/\bhome decor\b/gi, 'হোম ডেকর'],
  [/\bhand made\b/gi, 'হ্যান্ড মেইড'],
  [/\bhandmade\b/gi, 'হ্যান্ডমেইড'],
  [/\bcollage\b/gi, 'কোলাজ'],
  [/\bframe\b/gi, 'ফ্রেম'],
  [/\bcushion\b/gi, 'কুশন'],
  [/\bpillow\b/gi, 'বালিশ'],
  [/\bbottle\b/gi, 'বোতল'],
  [/\bwallet\b/gi, 'ওয়ালেট'],
  [/\bcouple\b/gi, 'কাপল'],
  [/\bbirthday\b/gi, 'জন্মদিন'],
  [/\banniversary\b/gi, 'বার্ষিকী'],
  [/\bpremium\b/gi, 'প্রিমিয়াম'],
  [/\bspecial\b/gi, 'স্পেশাল'],
  [/\bheart\b/gi, 'হার্ট'],
  [/\bmagic\b/gi, 'ম্যাজিক'],
  [/\bphoto\b/gi, 'ফটো'],
  [/\bname\b/gi, 'নেম'],
  [/\bbox\b/gi, 'বক্স'],
  [/\bbag\b/gi, 'ব্যাগ'],
  [/\bcard\b/gi, 'কার্ড'],
  [/\bcombo\b/gi, 'কম্বো'],
  [/\bset\b/gi, 'সেট'],
  [/\blamp\b/gi, 'ল্যাম্প'],
  [/\blight\b/gi, 'লাইট'],
  [/\bnight\b/gi, 'নাইট'],
  [/\bclock\b/gi, 'ঘড়ি'],
  [/\bwall\b/gi, 'দেয়াল'],
  [/\btable\b/gi, 'টেবিল'],
  [/\bmini\b/gi, 'মিনি'],
  [/\blove\b/gi, 'ভালোবাসার'],
  [/\bblack\b/gi, 'কালো'],
  [/\bwhite\b/gi, 'সাদা'],
  [/\bpink\b/gi, 'গোলাপি'],
  [/\bred\b/gi, 'লাল'],
  [/\bpurple\b/gi, 'বেগুনি'],
  [/\bblue\b/gi, 'নীল'],
  [/\bgolden\b/gi, 'সোনালী'],
  [/\bwith\b/gi, 'সহ'],
  [/\band\b/gi, 'ও'],
  [/\bfor\b/gi, '-এর জন্য'],
];

function containsBengaliScript(text: string): boolean {
  return /[\u0980-\u09FF]/.test(text);
}

/**
 * Translates common English product/category/variant phrases to natural Bengali
 * when Admin hasn't explicitly entered a Bengali translation.
 */
export function autoTranslateToBengali(text: string, kind: 'name' | 'description' | 'variant' | 'place' = 'name'): string {
  const trimmed = text.trim();
  if (!trimmed) return text;
  if (containsBengaliScript(trimmed)) return text;

  const lower = trimmed.toLowerCase();
  if (EXACT_BENGALI_PHRASES[lower]) {
    return EXACT_BENGALI_PHRASES[lower];
  }

  // For long product descriptions, replace key gifting terms cleanly while preserving readability
  if (kind === 'description') {
    if (lower.includes('personalized') || lower.includes('gift') || lower.includes('photo') || lower.includes('mug') || lower.includes('frame') || lower.includes('t-shirt') || lower.includes('custom')) {
      let out = trimmed;
      out = out
        .replace(/High-quality/gi, 'উচ্চমানের')
        .replace(/Premium quality/gi, 'প্রিমিয়াম মানের')
        .replace(/Perfect gift for/gi, 'উপযুক্ত উপহার:')
        .replace(/Perfect for/gi, 'উপযুক্ত:')
        .replace(/Ideal for/gi, 'আদর্শ উপহার:')
        .replace(/Handcrafted with love/gi, 'ভালোবাসা ও যত্নসহকারে তৈরি')
        .replace(/Carefully packed/gi, 'সতর্কতার সাথে প্যাক করা')
        .replace(/Free delivery/gi, 'ফ্রি ডেলিভারি')
        .replace(/Fast delivery/gi, 'দ্রুত ডেলিভারি')
        .replace(/Cash on Delivery/gi, 'ক্যাশ অন ডেলিভারি')
        .replace(/Add your favorite photo/gi, 'আপনার পছন্দের ছবি যোগ করুন')
        .replace(/Upload your photo/gi, 'আপনার ছবি আপলোড করুন')
        .replace(/Durable/gi, 'টেকসই')
        .replace(/ceramic mug/gi, 'সিরামিক মগ')
        .replace(/photo frame/gi, 'ফটো ফ্রেম')
        .replace(/cotton t-shirt/gi, 'সুতি টি-শার্ট')
        .replace(/birthdays?,?\s*anniversaries?/gi, 'জন্মদিন ও বার্ষিকী')
        .replace(/special occasions?/gi, 'বিশেষ উপলক্ষ')
        .replace(/loved ones/gi, 'প্রিয়জনদের');
      for (const [pattern, replacement] of WORD_REPLACEMENTS) {
        out = out.replace(pattern, replacement);
      }
      return out;
    }
    return text;
  }

  let result = trimmed;
  for (const [pattern, replacement] of WORD_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

const ORDER_STATUS_LABELS: Record<string, Record<LanguageCode, string>> = {
  'new order': { en: 'Order Placed', bn: 'অর্ডার সম্পন্ন', hi: 'ऑर्डर किया गया' },
  'order placed': { en: 'Order Placed', bn: 'অর্ডার সম্পন্ন', hi: 'ऑर्डर किया गया' },
  placed: { en: 'Order Placed', bn: 'অর্ডার সম্পন্ন', hi: 'ऑर्डर किया गया' },
  pending: { en: 'Pending', bn: 'পেন্ডিং', hi: 'पेंडिंग' },
  confirmed: { en: 'Confirmed', bn: 'কনফার্মড', hi: 'कन्फर्म' },
  processing: { en: 'Processing', bn: 'প্রসেসিং চলছে', hi: 'प्रोसेसिंग' },
  packed: { en: 'Packed', bn: 'প্যাক করা হয়েছে', hi: 'पैक किया गया' },
  shipped: { en: 'Shipped', bn: 'শিপ করা হয়েছে', hi: 'शिप किया गया' },
  'in transit': { en: 'In Transit', bn: 'পথে রয়েছে', hi: 'रास्ते में' },
  'out for delivery': { en: 'Out for Delivery', bn: 'ডেলিভারির পথে', hi: 'डिलीवरी के लिए निकला' },
  delivered: { en: 'Delivered', bn: 'ডেলিভারি সম্পন্ন', hi: 'डिलीवर हो गया' },
  cancelled: { en: 'Cancelled', bn: 'বাতিল হয়েছে', hi: 'रद्द' },
  canceled: { en: 'Cancelled', bn: 'বাতিল হয়েছে', hi: 'रद्द' },
  'delivery failed': { en: 'Delivery Failed', bn: 'ডেলিভারি ব্যর্থ', hi: 'डिलीवरी असफल' },
  returned: { en: 'Returned', bn: 'রিটার্ন হয়েছে', hi: 'रिटर्न किया गया' },
};

const PAYMENT_STATUS_LABELS: Record<string, Record<LanguageCode, string>> = {
  paid: { en: 'Paid', bn: 'পরিশোধিত', hi: 'भुगतान पूर्ण' },
  unpaid: { en: 'Unpaid', bn: 'অপরিশোধিত', hi: 'भुगतान बाकी' },
  pending: { en: 'Pending', bn: 'পেন্ডিং', hi: 'पेंडिंग' },
  cod: { en: 'COD', bn: 'ক্যাশ অন ডেলিভারি', hi: 'सीओडी' },
  'cod (pending)': { en: 'COD (Pending)', bn: 'COD (ডেলিভারিতে পেমেন্ট)', hi: 'सीओडी (बाकी)' },
  'cod (collected)': { en: 'COD (Paid)', bn: 'COD (পরিশোধিত)', hi: 'सीओडी (पूर्ण)' },
  failed: { en: 'Failed', bn: 'ব্যর্থ', hi: 'असफल' },
  refunded: { en: 'Refunded', bn: 'রিফান্ড হয়েছে', hi: 'रिफंड किया गया' },
};

const PAYMENT_METHOD_LABELS: Record<string, Record<LanguageCode, string>> = {
  'cash on delivery (cod)': {
    en: 'Cash on Delivery (COD)',
    bn: 'ক্যাশ অন ডেলিভারি (COD)',
    hi: 'कैश ऑन डिलीवरी (COD)',
  },
  'cash on delivery': {
    en: 'Cash on Delivery (COD)',
    bn: 'ক্যাশ অন ডেলিভারি (COD)',
    hi: 'कैश ऑन डिलीवरी (COD)',
  },
  cod: {
    en: 'Cash on Delivery (COD)',
    bn: 'ক্যাশ অন ডেলিভারি (COD)',
    hi: 'कैश ऑन डिलीवरी (COD)',
  },
  'upi payment': {
    en: 'UPI Payment',
    bn: 'ইউপিআই (UPI) পেমেন্ট',
    hi: 'यूपीआई (UPI) भुगतान',
  },
  upi: {
    en: 'UPI Payment',
    bn: 'ইউপিআই (UPI) পেমেন্ট',
    hi: 'यूपीआई (UPI) भुगतान',
  },
  'online payment': {
    en: 'Online Payment',
    bn: 'অনলাইন পেমেন্ট',
    hi: 'ऑनलाइन भुगतान',
  },
};

export function translateOrderStatusLabel(status: string, lang: LanguageCode): string {
  const key = status.trim().toLowerCase();
  return ORDER_STATUS_LABELS[key]?.[lang] ?? status;
}

export function translatePaymentStatusLabel(status: string, lang: LanguageCode): string {
  const key = status.trim().toLowerCase();
  return PAYMENT_STATUS_LABELS[key]?.[lang] ?? status;
}

export function translatePaymentMethodLabel(method: string, lang: LanguageCode): string {
  const key = method.trim().toLowerCase();
  return PAYMENT_METHOD_LABELS[key]?.[lang] ?? method;
}

export function translateVariantText(text: string, lang: LanguageCode): string {
  if (lang !== 'bn') return text;
  return autoTranslateToBengali(text, 'variant');
}

export function translatePlaceText(text: string, lang: LanguageCode): string {
  if (lang !== 'bn') return text;
  return autoTranslateToBengali(text, 'place');
}

export function getDateLocale(lang: LanguageCode): string {
  if (lang === 'bn') return 'bn-IN';
  if (lang === 'hi') return 'hi-IN';
  return 'en-IN';
}

export function formatLocalizedDate(
  iso: string | undefined,
  lang: LanguageCode,
  options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' }
): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(getDateLocale(lang), options);
}

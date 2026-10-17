/** EEC company brand — modern enterprise SaaS design system */
export const brand = {
  primary: '#2563EB', // Royal Blue primary
  primaryDark: '#1D4ED8',
  primaryLight: '#3B82F6',
  primaryRgb: '37, 99, 235',
  secondary: '#0891B2', // Teal secondary
  secondaryDark: '#0E7490',
  secondaryLight: '#06B6D4',
  navy: '#111C35', // Dark Navy sidebar
  background: '#F8FAFC', // Soft Gray application background
} as const;

export const brandPrimary = brand.primary;
export const brandPrimaryDark = brand.primaryDark;
export const brandPrimaryLight = brand.primaryLight;
export const brandSecondary = brand.secondary;
export const brandNavy = brand.navy;

export const productName = 'EEC';
export const productTagline = 'IT Ticket & Asset Management';

const supportEmail =
  import.meta.env.VITE_SUPPORT_EMAIL?.trim() || 'itsupport@eecproducts.com';

export const supportMailto = `mailto:${supportEmail}?subject=${encodeURIComponent(
  `${productName} IT Support — Account or password help`,
)}`;

const eeccLogo = '/eecc.png';

export const brandButtonClass =
  'w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold h-11 rounded-xl shadow-md shadow-[#2563EB]/20 transition-all duration-200 transform hover:scale-[1.005] active:scale-[0.995]';

export { eeccLogo, supportEmail };

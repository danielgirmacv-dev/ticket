/** EEC company brand — modern enterprise SaaS design system */
export const brand = {
  primary: '#11adc4', // EEC Teal primary
  primaryDark: '#0e92a6',
  primaryLight: '#2cd4ec',
  primaryRgb: '17, 173, 196',
  secondary: '#0f5766', // Dark Teal secondary
  secondaryDark: '#093d4a',
  secondaryLight: '#157387',
  navy: '#0f5766', // Dark Teal sidebar
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
  'w-full bg-[#11adc4] hover:bg-[#0e92a6] text-white font-semibold h-11 rounded-xl shadow-md shadow-[#11adc4]/20 transition-all duration-200 transform hover:scale-[1.005] active:scale-[0.995]';

export { eeccLogo, supportEmail };

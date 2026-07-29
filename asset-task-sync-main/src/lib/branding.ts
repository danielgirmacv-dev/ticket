/** EECC company brand — matches logo teal (#1AB1C7) */
export const brand = {
  primary: '#1AB1C7',
  primaryDark: '#148FA3',
  primaryLight: '#2EC4DA',
  primaryRgb: '26, 177, 199',
} as const;

const eeccLogo = '/eecc.png';

export const brandButtonClass =
  'w-full bg-[#1AB1C7] hover:bg-[#148FA3] text-white font-semibold h-11 rounded-xl shadow-lg shadow-[#1AB1C7]/30 transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99]';

export { eeccLogo };

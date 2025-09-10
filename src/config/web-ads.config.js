// Minimal web ads config used by /app/test-ads and other components

export const WEB_ADS_CONFIG = {
  ADSENSE: {
    CLIENT_ID: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-0000000000000000',
    SLOT_IDS: {
      BANNER: process.env.NEXT_PUBLIC_ADSENSE_BANNER_SLOT || '0000000000',
      RECTANGLE: process.env.NEXT_PUBLIC_ADSENSE_RECT_SLOT || '0000000000',
      RESPONSIVE: process.env.NEXT_PUBLIC_ADSENSE_RESP_SLOT || '0000000000',
    },
  },
  PARTNERS: [],
  SETTINGS: {
    enabled: true,
    fallbackToTest: true,
  },
};

export function getAdConfigForEnvironment() {
  const env = process.env.NODE_ENV || 'development';
  return { ...WEB_ADS_CONFIG, env, timestamp: new Date().toISOString() };
}

export default WEB_ADS_CONFIG;

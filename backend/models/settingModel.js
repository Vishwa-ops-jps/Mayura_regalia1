const { getPool } = require('../config/db');

// Default homepage hero slides (no repeated images). Admin > Settings > Hero Section
// replaces these; they are used until the admin saves their own.
const DEFAULT_HERO_SLIDES = [
  {
    "id": "bridal",
    "badge": "BRIDAL COLLECTION",
    "tagline": "For your most precious moments",
    "collectionName": "BRIDAL JEWELLERY",
    "description": "Exquisite handcrafted bridal jewellery sets for your special day",
    "buttonText": "EXPLORE NOW",
    "link": "/shop?category=Bridal+Jewellery",
    "images": [
      "/CoverImage1.png",
      "/products/regalia-5.jpg",
      "/products/regalia-11.jpg",
      "/products/fashion-jewels-1.jpg"
    ]
  },
  {
    "id": "kundan",
    "badge": "KUNDAN & TEMPLE",
    "tagline": "Timeless beauty crafted for generations",
    "collectionName": "JEWELLERY COLLECTIONS",
    "description": "Intricately handcrafted gold, kundan and precious gemstone jewellery",
    "buttonText": "EXPLORE NOW",
    "link": "/shop",
    "images": [
      "/CoverImage2.jpg",
      "/products/regalia-1.jpg",
      "/products/regalia-9.jpg",
      "/products/fashion-jewels-2.jpg"
    ]
  },
  {
    "id": "sarees",
    "badge": "SAREES",
    "tagline": "Woven poetry for celebratory grace",
    "collectionName": "SAREES COLLECTION",
    "description": "Traditional Kalamkari prints and rich velvet sarees",
    "buttonText": "EXPLORE NOW",
    "link": "/shop?category=Sarees",
    "images": [
      "/BlueSaree.jpeg",
      "/products/saree-wine-velvet.jpg",
      "/products/saree-cotton-elephant-print.jpg"
      ]
  }
];

const DEFAULTS = {
  storeName: 'Mayura Regalia',
  storeEmail: 'support@mayuraregalia.com',
  storePhone: '',
  address: '',
  currency: 'INR',
  shippingFee: '0',
  freeShippingThreshold: '999',
  taxRate: '0',
  // Gold pricing inputs used by the admin for transparent jewellery pricing.
  // Prices are stored per gram in the store currency.
  goldPrice24k: '0',
  goldPrice22k: '0',
  goldPrice18k: '0',
  makingChargePercent: '0',
  wastagePercent: '0',
  goldPriceUpdatedAt: '',
  socialInstagram: '',
  socialFacebook: '',
  maintenanceMode: 'false',
  apiKeyPublic: '',
  apiKeySecret: '',
  apiKeyCreatedAt: '',
  // Payment gateway (Razorpay handles cards, UPI, netbanking & wallets
  // through one integration). Admin pastes these in from their Razorpay
  // dashboard - see admin Settings > Payment Gateway.
  codEnabled: 'true',
  razorpayEnabled: 'false',
  razorpayKeyId: '',
  razorpayKeySecret: '',
  razorpayWebhookSecret: '',
  // Direct UPI: a second, gateway-free way to collect UPI payments straight
  // into the admin's own bank account via a UPI deep link / QR code, for
  // stores that want a fallback (or don't have Razorpay set up at all).
  // There's no aggregator in this path, so there's also no automatic
  // verification - the admin has to confirm each payment themselves in the
  // Payments screen after checking their UPI app or bank statement.
  directUpiEnabled: 'false',
  // The admin's own UPI ID (VPA). Used both as a trust-signal display at
  // checkout AND, when directUpiEnabled is on, as the actual payee address
  // encoded into the UPI deep link/QR that customers pay - money for that
  // path goes straight to whichever bank account this UPI ID is linked to.
  upiId: '',
  // Hero Section (editable from Admin > Settings > Hero Section)
  heroHeading: 'MAYURA REGALIA',
  heroSubtitle: 'Exquisite handcrafted jewellery for your most precious moments',
  heroImage: '/CoverImage1.png',
  heroButtonText: 'EXPLORE COLLECTION',
  heroButtonLink: '/shop',
  // JSON array of slides shown on the storefront hero (see DEFAULT_HERO_SLIDES).
  heroSlides: JSON.stringify(DEFAULT_HERO_SLIDES),
};

async function getAll() {
  const [rows] = await getPool().query('SELECT setting_key AS `key`, setting_value AS value FROM settings');
  const result = { ...DEFAULTS };
  rows.forEach((row) => { result[row.key] = row.value; });
  return result;
}

async function updateMany(values) {
  const pool = getPool();
  const entries = Object.entries(values || {});
  for (const [key, value] of entries) {
    await pool.query(
      `INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [key, value == null ? '' : String(value)]
    );
  }
  return getAll();
}

// Public, secret-free read of just the hero slides for the storefront.
async function getHero() {
  const [rows] = await getPool().query('SELECT setting_value AS value FROM settings WHERE setting_key = ?', ['heroSlides']);
  try {
    const parsed = JSON.parse(rows[0] && rows[0].value);
    if (Array.isArray(parsed) && parsed.length) return parsed;
  } catch (e) { /* fall through to defaults */ }
  return DEFAULT_HERO_SLIDES;
}

async function getGoldPrices() {
  const settings = await getAll();
  return {
    currency: settings.currency,
    goldPrice24k: settings.goldPrice24k,
    goldPrice22k: settings.goldPrice22k,
    goldPrice18k: settings.goldPrice18k,
    makingChargePercent: settings.makingChargePercent,
    wastagePercent: settings.wastagePercent,
    updatedAt: settings.goldPriceUpdatedAt,
  };
}

module.exports = { getAll, updateMany, getHero, getGoldPrices, DEFAULTS, DEFAULT_HERO_SLIDES };

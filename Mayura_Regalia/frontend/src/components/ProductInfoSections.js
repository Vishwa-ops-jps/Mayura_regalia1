import React from 'react';
import { Link } from 'react-router-dom';
import storeInfo from '../data/storeInfo';
import '../styles/ProductInfoSections.css';

const has = (text, words) => words.some((w) => String(text || '').toLowerCase().includes(w));

const CARE = [
  'Keep away from water, perfume, deodorant, hairspray and chemicals - put jewellery on last, take it off first.',
  'Wipe gently with a soft, dry cloth after each wear.',
  'Store in the pouch or box it came in, away from moisture and direct sunlight. Keep pieces separate so they do not scratch each other.',
  'Avoid wearing while bathing, swimming, exercising or sleeping.',
  'Handle stone and pearl work gently; do not pull or twist strings and hooks.',
];

// General guidance by category (not exact measurements of this piece).
function sizeGuide(product) {
  const name = `${product.category} ${product.name}`;
  if (has(name, ['bangle', 'kada', 'bracelet'])) {
    return {
      title: 'Bangle size guide',
      lines: [
        'Bangle sizes are the inner diameter in inches. Common sizes: 2.2 (small), 2.4 (medium), 2.6 (large), 2.8 (extra large).',
        'To find yours: bring your thumb and little finger together, and measure around the widest part of your knuckles. Pick the bangle diameter that fits over this measurement.',
        'Not sure? Message us with your usual size before ordering.',
      ],
    };
  }
  if (has(name, ['ring'])) {
    return { title: 'Ring size guide', lines: ['Check the size listed in the description. If you are between sizes, choose the larger one. Adjustable rings stretch to fit most fingers.', 'Need help choosing? Contact us with your finger measurement.'] };
  }
  if (has(name, ['necklace', 'haar', 'chain', 'choker', 'bridal', 'set', 'mala'])) {
    return { title: 'Fit guide', lines: ['Chokers sit close to the neck (about 14-16 inches); necklaces fall on the collarbone (16-18 inches); longer haars (20 inches and above) sit lower on the chest.', 'Most pieces have an adjustable back string (dori) so you can set the length.'] };
  }
  if (has(name, ['earring', 'jhumka', 'stud', 'maang', 'tikka'])) {
    return { title: 'Wearing guide', lines: ['Check the photo against your face shape - larger jhumkas and chandbalis make a statement, studs and small drops suit everyday wear.', 'Heavier earrings are more comfortable with ear supports or chains.'] };
  }
  return null;
}

const ProductInfoSections = ({ product }) => {
  const guide = sizeGuide(product);
  return (
    <div className="product-info-sections">
      <details open>
        <summary>Product details</summary>
        <ul>
          {product.material && <li><strong>Material:</strong> {product.material}</li>}
          {product.color && <li><strong>Colour:</strong> {product.color}</li>}
          {product.category && <li><strong>Category:</strong> {product.category}</li>}
          <li>Colours may look slightly different on screen than in person.</li>
        </ul>
      </details>
      {guide && (
        <details>
          <summary>{guide.title}</summary>
          <ul>{guide.lines.map((l) => <li key={l}>{l}</li>)}</ul>
        </details>
      )}
      <details>
        <summary>Care instructions</summary>
        <ul>{CARE.map((l) => <li key={l}>{l}</li>)}</ul>
      </details>
      <details>
        <summary>Shipping &amp; returns</summary>
        <ul>
          <li>Dispatched in {storeInfo.processingDays}; delivery usually {storeInfo.deliveryDays}.</li>
          <li>Free shipping on orders above ₹{storeInfo.freeShippingAbove}.</li>
          <li>{storeInfo.returnWindowDays}-day returns for damaged, defective or wrong items. See the <Link to="/returns-policy">Returns policy</Link> and <Link to="/shipping-policy">Shipping policy</Link>.</li>
        </ul>
      </details>
    </div>
  );
};

export default ProductInfoSections;

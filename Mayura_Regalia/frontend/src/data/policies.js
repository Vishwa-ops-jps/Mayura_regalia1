import storeInfo from './storeInfo';

const s = storeInfo;
const contactLine = `${s.email} or ${s.phone}`;

// Each policy is a list of sections. Plain-language drafts - the owner should read them and
// adjust to the real business practice (and ideally have them reviewed by a legal adviser).
const policies = {
  'privacy-policy': {
    title: 'Privacy Policy',
    intro: `${s.name} respects your privacy. This policy explains what information we collect when you use our website, how we use it, and the choices you have.`,
    sections: [
      { heading: 'Information we collect', body: [
        'Account details: your name, email address, phone number and password (stored in encrypted form).',
        'Order details: delivery address, items ordered and payment method. Card, UPI and netbanking details are handled by our payment provider; we do not store your card number or PIN.',
        'Usage information: pages visited, items added to your cart or wishlist, and basic device and browser information.',
      ] },
      { heading: 'How we use it', body: [
        'To process and deliver your orders, send order updates and respond to your queries.',
        'To keep your account, cart and wishlist working and to prevent fraud.',
        'To improve our products and website, and - only if you agree - to send offers and news.',
      ] },
      { heading: 'Sharing', body: [
        'We share information only with those who help us serve you: payment providers, courier partners and technology services. They may use it only for that purpose.',
        'We do not sell your personal information. We may disclose it if the law requires us to.',
      ] },
      { heading: 'Cookies and local storage', body: ['Our site stores small pieces of data in your browser (for example to keep you logged in and remember your cart). You can clear them any time in your browser settings.'] },
      { heading: 'Your choices', body: [
        'You can view or update your details from your account page.',
        `To ask us to correct or delete your data, or to stop marketing messages, contact us at ${contactLine}.`,
      ] },
      { heading: 'Security and retention', body: ['We use reasonable technical safeguards, but no online service can promise absolute security. We keep order records for as long as needed for accounting and legal purposes.'] },
      { heading: 'Changes', body: [`We may update this policy from time to time. The date at the top shows when it was last changed.`] },
    ],
  },

  'terms-and-conditions': {
    title: 'Terms & Conditions',
    intro: `By using the ${s.name} website and placing an order you agree to these terms. Please read them carefully.`,
    sections: [
      { heading: 'Our products', body: [
        'We sell artificial / fashion jewellery and related items. Colours may look slightly different on your screen than in person.',
        'Prices are in Indian Rupees (INR) and include applicable taxes unless stated otherwise. We may change prices and availability without notice; the price at the time you place the order applies.',
      ] },
      { heading: 'Orders and payment', body: [
        'An order is confirmed only after we accept it and, for online payment, the payment succeeds. We may cancel an order (with a full refund of any amount paid) if an item is unavailable or there is a pricing error.',
        'Payment options shown at checkout may include Cash on Delivery, UPI and online payment through Razorpay. Direct UPI payments are confirmed by us after we verify receipt of the payment.',
      ] },
      { heading: 'Shipping, returns and refunds', body: ['These are explained in our Shipping & Delivery Policy and Returns & Refund Policy, which form part of these terms.'] },
      { heading: 'Your account', body: ['Keep your login details private. You are responsible for activity under your account. Please give accurate information when you register and order.'] },
      { heading: 'Acceptable use', body: ['Do not misuse the website - for example by attempting to break into it, scraping it, or placing fraudulent orders. We may suspend accounts that do.'] },
      { heading: 'Intellectual property', body: [`All photos, text, logos and designs on this site belong to ${s.name} and may not be copied or reused without written permission.`] },
      { heading: 'Liability', body: ['To the extent the law allows, our liability for any claim is limited to the amount you paid for the item concerned.'] },
      { heading: 'Governing law', body: ['These terms are governed by the laws of India. Disputes are subject to the courts at our place of business.'] },
      { heading: 'Contact', body: [`Questions about these terms: ${contactLine}.`] },
    ],
  },

  'shipping-policy': {
    title: 'Shipping & Delivery Policy',
    intro: `How and when ${s.name} delivers your order.`,
    sections: [
      { heading: 'Processing time', body: [`Orders are packed and handed to the courier within ${s.processingDays} of confirmation. Orders placed on Sundays or public holidays are processed on the next business day.`] },
      { heading: 'Delivery time', body: [`Once shipped, delivery usually takes ${s.deliveryDays}, depending on your location. Remote areas may take longer. These are estimates, not guarantees.`] },
      { heading: 'Shipping charges', body: [`Shipping is free on orders above Rs. ${s.freeShippingAbove}. For smaller orders, the shipping fee (if any) is shown at checkout before you pay.`] },
      { heading: 'Tracking', body: ['When your order ships we share the courier and tracking details by email or phone. Order status is also available in your account.'] },
      { heading: 'Incorrect address or failed delivery', body: ['Please check your address and phone number carefully. If the courier cannot deliver because of an incorrect address or no response, the order may be returned to us and extra shipping may be charged for re-sending.'] },
      { heading: 'Damaged or wrong parcel', body: ['Please record a short unboxing video when opening your parcel. If an item arrives damaged or incorrect, contact us within 48 hours (see the Returns & Refund Policy).'] },
      { heading: 'Contact', body: [`Delivery questions: ${contactLine}.`] },
    ],
  },

  'returns-policy': {
    title: 'Returns & Refund Policy',
    intro: `We want you to love your jewellery. If something is not right, here is how returns, exchanges and refunds work.`,
    sections: [
      { heading: 'When you can return', body: [
        `Contact us within ${s.returnWindowDays} days of delivery if the item is damaged, defective, or not what you ordered.`,
        'The item must be unused, with original packaging and tags, and with your order number.',
      ] },
      { heading: 'Items we cannot take back', body: [
        'Items worn, altered or damaged after delivery, and items without original packaging.',
        'Customised or specially made orders, unless they arrive defective.',
        'Hygiene-sensitive items such as earrings, where this is stated on the product page, unless defective.',
      ] },
      { heading: 'How to request a return', body: [
        `Email or call us at ${contactLine} with your order number and clear photos or an unboxing video of the problem.`,
        'Once we approve the request we will arrange a pickup or tell you where to send the item.',
      ] },
      { heading: 'Refunds', body: [
        'After we receive and check the item we refund the amount paid, or offer a replacement if you prefer.',
        'Online payments are refunded to the original payment method, usually within 5-7 business days after approval. Cash on Delivery and direct UPI orders are refunded by bank or UPI transfer to the account you give us.',
        'Original shipping charges are not refunded unless the return is because of our error.',
      ] },
      { heading: 'Cancellations', body: ['You can cancel an order before it ships by contacting us. Orders already shipped follow the return process above.'] },
    ],
  },
};

export default policies;

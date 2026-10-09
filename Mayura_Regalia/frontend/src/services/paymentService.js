import { apiRequest } from './api';

// Loads the Razorpay Checkout widget script once and reuses it on repeat
// checkouts. Resolves false (instead of throwing) on failure so callers can
// show a friendly message rather than crash the checkout flow.
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const existing = document.querySelector('script[data-razorpay-checkout]');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.dataset.razorpayCheckout = 'true';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const paymentService = {
  loadRazorpayScript,

  // Which payment options are currently live (set by the admin in
  // Settings > Payment Gateway). Safe to call without auth - it never
  // returns secret keys.
  getConfig: () => apiRequest('/payments/config'),

  // Creates a Razorpay order for an order we've already saved (as pending)
  // in our own backend, and returns just enough to open the checkout widget.
  createRazorpayOrder: (orderId) => apiRequest('/payments/razorpay/create-order', {
    method: 'POST',
    body: JSON.stringify({ orderId }),
  }),

  // Sends back what the Razorpay widget's success handler gave us, so the
  // backend can verify the signature before trusting the payment.
  verifyPayment: (payload) => apiRequest('/payments/razorpay/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  // Best-effort: lets the backend mark the payment failed when the
  // customer closes the widget or the payment is declined, so it doesn't
  // sit on "pending" forever.
  markFailed: (orderId) => apiRequest('/payments/razorpay/failed', {
    method: 'POST',
    body: JSON.stringify({ orderId }),
  }).catch(() => {}),

  // Direct UPI (no gateway in the middle): records the UTR/reference number
  // the customer saw in their own UPI app after paying the admin's UPI ID
  // directly. This does NOT mark the order paid - there's nothing to
  // verify it against - it just gives the admin something to cross-check
  // in their bank/UPI app before marking it paid themselves.
  submitDirectUpiReference: (orderId, utr, proofImage) => apiRequest('/payments/direct-upi/reference', {
    method: 'POST',
    body: JSON.stringify({ orderId, utr, proofImage: proofImage || undefined }),
  }),
};

// Builds a standard UPI deep link (opens the customer's UPI app with the
// payee, amount and a note pre-filled) - the same link works as-is for a QR
// code and as a clickable "Open UPI app" button on mobile.
export function buildUpiLink({ upiId, payeeName, amount, note }) {
  const params = new URLSearchParams({
    pa: upiId,
    pn: payeeName || 'Store',
    am: Number(amount).toFixed(2),
    cu: 'INR',
    tn: note || 'Order payment',
  });
  return `upi://pay?${params.toString()}`;
}

export default paymentService;

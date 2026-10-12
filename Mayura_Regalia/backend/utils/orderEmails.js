const { sendMail } = require('./mailer');

const STORE = process.env.STORE_NAME || 'Mayura Regalia';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@mayuraregalia.com';
const SUPPORT_PHONE = process.env.SUPPORT_PHONE || '8951084668';
const siteUrl = () => (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');

const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => `Rs. ${Number(n || 0).toLocaleString('en-IN')}`;

function itemsTable(order) {
  const rows = (order.items || []).map((i) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #f0e6d2">${esc(i.productName)} &times; ${esc(i.quantity)}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f0e6d2;text-align:right">${money(Number(i.price) * Number(i.quantity))}</td>
    </tr>`).join('');
  return `<table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">${rows}
    <tr><td style="padding-top:10px;color:#777">Subtotal</td><td style="padding-top:10px;text-align:right">${money(order.subtotal)}</td></tr>
    ${Number(order.discount) ? `<tr><td style="color:#777">Discount</td><td style="text-align:right">-${money(order.discount)}</td></tr>` : ''}
    <tr><td style="color:#777">Shipping</td><td style="text-align:right">${Number(order.shippingFee) ? money(order.shippingFee) : 'Free'}</td></tr>
    <tr><td style="padding-top:6px"><strong>Total</strong></td><td style="padding-top:6px;text-align:right"><strong>${money(order.total)}</strong></td></tr>
  </table>`;
}

function layout(heading, intro, order, extraHtml = '') {
  const trackUrl = `${siteUrl()}/track-order?order=${encodeURIComponent(order.orderNumber)}`;
  return `<!doctype html><html><body style="margin:0;background:#faf6ee;font-family:Arial,Helvetica,sans-serif;color:#3a2a2a">
  <div style="max-width:560px;margin:0 auto;padding:24px">
    <div style="text-align:center;padding:12px 0"><span style="font-size:22px;letter-spacing:4px;color:#5a1230;font-weight:bold">MAYURA REGALIA</span></div>
    <div style="background:#fff;border:1px solid #efe3cf;border-radius:12px;padding:24px">
      <h2 style="margin:0 0 8px;color:#5a1230">${esc(heading)}</h2>
      <p style="margin:0 0 16px;line-height:1.6">Hi ${esc(order.customerName)}, ${intro}</p>
      <p style="margin:0 0 16px;font-size:14px;color:#777">Order number: <strong style="color:#3a2a2a">${esc(order.orderNumber)}</strong></p>
      ${extraHtml}
      ${itemsTable(order)}
      <div style="text-align:center;margin:24px 0 8px"><a href="${esc(trackUrl)}" style="background:#7a1f3d;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;letter-spacing:1px">TRACK YOUR ORDER</a></div>
      <p style="font-size:12px;color:#999;text-align:center;margin:8px 0 0">To track, enter your order number and the email or phone number you used at checkout.</p>
    </div>
    <p style="text-align:center;font-size:12px;color:#999;line-height:1.6;margin-top:16px">
      Questions? Reply to this email, write to ${esc(SUPPORT_EMAIL)} or call ${esc(SUPPORT_PHONE)}.<br>&copy; ${new Date().getFullYear()} ${esc(STORE)}
    </p>
  </div></body></html>`;
}

function addressBlock(order) {
  const line = [order.address, order.city, order.state, order.pincode].filter(Boolean).join(', ');
  return line ? `<p style="font-size:14px;margin:0 0 16px"><strong>Delivering to:</strong><br>${esc(line)}</p>` : '';
}

function payLine(order) {
  const method = String(order.paymentMethod || 'COD');
  if (/cod/i.test(method)) return 'Payment: Cash on Delivery - please keep the amount ready.';
  return `Payment: ${esc(method)} (${esc(order.paymentStatus)})`;
}

function build(kind, order) {
  switch (kind) {
    case 'placed':
      return {
        subject: `Order confirmed - ${order.orderNumber}`,
        html: layout('Thank you for your order!', 'we have received your order and will start preparing it soon.', order,
          `${addressBlock(order)}<p style="font-size:14px;margin:0 0 16px">${payLine(order)}</p>`),
      };
    case 'processing':
      return { subject: `We are preparing your order - ${order.orderNumber}`, html: layout('Your order is being prepared', 'good news - we are now packing your jewellery with care.', order) };
    case 'shipped': {
      const tracking = (order.courierName || order.trackingNumber)
        ? `<p style="font-size:14px;margin:0 0 16px"><strong>Courier:</strong> ${esc(order.courierName || '-')}<br><strong>Tracking number:</strong> ${esc(order.trackingNumber || '-')}${order.trackingUrl ? `<br><a href="${esc(order.trackingUrl)}">Track with the courier</a>` : ''}</p>`
        : '';
      return { subject: `Your order has shipped - ${order.orderNumber}`, html: layout('Your order is on its way', 'your order has been shipped.', order, tracking + addressBlock(order)) };
    }
    case 'delivered':
      return { subject: `Delivered - ${order.orderNumber}`, html: layout('Your order was delivered', 'your order has been delivered. We hope you love it! If anything is not right, reply to this email within the return window.', order) };
    case 'cancelled':
      return { subject: `Order cancelled - ${order.orderNumber}`, html: layout('Your order was cancelled', 'your order has been cancelled. If you paid online, the refund goes back to your original payment method (usually in 5-7 business days). If you did not ask for this, please contact us.', order) };
    default:
      return null;
  }
}

// Fire-and-forget helper: never throws.
async function sendOrderEmail(kind, order) {
  try {
    if (!order || !order.email) return false;
    const mail = build(kind, order);
    if (!mail) return false;
    return await sendMail({ to: order.email, subject: mail.subject, html: mail.html });
  } catch (error) {
    console.error('Order email error:', error.message);
    return false;
  }
}

module.exports = { sendOrderEmail };

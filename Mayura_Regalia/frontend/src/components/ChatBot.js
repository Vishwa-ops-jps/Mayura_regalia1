import React, { useEffect, useRef, useState } from 'react';
import '../styles/ChatBot.css';

// Edit this list to add, remove, or change what the bot can answer.
// Each entry is checked against the visitor's message — the entry whose
// keywords match the most words wins. Keep keywords lowercase.
const FAQ_DATA = [
  {
    topic: 'Shipping',
    keywords: ['shipping', 'delivery', 'deliver', 'dispatch', 'ship'],
    answer: 'We offer FREE shipping on orders above ₹999. Orders below that have a flat ₹100 shipping charge. Most orders are delivered within 5-7 business days.',
  },
  {
    topic: 'Returns',
    keywords: ['return', 'refund', 'exchange', 'cancel'],
    answer: 'We offer 15 Days Free Return on all orders. If something isn\u2019t right, reach out to us on WhatsApp and we\u2019ll help sort it out.',
  },
  {
    topic: 'Payment',
    keywords: ['payment', 'pay', 'upi', 'card', 'cod', 'cash'],
    answer: 'We accept UPI, Cards, and Cash on Delivery (COD) — all through a secure checkout.',
  },
  {
    topic: 'Categories',
    keywords: ['categories', 'category', 'collection', 'collections', 'products', 'what do you sell', 'what do you have'],
    answer: 'We have Jewellery (22 Carat & 18 Carat), Fashion Jewellery (Necklaces, Earrings, Bangles, Rings, Bridal Jewellery, Bracelets), Sarees, Bags, Watches, and Gifts.',
  },
  {
    topic: 'Jewellery',
    keywords: ['22 carat', '18 carat', 'carat', 'purity', 'gold jewellery', 'gold jewelry', 'gold'],
    answer: 'Our Jewellery collection is available in 22 Carat and 18 Carat gold.',
  },
  {
    topic: 'Fashion Jewellery',
    keywords: ['fashion jewellery', 'fashion jewelry', 'necklace', 'necklaces', 'earring', 'earrings', 'bangle', 'bangles', 'ring', 'rings', 'bridal', 'bracelet', 'bracelets'],
    answer: 'Our Fashion Jewellery range includes Necklaces, Earrings, Bangles, Rings, Bridal Jewellery, and Bracelets.',
  },
  {
    topic: 'Sarees',
    keywords: ['saree', 'sari', 'silk'],
    answer: 'Our Sarees collection includes Kanjeevaram, Mysore Silk, Kerala Kasavu, Pochampally Ikat, Chettinad Cotton, Uppada Silk, Gadwal, Koorai, and Konrad.',
  },
  {
    topic: 'Bags',
    keywords: ['bag', 'purse', 'sling', 'clutch'],
    answer: 'We have a range of Bags — check the Bags category for current materials and styles in stock.',
  },
  {
    topic: 'Watches',
    keywords: ['watch', 'watches'],
    answer: 'Our Watches range includes Mechanical, Automatic, Quartz, Analog, and Luxury watches.',
  },
  {
    topic: 'Gifts',
    keywords: ['gift', 'hamper', 'present'],
    answer: 'Our Gifts range includes Festive Hampers, Wedding Hampers, Jewellery Gift Sets, Corporate Hampers, and Personalised Hampers.',
  },
  {
    topic: 'Contact',
    keywords: ['contact', 'phone', 'number', 'call', 'reach', 'whatsapp'],
    answer: 'You can reach us on WhatsApp/call at 8951084668, or use the green WhatsApp button in the corner.',
  },
  {
    topic: 'Order tracking',
    keywords: ['track', 'order status', 'where is my order'],
    answer: 'For order tracking, please message us on WhatsApp at 8951084668 with your order number and we\u2019ll check it for you.',
  },
  {
    topic: 'Store hours',
    // TODO: replace this answer with your real store hours/address before launch.
    keywords: ['hours', 'timing', 'open', 'store', 'visit', 'address', 'location'],
    answer: 'For our store timings and address, please message us on WhatsApp at 8951084668 and we\u2019ll share the details.',
  },
];

const FALLBACK_ANSWER = 'I don\u2019t have an answer for that yet — message us on WhatsApp at 8951084668 and we\u2019ll help directly.';

function findAnswer(message) {
  const words = message.toLowerCase();
  let best = null;
  let bestScore = 0;
  FAQ_DATA.forEach((entry) => {
    const score = entry.keywords.reduce((sum, kw) => (words.includes(kw) ? sum + 1 : sum), 0);
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  });
  return best ? best.answer : FALLBACK_ANSWER;
}

const QUICK_TOPICS = ['Shipping', 'Returns', 'Payment', 'Categories', 'Contact'];

const ChatBot = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hi! I\u2019m the Mayura Regalia assistant. Ask me about shipping, returns, payment, or our categories \u2014 or tap a quick topic below.' },
  ]);
  const bodyRef = useRef(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, open]);

  const send = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const answer = findAnswer(trimmed);
    setMessages((prev) => [...prev, { from: 'user', text: trimmed }, { from: 'bot', text: answer }]);
    setInput('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    send(input);
  };

  return (
    <>
      <button
        className="chatbot-float"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close chat assistant' : 'Open chat assistant'}
        title="Ask a question"
      >
        {open ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        )}
      </button>

      {open && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <span>Mayura Regalia Assistant</span>
            <small>Instant answers to common questions</small>
          </div>

          <div className="chatbot-body" ref={bodyRef}>
            {messages.map((m, i) => (
              <div key={i} className={`chatbot-msg ${m.from}`}>{m.text}</div>
            ))}
          </div>

          <div className="chatbot-quick-topics">
            {QUICK_TOPICS.map((topic) => (
              <button key={topic} type="button" onClick={() => send(topic)}>{topic}</button>
            ))}
          </div>

          <form className="chatbot-input-row" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Type your question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" aria-label="Send">➤</button>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatBot;

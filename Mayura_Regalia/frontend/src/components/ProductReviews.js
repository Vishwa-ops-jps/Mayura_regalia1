import React, { useEffect, useState } from 'react';
import reviewService from '../services/reviewService';
import '../styles/ProductReviews.css';

const StarRating = ({ value, onChange }) => {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className={`star-rating ${onChange ? 'is-interactive' : ''}`}>
      {stars.map((star) => (
        <span
          key={star}
          role={onChange ? 'button' : undefined}
          tabIndex={onChange ? 0 : undefined}
          aria-label={onChange ? `Rate ${star} star${star > 1 ? 's' : ''}` : undefined}
          className={star <= value ? 'star filled' : 'star'}
          onClick={onChange ? () => onChange(star) : undefined}
        >
          ★
        </span>
      ))}
    </div>
  );
};

const ProductReviews = ({ productId, productName }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ customerName: '', email: '', rating: 5, comment: '' });

  useEffect(() => {
    let active = true;
    setLoading(true);
    reviewService.getProductReviews(productId).then((data) => {
      if (active) {
        setReviews(data);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [productId]);

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviews.length)
    : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.customerName.trim() || !form.comment.trim()) {
      setFormError('Please add your name and a short review.');
      return;
    }
    setSubmitting(true);
    try {
      await reviewService.submitReview({
        productId,
        productName,
        customerName: form.customerName.trim(),
        email: form.email.trim(),
        rating: form.rating,
        comment: form.comment.trim(),
      });
      setSubmitted(true);
      setShowForm(false);
      setForm({ customerName: '', email: '', rating: 5, comment: '' });
    } catch (err) {
      setFormError(err.message || 'Could not submit your review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="product-reviews" id="reviews">
      <div className="reviews-header">
        <div>
          <h3>Ratings &amp; Reviews</h3>
          {reviews.length > 0 ? (
            <div className="reviews-summary">
              <StarRating value={Math.round(avgRating)} />
              <span className="reviews-avg">{avgRating.toFixed(1)} out of 5</span>
              <span className="reviews-count">({reviews.length} review{reviews.length === 1 ? '' : 's'})</span>
            </div>
          ) : (
            !loading && <p className="reviews-empty-summary">No reviews yet — be the first to share your experience.</p>
          )}
        </div>
        <button type="button" className="btn btn-secondary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : 'Write a Review'}
        </button>
      </div>

      {submitted && (
        <div className="review-thank-you">
          Thank you! Your review has been submitted and will appear once approved.
        </div>
      )}

      {showForm && (
        <form className="review-form" onSubmit={handleSubmit}>
          <div className="review-form-row">
            <label>
              Your Rating
              <StarRating value={form.rating} onChange={(rating) => setForm((f) => ({ ...f, rating }))} />
            </label>
          </div>
          <div className="review-form-row review-form-grid">
            <label>
              Name
              <input
                type="text"
                value={form.customerName}
                onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                placeholder="Your name"
                required
              />
            </label>
            <label>
              Email (optional)
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
              />
            </label>
          </div>
          <label className="review-form-row">
            Your Review
            <textarea
              value={form.comment}
              onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
              placeholder="Share your experience with this product"
              rows={4}
              required
            />
          </label>
          {formError && <p className="review-form-error">{formError}</p>}
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      )}

      <div className="reviews-list">
        {loading ? (
          <p className="reviews-empty-summary">Loading reviews...</p>
        ) : (
          reviews.map((review) => (
            <div className="review-item" key={review.id}>
              <div className="review-item-head">
                <span className="review-author">{review.customerName}</span>
                <StarRating value={Number(review.rating)} />
              </div>
              {review.createdAt && (
                <span className="review-date">
                  {new Date(review.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              )}
              <p className="review-comment">{review.comment}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default ProductReviews;

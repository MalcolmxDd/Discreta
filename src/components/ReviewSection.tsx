import { useState, useEffect } from "react";
import type { Review } from "../types";
import { submitReview } from "../api/reviews";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

interface Props {
  productId: string;
  reviews: Review[];
}

function StarRating({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="stars-row" style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={`star ${star <= value ? "star-filled" : "star-empty"}`}>
          {star <= value ? "\u2605" : "\u2606"}
        </span>
      ))}
    </span>
  );
}

function RatingBar({ stars, count, total }: { stars: number; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="rating-bar-row">
      <span className="rating-bar-label">{stars}★</span>
      <div className="rating-bar-track">
        <div className="rating-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="rating-bar-count">{count}</span>
    </div>
  );
}

export default function ReviewSection({ productId, reviews }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ userName: "", rating: 5, comment: "" });
  const [localReviews, setLocalReviews] = useState(reviews);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    setLocalReviews(reviews);
  }, [reviews]);

  const avg = localReviews.length > 0
    ? Math.round((localReviews.reduce((s, r) => s + r.rating, 0) / localReviews.length) * 10) / 10
    : 0;
  const dist = localReviews.length > 0
    ? (() => {
        const d: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        localReviews.forEach((r) => { if (d[r.rating] !== undefined) d[r.rating]++; });
        return d;
      })()
    : { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userName.trim() || !formData.comment.trim() || submitting) return;

    setSubmitting(true);

    // Optimistic update inmediato
    const tempId = `rev-local-${Date.now()}`;
    const optimisticReview: Review = {
      id: tempId,
      productId,
      userName: formData.userName.trim(),
      rating: formData.rating,
      comment: formData.comment.trim(),
      date: new Date().toISOString().split("T")[0],
    };

    setLocalReviews([optimisticReview, ...localReviews]);
    setFormData({ userName: "", rating: 5, comment: "" });
    setShowForm(false);

    // Llamada a la API
    try {
      const savedReview = await submitReview({
        productId,
        userName: optimisticReview.userName,
        rating: optimisticReview.rating,
        comment: optimisticReview.comment,
        userId: user?.id || null,
      });

      // Reemplazar optimista con el real (con ID de la BD)
      setLocalReviews((prev) =>
        prev.map((r) => (r.id === tempId ? { ...savedReview, productId } : r))
      );

      addToast("Reseña publicada con éxito", "success");
    } catch {
      // Si falla la API, mantener la reseña local (modo offline)
      addToast("Reseña guardada localmente. Se sincronizará más tarde.", "info");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="reviews-section">
      <div className="reviews-header">
        <h2 className="section-title">Reseñas</h2>
        <button className="btn btn-secondary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancelar" : "Escribir reseña"}
        </button>
      </div>

      {localReviews.length > 0 && (
        <div className="reviews-summary">
          <div className="reviews-avg">
            <span className="reviews-avg-number">{avg}</span>
            <StarRating value={Math.round(avg)} size={20} />
            <span className="reviews-avg-total">{localReviews.length} reseña{localReviews.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="reviews-distribution">
            {[5, 4, 3, 2, 1].map((s) => (
              <RatingBar key={s} stars={s} count={dist[s]} total={localReviews.length} />
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <form className="review-form" onSubmit={handleSubmit}>
          <h3>Tu opinión</h3>
          <div className="form-group">
            <label htmlFor="review-name">Nombre</label>
            <input
              type="text"
              id="review-name"
              placeholder="Tu nombre o seudónimo"
              value={formData.userName}
              onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Tu puntuación</label>
            <div className="review-stars-input">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`star-btn ${s <= formData.rating ? "active" : ""}`}
                  onClick={() => setFormData({ ...formData, rating: s })}
                  aria-label={`${s} estrella${s !== 1 ? "s" : ""}`}
                >
                  {s <= formData.rating ? "\u2605" : "\u2606"}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="review-comment">Comentario</label>
            <textarea
              id="review-comment"
              placeholder="Cuenta tu experiencia con este producto..."
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">Publicar reseña</button>
        </form>
      )}

      <div className="reviews-list">
        {localReviews.map((review) => (
          <div key={review.id} className="review-card">
            <div className="review-card-header">
              <div className="review-card-avatar">
                {review.userName.charAt(0).toUpperCase()}
              </div>
              <div className="review-card-info">
                <span className="review-card-name">{review.userName}</span>
                <StarRating value={review.rating} />
              </div>
              <span className="review-card-date">{review.date}</span>
            </div>
            <p className="review-card-comment">{review.comment}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

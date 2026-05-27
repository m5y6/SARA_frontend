import { useState } from 'react';

export function RatingTab() {
  const [rating, setRating] = useState(4);
  const [comment, setComment] = useState('');

  return (
    <section className="panel-card">
      <header className="panel-head">
        <div>
          <p className="panel-kicker">Valoración</p>
          <h2>Calidad de respuesta</h2>
        </div>
      </header>

      <div className="rating-row" aria-label="Valoración con estrellas">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`star-button${star <= rating ? ' is-filled' : ''}`}
            onClick={() => setRating(star)}
          >
            ★
          </button>
        ))}
        <span>{rating}/5</span>
      </div>

      <label className="chat-input-label">
        Reportar error en reglamento
        <textarea
          rows="4"
          placeholder="Si la respuesta fue incorrecta, describe el problema..."
          value={comment}
          onChange={(event) => setComment(event.target.value)}
        />
      </label>

      <button type="button" className="primary-button">
        Enviar comentarios
      </button>
    </section>
  );
}
import React, { useEffect, useState } from 'react';
import { settingsApi } from '../services/adminApi';

const MAX_SLIDES = 6;
const MAX_IMAGES = 4;
const MAX_PAYLOAD = 9 * 1024 * 1024; // server accepts 10 MB per request

// An image is kept when it is an uploaded photo (data: URI), a web link, or a site path such as
// /CoverImage1.png (those files live in the website's public folder and display fine). Paths that
// do not actually load - for example an old /products/JewelsSet.jpeg - are dropped after a check.
const isEmbeddableImage = (src) =>
  typeof src === 'string' && (src.startsWith('data:') || /^https?:\/\//i.test(src) || src.startsWith('/'));

const imageLoads = (src) => new Promise((resolve) => {
  if (src.startsWith('data:')) return resolve(true);
  const img = new Image();
  img.onload = () => resolve(true);
  img.onerror = () => resolve(false);
  img.src = src;
});

const parseSlides = (value) => {
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      let hadLegacyPaths = false;
      const cleaned = parsed.map((slide) => {
        const validImages = (slide.images || []).filter(isEmbeddableImage);
        if (validImages.length !== (slide.images || []).length) hadLegacyPaths = true;
        return { ...slide, images: validImages };
      });
      return { slides: cleaned, hadLegacyPaths };
    }
  } catch (e) { /* ignore */ }
  return { slides: [], hadLegacyPaths: false };
};

// Shrinks an uploaded photo so several of them fit comfortably in the database.
function fileToCompressedDataUrl(file, maxSide = 1200, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Could not read "${file.name}" as an image`));
    };
    img.src = url;
  });
}

const blankSlide = () => ({
  id: `slide-${Date.now()}`,
  badge: 'NEW COLLECTION',
  tagline: 'Handcrafted with love',
  collectionName: 'NEW COLLECTION',
  description: 'Describe this collection in one line',
  buttonText: 'EXPLORE NOW',
  link: '/shop',
  images: [],
});

const fieldStyle = { width: '100%', padding: '0.5rem', marginTop: '0.25rem', borderRadius: 6, border: '1px solid #ddd', fontFamily: 'inherit' };
const miniBtn = { border: '1px solid #ccc', background: '#fff', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontSize: '0.8rem' };

const HeroSlidesEditor = ({ value, onSaved }) => {
  const [slides, setSlides] = useState(() => parseSlides(value).slides);
  const [hadLegacy, setHadLegacy] = useState(() => parseSlides(value).hadLegacyPaths);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let removed = false;
      const checked = await Promise.all(slides.map(async (slide) => {
        const keep = [];
        for (const src of slide.images || []) {
          if (await imageLoads(src)) keep.push(src); else removed = true;
        }
        return { ...slide, images: keep };
      }));
      if (!cancelled && removed) {
        setSlides(checked);
        setHadLegacy(true);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const patch = (index, changes) =>
    setSlides((cur) => cur.map((s, i) => (i === index ? { ...s, ...changes } : s)));

  const move = (list, from, to) => {
    if (to < 0 || to >= list.length) return list;
    const next = [...list];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
  };

  const addImages = async (index, fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setError('');
    setBusy(true);
    try {
      const room = MAX_IMAGES - (slides[index].images || []).length;
      if (room <= 0) throw new Error(`A slide can have at most ${MAX_IMAGES} images.`);
      const urls = await Promise.all(files.slice(0, room).map((f) => fileToCompressedDataUrl(f)));
      patch(index, { images: [...(slides[index].images || []), ...urls] });
      if (files.length > room) setError(`Only ${room} more image(s) fit on this slide - extra files were skipped.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const resetToDefaults = async () => {
    if (!window.confirm('Reset hero slides to built-in defaults? This will overwrite the current slides saved in the database.')) return;
    setError('');
    setMessage('');
    setSaving(true);
    try {
      const result = await settingsApi.resetHero();
      setMessage('Hero slides reset to defaults. The page will reload to show them.');
      setTimeout(() => window.location.reload(), 1500);
      if (onSaved) onSaved(result.settings);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const save = async () => {
    setError('');
    setMessage('');
    const empty = slides.findIndex((s) => !(s.images || []).length);
    if (!slides.length) return setError('Add at least one slide.');
    if (empty !== -1) return setError(`Slide ${empty + 1} has no images. Add at least one image or remove the slide.`);
    const json = JSON.stringify(slides);
    if (json.length > MAX_PAYLOAD) return setError('The images are too large in total. Remove a few images or slides and try again.');
    setSaving(true);
    try {
      const updated = await settingsApi.update({ heroSlides: json });
      if (onSaved) onSaved(updated);
      setMessage('Hero slides saved. The homepage shows them straight away.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-panel-card" style={{ marginBottom: '1.5rem', border: '2px solid #b8860b' }}>
      <div className="panel-heading">
        <div>
          <span>HOMEPAGE</span>
          <h2>Hero Section Slides</h2>
        </div>
        <button type="button" className="save-btn ghost" disabled={slides.length >= MAX_SLIDES} onClick={() => setSlides((c) => [...c, blankSlide()])}>
          + Add slide
        </button>
      </div>
      <p className="api-key-hint" style={{ margin: '0 0 1rem', color: '#555' }}>
        Each slide shows up to {MAX_IMAGES} photos (1 to {MAX_IMAGES} all work) beside a text card. The brand name and logo stay fixed.
        Upload your own photos or remove any slide you do not want. Up to {MAX_SLIDES} slides.
      </p>

      {hadLegacy && (
        <div className="admin-error" style={{ background: '#fff8e1', borderColor: '#f9a825', color: '#5d4037' }}>
          ⚠️ Some images stored in the database were old file-path references (e.g.{' '}
          <code>JewelsSet.jpeg</code>) that do not exist on the server. They have been
          removed from the preview. Please <strong>re-upload replacement photos</strong> for
          each slide below and click <strong>Save hero slides</strong>.
        </div>
      )}
      {message && <div className="admin-success">{message}</div>}
      {error && <div className="admin-error">{error}</div>}

      {slides.map((slide, index) => (
        <div key={slide.id || index} style={{ border: '1px solid #e5d9b6', borderRadius: 10, padding: '1rem', marginBottom: '1rem', background: '#fffdf7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', gap: 8, flexWrap: 'wrap' }}>
            <strong>Slide {index + 1}: {slide.collectionName || 'Untitled'}</strong>
            <span style={{ display: 'flex', gap: 6 }}>
              <button type="button" style={miniBtn} disabled={index === 0} onClick={() => setSlides((c) => move(c, index, index - 1))}>Move up</button>
              <button type="button" style={miniBtn} disabled={index === slides.length - 1} onClick={() => setSlides((c) => move(c, index, index + 1))}>Move down</button>
              <button
                type="button"
                style={{ ...miniBtn, color: '#b3261e', borderColor: '#e6b3b0' }}
                disabled={slides.length <= 1}
                onClick={() => window.confirm(`Remove slide ${index + 1}?`) && setSlides((c) => c.filter((_, i) => i !== index))}
              >
                Remove slide
              </button>
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: '0.6rem' }}>
            {(slide.images || []).map((src, imgIndex) => (
              <div key={imgIndex} style={{ width: 110, textAlign: 'center' }}>
                <img src={src} alt={`Slide ${index + 1} ${imgIndex + 1}`} style={{ width: 110, height: 110, objectFit: 'cover', borderRadius: 8, border: '1px solid #ddd', display: 'block' }} />
                <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 4 }}>
                  <button type="button" style={miniBtn} disabled={imgIndex === 0} onClick={() => patch(index, { images: move(slide.images, imgIndex, imgIndex - 1) })} aria-label="Move image earlier">&larr;</button>
                  <button type="button" style={miniBtn} disabled={imgIndex === slide.images.length - 1} onClick={() => patch(index, { images: move(slide.images, imgIndex, imgIndex + 1) })} aria-label="Move image later">&rarr;</button>
                  <button type="button" style={{ ...miniBtn, color: '#b3261e' }} onClick={() => patch(index, { images: slide.images.filter((_, i) => i !== imgIndex) })} aria-label="Remove image">&times;</button>
                </div>
              </div>
            ))}
            {(slide.images || []).length < MAX_IMAGES && (
              <label style={{ width: 110, height: 110, border: '2px dashed #b8860b', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', cursor: 'pointer', color: '#8a6508', fontSize: '0.85rem' }}>
                {busy ? 'Reading...' : '+ Add images'}
                <input type="file" accept="image/*" multiple hidden onChange={(e) => { addImages(index, e.target.files); e.target.value = ''; }} />
              </label>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
            <label>Badge (corner label)<input style={fieldStyle} value={slide.badge || ''} onChange={(e) => patch(index, { badge: e.target.value })} /></label>
            <label>Tagline (small italic line)<input style={fieldStyle} value={slide.tagline || ''} onChange={(e) => patch(index, { tagline: e.target.value })} /></label>
            <label>Collection title<input style={fieldStyle} value={slide.collectionName || ''} onChange={(e) => patch(index, { collectionName: e.target.value })} /></label>
            <label>Button text<input style={fieldStyle} value={slide.buttonText || ''} onChange={(e) => patch(index, { buttonText: e.target.value })} /></label>
            <label>Button link<input style={fieldStyle} value={slide.link || ''} onChange={(e) => patch(index, { link: e.target.value })} placeholder="/shop" /></label>
            <label style={{ gridColumn: '1 / -1' }}>Description<textarea rows={2} style={{ ...fieldStyle, resize: 'vertical' }} value={slide.description || ''} onChange={(e) => patch(index, { description: e.target.value })} /></label>
          </div>
        </div>
      ))}

      <div className="modal-actions" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button type="button" className="save-btn" disabled={saving || busy} onClick={save} style={{ background: '#b8860b', color: '#fff' }}>
          {saving ? 'Saving...' : 'Save hero slides'}
        </button>
        <button
          type="button"
          className="save-btn ghost"
          disabled={saving || busy}
          onClick={resetToDefaults}
          style={{ borderColor: '#b3261e', color: '#b3261e' }}
          title="Restore the built-in default slides, clearing any stale image paths"
        >
          Reset to defaults
        </button>
      </div>
    </div>
  );
};

export default HeroSlidesEditor;

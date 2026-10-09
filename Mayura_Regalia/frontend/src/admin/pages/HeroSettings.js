import React, { useEffect, useState } from 'react';
import { settingsApi } from '../services/adminApi';
import HeroSlidesEditor from './HeroSlidesEditor';

const HeroSettings = () => {
  const [value, setValue] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    settingsApi.get().then((s) => setValue(s.heroSlides || '')).catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="admin-error">{error}</div>;
  if (value === null) return <div className="admin-loading">Loading hero slides...</div>;
  return (
    <section>
      <HeroSlidesEditor value={value} />
    </section>
  );
};

export default HeroSettings;

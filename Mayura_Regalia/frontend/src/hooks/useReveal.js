import { useEffect, useRef } from 'react';

/**
 * Attaches an IntersectionObserver to the returned ref and toggles the
 * `in-view` class (paired with the `.reveal-up` utility class) once the
 * element scrolls into the viewport, giving sections a gentle fade/rise
 * entrance instead of popping in.
 */
const useReveal = (options = { threshold: 0.15 }) => {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    if (typeof IntersectionObserver === 'undefined') {
      node.classList.add('in-view');
      return undefined;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        node.classList.add('in-view');
        observer.unobserve(node);
      }
    }, options);

    observer.observe(node);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ref;
};

export default useReveal;

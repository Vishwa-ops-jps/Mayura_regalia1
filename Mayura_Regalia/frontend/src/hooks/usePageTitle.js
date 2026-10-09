import { useEffect } from 'react';

const BASE = 'MAYURA REGALIA';

// Sets the browser tab title (and optionally the meta description) for the current page.
export default function usePageTitle(title, description) {
  useEffect(() => {
    document.title = title ? `${title} | ${BASE}` : `${BASE} - Premium Jewellery`;
    if (description) {
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute('content', description);
    }
  }, [title, description]);
}

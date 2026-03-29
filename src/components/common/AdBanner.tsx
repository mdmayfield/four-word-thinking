import { useEffect } from 'react';
import styles from './AdBanner.module.css';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const ADSENSE_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT?.trim();
const ADSENSE_SLOT = import.meta.env.VITE_ADSENSE_SLOT?.trim();

const isAdEnabled = Boolean(import.meta.env.PROD && ADSENSE_CLIENT && ADSENSE_SLOT);

const AdBanner = () => {
  useEffect(() => {
    if (!isAdEnabled) return;

    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch {
      // AdSense can throw when script is blocked; fail silently.
    }
  }, []);

  if (!isAdEnabled) return null;

  return (
    <div className={styles.adShell} aria-label="Advertisement">
      <ins
        className={`adsbygoogle ${styles.adInner}`}
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={ADSENSE_SLOT}
        data-ad-format="horizontal"
      />
    </div>
  );
};

export default AdBanner;
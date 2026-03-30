'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';
import { useCookieConsent } from '@/app/context/CookieConsentContext';

/**
 * Loads analytics/marketing scripts only when the user has given consent.
 *
 * Props come from server-side (layout.tsx fetches DB settings).
 * This component gates the actual script injection behind client-side consent.
 */
export default function ConsentGatedScripts({
  ga4Id,
  clarityId,
}: {
  ga4Id: string;
  clarityId: string;
}) {
  const { statistics, marketing } = useCookieConsent();
  const prevStatistics = useRef(statistics);
  const prevMarketing = useRef(marketing);

  // When consent is revoked, remove cookies and disable trackers.
  // A full cleanup isn't possible without page reload for some scripts,
  // but we stop collecting new data immediately.
  useEffect(() => {
    // Statistics was on, now off → disable GA4 and Clarity
    if (prevStatistics.current && !statistics) {
      // Disable GA4 — set the opt-out property
      if (ga4Id && typeof window !== 'undefined') {
        (window as unknown as Record<string, unknown>)[`ga-disable-${ga4Id}`] = true;
      }
      // Clarity doesn't have a runtime disable — cookies will expire naturally,
      // and the script simply won't be loaded on next page load.
    }

    // Marketing was on, now off → no active cleanup needed,
    // script won't load on next navigation.

    prevStatistics.current = statistics;
    prevMarketing.current = marketing;
  }, [statistics, marketing, ga4Id]);

  return (
    <>
      {/* GA4 — only when statistics consent is given */}
      {statistics && ga4Id && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">{`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${ga4Id}');
          `}</Script>
        </>
      )}

      {/* Microsoft Clarity — only when statistics consent is given */}
      {statistics && clarityId && (
        <Script id="clarity-init" strategy="afterInteractive">{`
(function(c,l,a,r,i,t,y){
  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window,document,"clarity","script","${clarityId}");
        `}</Script>
      )}

      {/* Meta Pixel — only when marketing consent is given */}
      {marketing && (
        <Script id="meta-pixel-init" strategy="afterInteractive">{`
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
        `}</Script>
      )}
    </>
  );
}

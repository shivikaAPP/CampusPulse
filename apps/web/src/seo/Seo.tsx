import { useEffect } from 'react';

export interface SeoProps {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
}

export function Seo({ title, description, path, noindex }: SeoProps) {
  const base = import.meta.env.VITE_SITE_URL || '';
  const canonicalUrl = `${base}${path}`;

  useEffect(() => {
    document.title = title;

    // Update meta description
    let descMeta = document.querySelector('meta[name="description"]');
    if (!descMeta) {
      descMeta = document.createElement('meta');
      descMeta.setAttribute('name', 'description');
      document.head.appendChild(descMeta);
    }
    descMeta.setAttribute('content', description);

    // Update canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    // Update robots meta
    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (noindex) {
      if (!robotsMeta) {
        robotsMeta = document.createElement('meta');
        robotsMeta.setAttribute('name', 'robots');
        document.head.appendChild(robotsMeta);
      }
      robotsMeta.setAttribute('content', 'noindex');
    } else if (robotsMeta) {
      robotsMeta.remove();
    }
  }, [title, description, canonicalUrl, noindex]);

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      {noindex && <meta name="robots" content="noindex" />}
    </>
  );
}

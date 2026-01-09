import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * SEO Component - Manages page titles and meta descriptions
 * Usage: <SEO title="Page Title" description="Page description" />
 */
const SEO = ({ title, description, keywords, ogImage, ogType = 'website' }) => {
  const location = useLocation();
  const baseTitle = 'GetGlory';
  // If title is provided, use it as-is (should already be in format: "Main Title | Secondary - Brand")
  // Otherwise, use default homepage title
  const fullTitle = title || 'Online CV Builder in Pakistan | Free Resume Maker - GetGlory';
  const defaultDescription = 'Create professional CVs online in Pakistan. Free resume builder with modern templates. Download PDF and print your CV instantly. Get Glory offers the best CV builder and resume maker tools.';
  const metaDescription = description || defaultDescription;
  const canonicalUrl = `https://getglory.pk${location.pathname}`;

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Update or create meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', metaDescription);

    // Update or create meta keywords
    if (keywords) {
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute('content', keywords);
    }

    // Update or create canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);

    // Open Graph meta tags
    const updateOGTag = (property, content) => {
      if (!content) return;
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    updateOGTag('og:title', fullTitle);
    updateOGTag('og:description', metaDescription);
    updateOGTag('og:url', canonicalUrl);
    updateOGTag('og:type', ogType);
    if (ogImage) {
      updateOGTag('og:image', ogImage);
    }

    // Twitter Card meta tags
    updateOGTag('twitter:card', 'summary_large_image');
    updateOGTag('twitter:title', fullTitle);
    updateOGTag('twitter:description', metaDescription);
    if (ogImage) {
      updateOGTag('twitter:image', ogImage);
    }
  }, [fullTitle, metaDescription, keywords, canonicalUrl, ogImage, ogType]);

  return null; // This component doesn't render anything
};

export default SEO;


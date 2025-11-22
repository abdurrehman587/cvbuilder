import React, { useState, useEffect } from 'react';
import { supabase } from '../Supabase/supabase';
import './ProductDetail.css';

const ProductDetail = ({ productId }) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('marketplace_products')
          .select('*, marketplace_sections(name)')
          .eq('id', productId)
          .single();

        if (error) throw error;
        setProduct(data);
      } catch (err) {
        console.error('Error loading product:', err);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      loadProduct();
    }
  }, [productId]);

  // Helper function to get product images
  const getProductImages = (product) => {
    if (!product) return [];
    
    if (product.image_urls) {
      let imageArray = product.image_urls;
      if (typeof imageArray === 'string') {
        try {
          imageArray = JSON.parse(imageArray);
        } catch (e) {
          console.error('Error parsing image_urls:', e);
        }
      }
      
      if (Array.isArray(imageArray) && imageArray.length > 0) {
        return imageArray;
      }
    }
    
    if (product.image_url) {
      return [product.image_url];
    }
    
    return [];
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!product) return;
      const images = getProductImages(product);
      if (images.length > 1) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
        }
      }
      if (e.key === 'Escape') {
        window.location.href = '/#products';
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [product]);

  if (loading) {
    return (
      <div className="product-detail-page">
        <div className="product-detail-loading">
          <p>Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail-page">
        <div className="product-detail-error">
          <h2>Product Not Found</h2>
          <button onClick={() => window.location.href = '/#products'} className="back-button">
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  const images = getProductImages(product);

  return (
    <div className="product-detail-page">
      <div className="product-detail-container">
        <button 
          className="product-detail-back-button"
          onClick={() => window.location.href = '/#products'}
        >
          ← Back to Products
        </button>

        <div className="product-detail-content">
          {/* Product Images Section */}
          <div className="product-detail-images-section">
            {images.length === 0 ? (
              <div className="product-detail-image-placeholder">
                <span className="product-placeholder-icon-large">📦</span>
                <p>No images available</p>
              </div>
            ) : (
              <>
                <div className="product-detail-main-image-container">
                  <img 
                    src={images[currentImageIndex]} 
                    alt={`${product.name} - Image ${currentImageIndex + 1}`}
                    className="product-detail-main-image"
                  />
                  {images.length > 1 && (
                    <>
                      <button 
                        className="product-detail-nav product-detail-nav-prev"
                        onClick={() => setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                        aria-label="Previous image"
                      >
                        ‹
                      </button>
                      <button 
                        className="product-detail-nav product-detail-nav-next"
                        onClick={() => setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                        aria-label="Next image"
                      >
                        ›
                      </button>
                      <div className="product-detail-image-indicator">
                        {currentImageIndex + 1} / {images.length}
                      </div>
                    </>
                  )}
                </div>
                
                {images.length > 1 && (
                  <div className="product-detail-thumbnails">
                    {images.map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`${product.name} thumbnail ${index + 1}`}
                        className={`product-detail-thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                        onClick={() => setCurrentImageIndex(index)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Product Details Section */}
          <div className="product-detail-info-section">
            <h1 className="product-detail-title">{product.name}</h1>
            <div className="product-detail-price">Rs. {product.price?.toLocaleString() || '0'}</div>
            
            {product.marketplace_sections && (
              <div className="product-detail-category">
                <span className="product-detail-category-label">Category:</span>
                <span className="product-detail-category-name">{product.marketplace_sections.name}</span>
              </div>
            )}

            {product.description && (
              <div className="product-detail-description">
                <h2>Description</h2>
                <p>{product.description}</p>
              </div>
            )}

            <div className="product-detail-actions">
              <button className="product-detail-contact-btn">
                Contact Seller
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;


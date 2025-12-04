import React, { useState, useEffect } from 'react';
import { supabase } from '../Supabase/supabase';
import { addToCart, isInCart } from '../../utils/cart';
import './ProductDetail.css';

const ProductDetail = ({ productId }) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const [inCart, setInCart] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

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
        // Check if product is already in cart
        if (data) {
          setInCart(isInCart(data.id));
          // Load related products from the same section
          if (data.section_id) {
            loadRelatedProducts(data.section_id, data.id, data.name);
          }
        }
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

  // Load related products from the same section
  const loadRelatedProducts = async (sectionId, currentProductId, currentProductName) => {
    try {
      setLoadingRelated(true);
      const { data, error } = await supabase
        .from('marketplace_products')
        .select('*, marketplace_sections(name)')
        .eq('section_id', sectionId)
        .neq('id', currentProductId) // Exclude current product
        .order('created_at', { ascending: false })
        .limit(20); // Fetch more products to sort by relevance

      if (error) throw error;
      
      // Sort products by name similarity to prioritize products with similar names
      const sortedProducts = sortProductsByRelevance(data || [], currentProductName);
      
      // Limit to 8 products after sorting
      setRelatedProducts(sortedProducts.slice(0, 8));
    } catch (err) {
      console.error('Error loading related products:', err);
    } finally {
      setLoadingRelated(false);
    }
  };

  // Sort products by relevance to current product name
  const sortProductsByRelevance = (products, currentProductName) => {
    if (!currentProductName || products.length === 0) {
      return products;
    }

    // Extract keywords from current product name (lowercase, remove common words)
    const currentNameLower = currentProductName.toLowerCase();
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from'];
    const currentKeywords = currentNameLower
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.includes(word));

    // Sort products by relevance score
    const scoredProducts = products.map(product => {
      const productNameLower = (product.name || '').toLowerCase();
      let score = 0;

      // Check for exact keyword matches
      currentKeywords.forEach(keyword => {
        if (productNameLower.includes(keyword)) {
          // Higher score for longer keyword matches
          score += keyword.length * 10;
          // Bonus if keyword appears at the start of the product name
          if (productNameLower.startsWith(keyword)) {
            score += 20;
          }
        }
      });

      // Bonus for products with more matching keywords
      const matchingKeywords = currentKeywords.filter(keyword => 
        productNameLower.includes(keyword)
      ).length;
      score += matchingKeywords * 5;

      return { product, score };
    });

    // Sort by score (highest first), then by created_at (newest first) as tiebreaker
    scoredProducts.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // If scores are equal, sort by created_at (newest first)
      const dateA = new Date(a.product.created_at || 0);
      const dateB = new Date(b.product.created_at || 0);
      return dateB - dateA;
    });

    return scoredProducts.map(item => item.product);
  };

  // Listen for cart updates
  useEffect(() => {
    const handleCartUpdate = () => {
      if (product) {
        setInCart(isInCart(product.id));
      }
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, [product]);

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

  // Handle related product click
  const handleRelatedProductClick = (relatedProductId) => {
    window.location.href = `/#product/${relatedProductId}`;
  };

  // Handle add to cart for related products
  const handleRelatedAddToCart = (e, relatedProduct) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(relatedProduct);
    // Trigger cart update event
    window.dispatchEvent(new CustomEvent('cartUpdated'));
  };

  // Handle buy now for related products
  const handleRelatedBuyNow = (e, relatedProduct) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(relatedProduct);
    window.location.href = '/#checkout';
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

  // Handle add to cart
  const handleAddToCart = () => {
    if (!product) return;
    
    addToCart(product);
    setAddedToCart(true);
    setInCart(true);
    
    // Reset success message after 3 seconds
    setTimeout(() => {
      setAddedToCart(false);
    }, 3000);
  };

  // Handle buy now
  const handleBuyNow = () => {
    if (!product) return;
    
    // Add product to cart first
    addToCart(product);
    setInCart(true);
    
    // Navigate directly to checkout
    window.location.href = '/#checkout';
  };

  // Helper function to render description (HTML or plain text)
  const renderDescription = (description) => {
    if (!description) return null;
    
    // Check if description contains HTML tags
    const isHtml = /<[a-z][\s\S]*>/i.test(description);
    
    if (isHtml) {
      // Render HTML content (from rich text editor)
      return (
        <div 
          className="product-detail-description-html"
          dangerouslySetInnerHTML={{ __html: description }}
        />
      );
    } else {
      // Plain text - convert to bulleted list (backward compatibility)
      const lines = description.split('\n').filter(line => line.trim().length > 0);
      if (lines.length === 0) return null;
      
      return (
        <ul className="product-detail-description-list">
          {lines.map((line, index) => (
            <li key={index}>{line.trim()}</li>
          ))}
        </ul>
      );
    }
  };

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
            <div className="product-detail-price-container">
              {product.original_price && product.original_price > product.price ? (
                <>
                  <div className="product-detail-price-discounted">Rs. {product.price?.toLocaleString() || '0'}</div>
                  <div className="product-detail-price-original">Rs. {product.original_price?.toLocaleString() || '0'}</div>
                </>
              ) : (
                <div className="product-detail-price">Rs. {product.price?.toLocaleString() || '0'}</div>
              )}
            </div>
            
            {product.marketplace_sections && (
              <div className="product-detail-category">
                <span className="product-detail-category-label">Category:</span>
                <span className="product-detail-category-name">{product.marketplace_sections.name}</span>
              </div>
            )}

            {product.description && (
              <div className="product-detail-description">
                <h2>Description</h2>
                {renderDescription(product.description)}
              </div>
            )}

            <div className="product-detail-actions">
              <button 
                className="product-detail-buy-now-btn"
                onClick={handleBuyNow}
              >
                Buy Now
              </button>
              <button 
                className={`product-detail-contact-btn ${inCart ? 'in-cart' : ''}`}
                onClick={handleAddToCart}
                disabled={addedToCart}
              >
                {addedToCart ? '✓ Added to Cart' : inCart ? 'Already in Cart' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="related-products-section">
            <div className="related-products-header">
              <h2 className="related-products-title">Related Products</h2>
              <div className="related-products-divider"></div>
            </div>
            {loadingRelated ? (
              <div className="related-products-loading">
                <p>Loading related products...</p>
              </div>
            ) : (
              <div className="related-products-grid">
                {relatedProducts.map((relatedProduct) => {
                  const relatedImages = getProductImages(relatedProduct);
                  const relatedInCart = isInCart(relatedProduct.id);
                  
                  return (
                    <div
                      key={relatedProduct.id}
                      className="related-product-card"
                      onClick={() => handleRelatedProductClick(relatedProduct.id)}
                    >
                      <div className="related-product-image-wrapper">
                        {relatedImages.length > 0 ? (
                          <img
                            src={relatedImages[0]}
                            alt={relatedProduct.name}
                            className="related-product-image"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="related-product-placeholder">
                            <span className="related-product-placeholder-icon">📦</span>
                          </div>
                        )}
                      </div>
                      <div className="related-product-body">
                        <h4 className="related-product-name">{relatedProduct.name}</h4>
                        <div className="related-product-footer">
                          <div className="related-product-price-container">
                            {relatedProduct.original_price && relatedProduct.original_price > relatedProduct.price ? (
                              <>
                                <span className="related-product-price-discounted">
                                  Rs. {relatedProduct.price?.toLocaleString() || '0'}
                                </span>
                                <span className="related-product-price-original">
                                  Rs. {relatedProduct.original_price?.toLocaleString() || '0'}
                                </span>
                              </>
                            ) : (
                              <span className="related-product-price">
                                Rs. {relatedProduct.price?.toLocaleString() || '0'}
                              </span>
                            )}
                          </div>
                          <div className="related-product-action-buttons">
                            <button
                              className="related-product-buy-now-btn"
                              onClick={(e) => handleRelatedBuyNow(e, relatedProduct)}
                              title="Buy Now"
                            >
                              Buy Now
                            </button>
                            <button
                              className={`related-product-add-to-cart-btn ${relatedInCart ? 'in-cart' : ''}`}
                              onClick={(e) => handleRelatedAddToCart(e, relatedProduct)}
                              title="Add to Cart"
                            >
                              {relatedInCart ? 'In Cart' : 'Add to Cart'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="related-products-footer">
              <button
                className="related-products-back-button"
                onClick={() => window.location.href = '/#products'}
              >
                ← Back to All Products
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;


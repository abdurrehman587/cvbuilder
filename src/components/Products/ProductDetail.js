import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, authService } from '../Supabase/supabase';
import { addToCart, isInCart } from '../../utils/cart';
import './ProductDetail.css';

const ProductDetail = ({ productId }) => {
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [inCart, setInCart] = useState(false);
  const [adminShopName, setAdminShopName] = useState('Glory');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const isAuthenticated = localStorage.getItem('cvBuilderAuth') === 'true';
  
  // Load product data
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!productId) return;

    const loadProduct = async () => {
      try {
        setLoading(true);
        
        // Load admin shop name
        try {
          const { data: adminUsers } = await supabase
            .from('users')
            .select('shop_name')
            .eq('is_admin', true)
            .limit(1)
            .single();
          
          if (adminUsers?.shop_name) {
            setAdminShopName(adminUsers.shop_name);
          }
        } catch (err) {
          // Silent fail
        }
        
        // Load product
        const { data, error } = await supabase
          .from('marketplace_products')
          .select('*, marketplace_sections(name), shopkeeper:users!shopkeeper_id(shop_name)')
          .eq('id', productId)
          .or('is_hidden.is.null,is_hidden.eq.false')
          .single();

        if (error) throw error;
        
        setProduct(data);
        if (data) {
          setInCart(isInCart(data.id));
          loadReviews(data.id);
          // Load related products
          if (data.section_id) {
            loadRelatedProducts(data.section_id, data.id);
          }
        }
      } catch (err) {
        console.error('Error loading product:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  // Load related products
  const loadRelatedProducts = async (sectionId, currentProductId) => {
    try {
      const { data, error } = await supabase
        .from('marketplace_products')
        .select('*, marketplace_sections(name)')
        .eq('section_id', sectionId)
        .neq('id', currentProductId)
        .or('is_hidden.is.null,is_hidden.eq.false')
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) throw error;
      setRelatedProducts(data || []);
    } catch (err) {
      console.error('Error loading related products:', err);
    }
  };

  // Load product reviews
  const loadReviews = async (pid) => {
    if (!pid) return;
    try {
      setReviewsLoading(true);
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*, reviewer:users!user_id(full_name, email)')
        .eq('product_id', pid)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);

      // Check if current user has already reviewed
      if (isAuthenticated) {
        const user = await authService.getCurrentUser();
        if (user) {
          const myReview = (data || []).find(r => r.user_id === user.id);
          setUserReview(myReview || null);
        }
      } else {
        setUserReview(null);
      }
    } catch (err) {
      console.error('Error loading reviews:', err);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
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

  // Get product images
  const getProductImages = (product) => {
    if (!product) return [];
    
    if (product.image_urls) {
      let imageArray = product.image_urls;
      if (typeof imageArray === 'string') {
        try {
          imageArray = JSON.parse(imageArray);
        } catch (e) {
          return [];
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

  // Handlers
  const handleAddToCart = () => {
    if (!product || (product.stock || 0) === 0) {
      alert('This product is out of stock.');
      return;
    }
    addToCart(product);
    setInCart(true);
    window.dispatchEvent(new CustomEvent('cartUpdated'));
  };

  const handleBuyNow = () => {
    if (!product || (product.stock || 0) === 0) {
      alert('This product is out of stock.');
      return;
    }
    addToCart(product);
    navigate('/checkout');
  };

  const handleBack = () => {
    window.location.href = '/marketplace';
  };

  const handleRelatedProductClick = (relatedProductId) => {
    window.location.href = `/#product/${relatedProductId}`;
  };

  const handleRelatedAddToCart = (e, relatedProduct) => {
    e.stopPropagation();
    if ((relatedProduct.stock || 0) === 0) {
      alert('This product is out of stock.');
      return;
    }
    addToCart(relatedProduct);
    window.dispatchEvent(new CustomEvent('cartUpdated'));
  };

  const handleRelatedBuyNow = (e, relatedProduct) => {
    e.stopPropagation();
    if ((relatedProduct.stock || 0) === 0) {
      alert('This product is out of stock.');
      return;
    }
    addToCart(relatedProduct);
    navigate('/checkout');
  };

  // Submit or update review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!product || !isAuthenticated || submittingReview) return;
    const user = await authService.getCurrentUser();
    if (!user) {
      alert('Please sign in to leave a review.');
      return;
    }
    if (!reviewForm.rating || reviewForm.rating < 1 || reviewForm.rating > 5) {
      alert('Please select a rating (1-5 stars).');
      return;
    }
    try {
      setSubmittingReview(true);
      if (userReview) {
        const { error } = await supabase
          .from('product_reviews')
          .update({ rating: reviewForm.rating, comment: reviewForm.comment.trim() || null })
          .eq('id', userReview.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('product_reviews')
          .insert({
            product_id: product.id,
            user_id: user.id,
            rating: reviewForm.rating,
            comment: reviewForm.comment.trim() || null
          });
        if (error) throw error;
      }
      setShowReviewForm(false);
      setReviewForm({ rating: 5, comment: '' });
      loadReviews(product.id);
    } catch (err) {
      console.error('Error submitting review:', err);
      alert(err.message || 'Failed to submit review. You may have already reviewed this product.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const formatReviewDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Loading state
  if (loading) {
    return (
      <div className="product-detail-page">
        <div className="product-detail-loading">Loading...</div>
      </div>
    );
  }

  // Error state
  if (!product) {
    return (
      <div className="product-detail-page">
        <div className="product-detail-error">
          <h2>Product Not Found</h2>
          <button onClick={handleBack} className="back-button">Back to Products</button>
        </div>
      </div>
    );
  }

  const images = getProductImages(product);
  const isOutOfStock = (product.stock || 0) === 0;

  return (
    <div className="product-detail-page">
      <div className="product-detail-container">
        <button onClick={handleBack} className="product-detail-back-button">← Back</button>

        <div className="product-detail-content">
          {/* Images */}
          <div className="product-detail-images">
            {images.length === 0 ? (
              <div className="product-detail-image-placeholder">📦 No Image</div>
            ) : (
              <>
                <div className="product-detail-main-image-wrapper">
                  <img 
                    src={images[currentImageIndex]} 
                    alt={product.name}
                    className="product-detail-main-image"
                    loading="lazy"
                  />
                  {images.length > 1 && (
                    <>
                      <button 
                        className="product-detail-nav product-detail-nav-prev"
                        onClick={() => setCurrentImageIndex((prev) => prev > 0 ? prev - 1 : images.length - 1)}
                      >
                        ‹
                      </button>
                      <button 
                        className="product-detail-nav product-detail-nav-next"
                        onClick={() => setCurrentImageIndex((prev) => prev < images.length - 1 ? prev + 1 : 0)}
                      >
                        ›
                      </button>
                      <div className="product-detail-image-counter">
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
                        alt={`${product.name} ${index + 1}`}
                        className={`product-detail-thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                        onClick={() => setCurrentImageIndex(index)}
                        loading="lazy"
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Info */}
          <div className="product-detail-info">
            <h1 className="product-detail-title">{product.name}</h1>
            
            <div className="product-detail-price">
              {product.original_price && product.original_price > product.price ? (
                <>
                  <span className="product-detail-price-current">Rs. {product.price?.toLocaleString() || '0'}</span>
                  <span className="product-detail-price-old">Rs. {product.original_price?.toLocaleString() || '0'}</span>
                </>
              ) : (
                <span className="product-detail-price-current">Rs. {product.price?.toLocaleString() || '0'}</span>
              )}
            </div>
            
            {product.marketplace_sections && (
              <div className="product-detail-category">
                Category: {product.marketplace_sections.name}
              </div>
            )}

            <div className="product-detail-uploader">
              By: {product.shopkeeper_id && product.shopkeeper?.shop_name 
                ? product.shopkeeper.shop_name 
                : product.shopkeeper_id 
                  ? 'Shop' 
                  : adminShopName}
            </div>

            {isOutOfStock && (
              <div className="product-detail-stock">❌ Out of Stock</div>
            )}

            {product.description && (
              <div className="product-detail-description">
                <h2>Description</h2>
                <div 
                  className="product-detail-description-text"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            )}

            <div className="product-detail-actions">
              <button 
                className="product-detail-buy-btn"
                onClick={handleBuyNow}
                disabled={isOutOfStock}
              >
                {isOutOfStock ? 'Out of Stock' : 'Buy Now'}
              </button>
              <button 
                className={`product-detail-cart-btn ${inCart ? 'in-cart' : ''}`}
                onClick={handleAddToCart}
                disabled={isOutOfStock}
              >
                {isOutOfStock ? 'Out of Stock' : inCart ? 'In Cart' : 'Add to Cart'}
              </button>
            </div>

            {/* Customer Reviews */}
            <div className="product-detail-reviews">
              <h2 className="product-detail-reviews-title">Customer Reviews</h2>
              {reviewsLoading ? (
                <div className="product-detail-reviews-loading">Loading reviews...</div>
              ) : (
                <>
                  {reviews.length > 0 && (
                    <div className="product-detail-reviews-summary">
                      <span className="product-detail-reviews-count">
                        {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                      </span>
                      <span className="product-detail-reviews-avg">
                        ★ {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)} average
                      </span>
                    </div>
                  )}
                  {isAuthenticated && !userReview && !showReviewForm && (
                    <button
                      type="button"
                      className="product-detail-write-review-btn"
                      onClick={() => setShowReviewForm(true)}
                    >
                      Write a Review
                    </button>
                  )}
                  {isAuthenticated && userReview && !showReviewForm && (
                    <div className="product-detail-user-review-badge">
                      You reviewed this product
                      <button
                        type="button"
                        className="product-detail-edit-review-btn"
                        onClick={() => {
                          setReviewForm({ rating: userReview.rating, comment: userReview.comment || '' });
                          setShowReviewForm(true);
                        }}
                      >
                        Edit
                      </button>
                    </div>
                  )}
                  {showReviewForm && (
                    <form onSubmit={handleSubmitReview} className="product-detail-review-form">
                      <h3>{userReview ? 'Edit your review' : 'Write a review'}</h3>
                      <div className="product-detail-review-rating">
                        <label>Rating:</label>
                        <div className="product-detail-star-input">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              className={`product-detail-star-btn ${reviewForm.rating >= star ? 'filled' : ''}`}
                              onClick={() => setReviewForm(f => ({ ...f, rating: star }))}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="product-detail-review-comment">
                        <label htmlFor="review-comment">Comment (optional)</label>
                        <textarea
                          id="review-comment"
                          value={reviewForm.comment}
                          onChange={(e) => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                          placeholder="Share your experience with this product..."
                          rows={4}
                        />
                      </div>
                      <div className="product-detail-review-form-actions">
                        <button type="button" onClick={() => setShowReviewForm(false)}>Cancel</button>
                        <button type="submit" disabled={submittingReview}>
                          {submittingReview ? 'Submitting...' : 'Submit Review'}
                        </button>
                      </div>
                    </form>
                  )}
                  <div className="product-detail-reviews-list">
                    {reviews.length === 0 && !reviewsLoading ? (
                      <p className="product-detail-reviews-empty">No reviews yet. Be the first to review!</p>
                    ) : (
                      reviews.map((review) => (
                        <div key={review.id} className="product-detail-review-card">
                          <div className="product-detail-review-header">
                            <span className="product-detail-review-author">
                              {review.reviewer?.full_name || review.reviewer?.email || 'Anonymous'}
                            </span>
                            <span className="product-detail-review-date">{formatReviewDate(review.created_at)}</span>
                          </div>
                          <div className="product-detail-review-stars">
                            {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                          </div>
                          {review.comment && (
                            <p className="product-detail-review-comment-text">{review.comment}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="related-products-section">
            <h2 className="related-products-title">Related Products</h2>
            <div className="related-products-grid">
              {relatedProducts.map((relatedProduct) => {
                const relatedImages = getProductImages(relatedProduct);
                const relatedInCart = isInCart(relatedProduct.id);
                const relatedOutOfStock = (relatedProduct.stock || 0) === 0;
                
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
                          loading="lazy"
                        />
                      ) : (
                        <div className="related-product-placeholder">📦</div>
                      )}
                    </div>
                    <div className="related-product-body">
                      <h4 className="related-product-name">{relatedProduct.name}</h4>
                      <div className="related-product-price">
                        {relatedProduct.original_price && relatedProduct.original_price > relatedProduct.price ? (
                          <>
                            <span className="related-product-price-current">Rs. {relatedProduct.price?.toLocaleString() || '0'}</span>
                            <span className="related-product-price-old">Rs. {relatedProduct.original_price?.toLocaleString() || '0'}</span>
                          </>
                        ) : (
                          <span className="related-product-price-current">Rs. {relatedProduct.price?.toLocaleString() || '0'}</span>
                        )}
                      </div>
                      <div className="related-product-actions">
                        <button
                          className="related-product-buy-btn"
                          onClick={(e) => handleRelatedBuyNow(e, relatedProduct)}
                          disabled={relatedOutOfStock}
                        >
                          {relatedOutOfStock ? 'Out of Stock' : 'Buy Now'}
                        </button>
                        <button
                          className={`related-product-cart-btn ${relatedInCart ? 'in-cart' : ''}`}
                          onClick={(e) => handleRelatedAddToCart(e, relatedProduct)}
                          disabled={relatedOutOfStock}
                        >
                          {relatedOutOfStock ? 'Out of Stock' : relatedInCart ? 'In Cart' : 'Add to Cart'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Browse All Products Button */}
        <div className="browse-all-products-section">
          <button 
            onClick={handleBack}
            className="browse-all-products-btn"
          >
            Browse All Products
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;

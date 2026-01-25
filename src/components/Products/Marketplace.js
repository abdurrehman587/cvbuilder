import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../Supabase/supabase';
import { addToCart } from '../../utils/cart';
import './Marketplace.css';

// Constants
const PRODUCTS_PER_PAGE = 20;
const INITIAL_PAGE = 1;

// Simple Product Card Component
const ProductCard = React.memo(({ 
  product, 
  onProductClick, 
  onAddToCart, 
  onBuyNow,
  adminShopName = 'Glory'
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imgRef = useRef(null);
  
  // Get first image
  const getFirstImage = () => {
    if (product.image_urls && Array.isArray(product.image_urls) && product.image_urls.length > 0) {
      return product.image_urls[0];
    }
    if (product.image_url) {
      return product.image_url;
    }
    return null;
  };

  const imageUrl = getFirstImage();
  const isOutOfStock = (product.stock || 0) === 0;

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!imgRef.current || !imageUrl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = new Image();
            img.onload = () => setImageLoaded(true);
            img.onerror = () => setImageError(true);
            img.src = imageUrl;
            observer.disconnect();
          }
        });
      },
      { rootMargin: '50px' }
    );

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [imageUrl]);

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (isOutOfStock) {
      alert('This product is out of stock.');
      return;
    }
    onAddToCart(e);
  };

  const handleBuyNow = (e) => {
    e.stopPropagation();
    if (isOutOfStock) {
      alert('This product is out of stock.');
      return;
    }
    onBuyNow(e);
  };

  return (
    <div className="product-card" onClick={onProductClick}>
      <div className="product-image-container">
        {imageUrl && !imageError ? (
          <>
            {!imageLoaded && (
              <div className="product-image-placeholder">Loading...</div>
            )}
            <img
              ref={imgRef}
              src={imageLoaded ? imageUrl : undefined}
              alt={product.name}
              className={`product-image ${imageLoaded ? 'loaded' : ''}`}
              loading="lazy"
            />
          </>
        ) : (
          <div className="product-image-placeholder">No Image</div>
        )}
      </div>
      
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        
        <div className="product-shop">
          {product.shopkeeper_id && product.shopkeeper?.shop_name 
            ? `Product uploaded by: ${product.shopkeeper.shop_name}`
            : product.shopkeeper_id 
              ? 'Product uploaded by: Shop' 
              : `Product uploaded by: ${adminShopName}`}
        </div>

        {isOutOfStock && (
          <div className="product-stock-badge">❌ Out of Stock</div>
        )}

        <div className="product-price">
          {product.original_price && product.original_price > product.price ? (
            <>
              <span className="price-current">Rs. {product.price?.toLocaleString() || '0'}</span>
              <span className="price-original">Rs. {product.original_price?.toLocaleString() || '0'}</span>
            </>
          ) : (
            <span className="price-current">Rs. {product.price?.toLocaleString() || '0'}</span>
          )}
        </div>

        <div className="product-actions">
          <button
            className="btn-buy-now"
            onClick={handleBuyNow}
            disabled={isOutOfStock}
          >
            Buy Now
          </button>
          <button
            className="btn-add-cart"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

// Main Marketplace Component
const Marketplace = ({ showLoginOnMount = false }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(INITIAL_PAGE);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState(null);
  const [adminShopName, setAdminShopName] = useState('Glory');
  const observerRef = useRef(null);
  const loadingRef = useRef(false);

  // Load admin shop name
  useEffect(() => {
    const loadAdminShopName = async () => {
      try {
        const { data } = await supabase
          .from('users')
          .select('shop_name')
          .eq('is_admin', true)
          .limit(1)
          .single();
        
        if (data?.shop_name) {
          setAdminShopName(data.shop_name);
        }
      } catch (err) {
        console.error('Error loading admin shop name:', err);
      }
    };
    loadAdminShopName();
  }, []);

  // Load sections
  useEffect(() => {
    const loadSections = async () => {
      try {
        const { data, error } = await supabase
          .from('marketplace_sections')
          .select('*')
          .order('display_order', { ascending: true });

        if (error) throw error;
        setSections(data || []);
      } catch (err) {
        console.error('Error loading sections:', err);
      }
    };
    loadSections();
  }, []);

  // Load products
  const loadProducts = useCallback(async (page = 1, reset = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(reset);

    try {
      let query = supabase
        .from('marketplace_products')
        .select(`
          *,
          marketplace_sections(name),
          shopkeeper:users!shopkeeper_id(shop_name)
        `)
        .or('is_hidden.is.null,is_hidden.eq.false')
        .order('created_at', { ascending: false });

      // Apply section filter
      if (selectedSection) {
        query = query.eq('section_id', selectedSection);
      }

      // Apply pagination
      const from = (page - 1) * PRODUCTS_PER_PAGE;
      const to = from + PRODUCTS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error } = await query;

      if (error) throw error;

      if (reset) {
        setProducts(data || []);
      } else {
        setProducts(prev => [...prev, ...(data || [])]);
      }

      setHasMore((data || []).length === PRODUCTS_PER_PAGE);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [selectedSection]);

  // Initial load
  useEffect(() => {
    loadProducts(INITIAL_PAGE, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSection]);

  // Listen for shop name updates
  useEffect(() => {
    const handleShopNameUpdate = async () => {
      try {
        const { data } = await supabase
          .from('users')
          .select('shop_name')
          .eq('is_admin', true)
          .limit(1)
          .single();
        
        if (data?.shop_name) {
          setAdminShopName(data.shop_name);
        }
      } catch (err) {
        console.error('Error loading admin shop name:', err);
      }
      loadProducts(currentPage, true);
    };

    window.addEventListener('shopNameUpdated', handleShopNameUpdate);
    return () => window.removeEventListener('shopNameUpdated', handleShopNameUpdate);
  }, [currentPage, loadProducts]);

  // Infinite scroll observer
  useEffect(() => {
    if (!hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingRef.current) {
          loadProducts(currentPage + 1, false);
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, currentPage]);

  // Filter products by search
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;

    const query = searchQuery.toLowerCase();
    return products.filter(product => {
      const name = (product.name || '').toLowerCase();
      const description = (product.description || '').toLowerCase();
      const sectionName = (product.marketplace_sections?.name || '').toLowerCase();
      
      return name.includes(query) || 
             description.includes(query) || 
             sectionName.includes(query);
    });
  }, [products, searchQuery]);

  // Handlers
  const handleProductClick = (product) => {
    navigate(`/#product/${product.id}`);
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    addToCart(product);
  };

  const handleBuyNow = (e, product) => {
    e.stopPropagation();
    addToCart(product);
    navigate('/checkout');
  };

  const handleSectionClick = (sectionId) => {
    setSelectedSection(selectedSection === sectionId ? null : sectionId);
    setCurrentPage(INITIAL_PAGE);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="marketplace-page">
      <div className="marketplace-container">
        {/* Header */}
        <div className="marketplace-header">
          <h1>Welcome to Glory</h1>
          <h2>Products and Professional Services</h2>
        </div>

        {/* Search */}
        <div className="marketplace-search">
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-input"
          />
          {searchQuery && (
            <button onClick={handleClearSearch} className="search-clear">×</button>
          )}
        </div>

        {/* Sections */}
        {sections.length > 0 && (
          <div className="marketplace-sections">
            <button
              className={`section-btn ${selectedSection === null ? 'active' : ''}`}
              onClick={() => handleSectionClick(null)}
            >
              All
            </button>
            {sections.map(section => (
              <button
                key={section.id}
                className={`section-btn ${selectedSection === section.id ? 'active' : ''}`}
                onClick={() => handleSectionClick(section.id)}
              >
                {section.name}
              </button>
            ))}
          </div>
        )}

        {/* Products Grid */}
        {loading && products.length === 0 ? (
          <div className="loading">Loading products...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="no-products">No products found.</div>
        ) : (
          <>
            <div className="products-grid">
              {filteredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onProductClick={() => handleProductClick(product)}
                  onAddToCart={(e) => handleAddToCart(e, product)}
                  onBuyNow={(e) => handleBuyNow(e, product)}
                  adminShopName={adminShopName}
                />
              ))}
            </div>

            {/* Load more trigger */}
            {hasMore && !loading && (
              <div ref={observerRef} className="load-more-trigger" />
            )}

            {loading && products.length > 0 && (
              <div className="loading-more">Loading more products...</div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Marketplace;

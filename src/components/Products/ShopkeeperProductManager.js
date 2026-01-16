import React, { useState, useEffect } from 'react';
import { supabase, authService } from '../Supabase/supabase';
import './ShopkeeperProductManager.css';

const ShopkeeperProductManager = ({ onProductAdded }) => {
  const [sections, setSections] = useState([]);
  const [myProducts, setMyProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Form states for products
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    original_price: '',
    image_urls: [],
    section_id: '',
    description: ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(true);

  // Check if user is shopkeeper (not admin) and load data
  useEffect(() => {
    const checkUserAndLoadData = async () => {
      try {
        setIsCheckingUser(true);
        const user = await authService.getCurrentUser();
        if (!user) {
          setUserType(null);
          setIsAdmin(false);
          setIsCheckingUser(false);
          return;
        }

        setCurrentUser(user);
        
        // Get user type and admin status from database
        let type = user.user_metadata?.user_type || 'regular';
        let adminStatus = false;
        
        // Check database via RPC to ensure we have the correct user type and admin status
        try {
          const { data: rpcData, error: rpcError } = await supabase
            .rpc('get_users_with_type');
          
          if (!rpcError && rpcData) {
            const dbUser = rpcData.find(u => u.email === user.email);
            if (dbUser) {
              type = dbUser.user_type || type;
              adminStatus = dbUser.is_admin || false;
            }
          }
          
          // Also check directly from users table as fallback
          if (!adminStatus) {
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('is_admin')
              .eq('id', user.id)
              .single();
            
            if (!userError && userData) {
              adminStatus = userData.is_admin || false;
            }
          }
        } catch (dbErr) {
          console.error('Error checking user type:', dbErr);
        }
        
        setUserType(type);
        setIsAdmin(adminStatus);
        
        // Only load data if user is shopkeeper AND not admin
        if (type === 'shopkeeper' && !adminStatus) {
          loadSections();
          loadMyProducts();
        }
      } catch (err) {
        console.error('Error checking user:', err);
        setUserType(null);
        setIsAdmin(false);
      } finally {
        setIsCheckingUser(false);
      }
    };

    checkUserAndLoadData();
  }, []);

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
      alert('Error loading sections: ' + err.message);
    }
  };

  const loadMyProducts = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('marketplace_products')
        .select('*, marketplace_sections(name)')
        .eq('shopkeeper_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyProducts(data || []);
    } catch (err) {
      console.error('Error loading products:', err);
      alert('Error loading products: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e, index = null) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    try {
      setUploadingImage(true);
      const uploadedUrls = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `marketplace/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('marketplace-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('marketplace-images')
          .getPublicUrl(filePath);

        uploadedUrls.push(data.publicUrl);
      }

      if (index !== null && index >= 0) {
        const updatedUrls = [...productForm.image_urls];
        updatedUrls[index] = uploadedUrls[0];
        setProductForm({ ...productForm, image_urls: updatedUrls });
      } else {
        setProductForm({ ...productForm, image_urls: [...productForm.image_urls, ...uploadedUrls] });
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      alert('Error uploading image: ' + err.message);
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index) => {
    const updatedUrls = productForm.image_urls.filter((_, i) => i !== index);
    setProductForm({ ...productForm, image_urls: updatedUrls });
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert('You must be logged in to add products.');
      return;
    }

    if (!productForm.name || !productForm.price) {
      alert('Please fill in product name and price.');
      return;
    }

    if (productForm.image_urls.length === 0) {
      alert('Please add at least one product image.');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('marketplace_products')
        .insert([{
          ...productForm,
          shopkeeper_id: currentUser.id,
          price: parseFloat(productForm.price),
          original_price: productForm.original_price ? parseFloat(productForm.original_price) : null,
          description: productForm.description || ''
        }]);

      if (error) throw error;
      
      await loadMyProducts();
      setProductForm({ name: '', price: '', original_price: '', image_urls: [], section_id: '', description: '' });
      setShowAddForm(false);
      alert('Product added successfully!');
      
      if (onProductAdded) {
        onProductAdded();
      }
    } catch (err) {
      console.error('Error adding product:', err);
      alert('Error adding product: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('marketplace_products')
        .update({
          name: productForm.name,
          price: parseFloat(productForm.price),
          original_price: productForm.original_price ? parseFloat(productForm.original_price) : null,
          image_urls: productForm.image_urls.length > 0 ? productForm.image_urls : null,
          section_id: productForm.section_id || null,
          description: productForm.description || ''
        })
        .eq('id', editingProduct.id)
        .eq('shopkeeper_id', currentUser.id); // Ensure shopkeeper can only update their own products

      if (error) throw error;
      
      await loadMyProducts();
      setProductForm({ name: '', price: '', original_price: '', image_urls: [], section_id: '', description: '' });
      setEditingProduct(null);
      setShowAddForm(false);
      alert('Product updated successfully!');
      
      if (onProductAdded) {
        onProductAdded();
      }
    } catch (err) {
      console.error('Error updating product:', err);
      alert('Error updating product: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('marketplace_products')
        .delete()
        .eq('id', id)
        .eq('shopkeeper_id', currentUser.id); // Ensure shopkeeper can only delete their own products

      if (error) throw error;
      
      await loadMyProducts();
      alert('Product deleted successfully!');
      
      if (onProductAdded) {
        onProductAdded();
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Error deleting product: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name || '',
      price: product.price?.toString() || '',
      original_price: product.original_price?.toString() || '',
      image_urls: product.image_urls || [],
      section_id: product.section_id || '',
      description: product.description || ''
    });
    setShowAddForm(true);
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setProductForm({ name: '', price: '', original_price: '', image_urls: [], section_id: '', description: '' });
    setShowAddForm(false);
  };

  // Don't render if:
  // 1. Still checking user status
  // 2. User is not a shopkeeper
  // 3. User is an admin (admins should use the admin panel, not this component)
  if (isCheckingUser || userType !== 'shopkeeper' || isAdmin) {
    return null;
  }

  return (
    <div className="shopkeeper-product-manager">
      <div className="shopkeeper-product-manager-header">
        <h2>My Products</h2>
        <button 
          className="btn-add-product"
          onClick={() => {
            setEditingProduct(null);
            setProductForm({ name: '', price: '', original_price: '', image_urls: [], section_id: '', description: '' });
            setShowAddForm(true);
          }}
        >
          + Add New Product
        </button>
      </div>

      {showAddForm && (
        <div className="shopkeeper-product-form-container">
          <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
          <form onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct}>
            <div className="form-group">
              <label>Product Name *</label>
              <input
                type="text"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                required
                placeholder="Enter product name"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Price (Rs.) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  required
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label>Original Price (Rs.)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={productForm.original_price}
                  onChange={(e) => setProductForm({ ...productForm, original_price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Category</label>
              <select
                value={productForm.section_id}
                onChange={(e) => setProductForm({ ...productForm, section_id: e.target.value })}
              >
                <option value="">Select a category</option>
                {sections.map(section => (
                  <option key={section.id} value={section.id}>{section.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                rows="4"
                placeholder="Enter product description"
              />
            </div>

            <div className="form-group">
              <label>Product Images *</label>
              <div className="image-upload-section">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
                {uploadingImage && <p>Uploading image...</p>}
                <div className="image-preview-grid">
                  {productForm.image_urls.map((url, index) => (
                    <div key={index} className="image-preview-item">
                      <img src={url} alt={`Preview ${index + 1}`} />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="btn-remove-image"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" disabled={loading} className="btn-submit">
                {loading ? 'Saving...' : (editingProduct ? 'Update Product' : 'Add Product')}
              </button>
              <button type="button" onClick={handleCancelEdit} className="btn-cancel">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && !showAddForm && <p>Loading products...</p>}

      {!showAddForm && (
        <div className="my-products-list">
          {myProducts.length === 0 ? (
            <p className="no-products">You haven't added any products yet. Click "Add New Product" to get started!</p>
          ) : (
            <div className="products-grid">
              {myProducts.map(product => (
                <div key={product.id} className="product-item">
                  <div className="product-image">
                    {product.image_urls && product.image_urls.length > 0 ? (
                      <img src={product.image_urls[0]} alt={product.name} />
                    ) : (
                      <div className="no-image">No Image</div>
                    )}
                  </div>
                  <div className="product-info">
                    <h4>{product.name}</h4>
                    <p className="product-price">
                      Rs. {product.price}
                      {product.original_price && product.original_price > product.price && (
                        <span className="original-price">Rs. {product.original_price}</span>
                      )}
                    </p>
                    {product.marketplace_sections && (
                      <p className="product-category">{product.marketplace_sections.name}</p>
                    )}
                    {product.is_hidden && (
                      <p className="product-hidden">⚠️ Hidden from marketplace</p>
                    )}
                  </div>
                  <div className="product-actions">
                    <button onClick={() => handleEditProduct(product)} className="btn-edit">
                      Edit
                    </button>
                    <button onClick={() => handleDeleteProduct(product.id)} className="btn-delete">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ShopkeeperProductManager;

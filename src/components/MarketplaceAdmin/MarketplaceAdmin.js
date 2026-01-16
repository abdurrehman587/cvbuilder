import React, { useState, useEffect } from 'react';
import { supabase } from '../Supabase/supabase';
import { orderService } from '../../utils/orders';
import './MarketplaceAdmin.css';
import RichTextEditor from './RichTextEditor';

const MarketplaceAdmin = () => {
  const [sections, setSections] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');

  // Helper function to convert HTML to plain text (preserving line breaks)
  // eslint-disable-next-line no-unused-vars
  const htmlToPlainText = (html) => {
    if (!html) return '';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Replace block elements with newlines
    const blockElements = tempDiv.querySelectorAll('p, div, li, br');
    blockElements.forEach(el => {
      if (el.tagName.toLowerCase() === 'br') {
        el.replaceWith('\n');
      } else {
        if (el.textContent.trim()) {
          el.textContent = el.textContent.trim() + '\n';
        }
      }
    });
    
    // Get text content and clean up
    let text = tempDiv.textContent || tempDiv.innerText || '';
    // Remove extra newlines (more than 2 consecutive)
    text = text.replace(/\n{3,}/g, '\n\n');
    // Trim each line
    text = text.split('\n').map(line => line.trim()).join('\n');
    
    return text.trim();
  };

  // Helper function to convert plain text to HTML for editing
  const plainTextToHtml = (text) => {
    if (!text) return '';
    // Convert newlines to paragraphs
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    if (lines.length === 0) return '';
    return lines.map(line => `<p>${line.trim()}</p>`).join('');
  };

  // Form states for sections
  const [sectionForm, setSectionForm] = useState({
    name: '',
    display_order: 0
  });
  const [editingSection, setEditingSection] = useState(null);

  // Form states for products
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    original_price: '',
    image_urls: [],
    section_id: '',
    description: ''
  });
  const [descriptionHtml, setDescriptionHtml] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingImageIndex, setUploadingImageIndex] = useState(null);
  const [draggedImageIndex, setDraggedImageIndex] = useState(null);

  // Load sections, products, and orders on mount
  useEffect(() => {
    loadSections();
    loadProducts();
    loadOrders();
  }, []);

  const loadSections = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('marketplace_sections')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setSections(data || []);
    } catch (err) {
      console.error('Error loading sections:', err);
      alert('Error loading sections: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('marketplace_products')
        .select('*, marketplace_sections(name)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error loading products:', error);
        throw error;
      }
      
      setProducts(data || []);
    } catch (err) {
      console.error('Error loading products:', err);
      alert('Error loading products: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getAllOrders();
      setOrders(data || []);
      
      // Mark all orders as read when viewing orders tab
      if (data && data.length > 0) {
        const orderIds = data.map(order => order.id);
        const unread = JSON.parse(localStorage.getItem('unreadOrders') || '[]');
        const updatedUnread = unread.filter(id => !orderIds.includes(id));
        localStorage.setItem('unreadOrders', JSON.stringify(updatedUnread));
        
        // Dispatch event to update notification with all order IDs
        window.dispatchEvent(new CustomEvent('ordersViewed', { 
          detail: { orderIds: orderIds } 
        }));
      } else {
        // Even if no orders, clear unread list but don't dispatch event
        // to avoid infinite loop - the notification component will handle it
        localStorage.setItem('unreadOrders', JSON.stringify([]));
        // Don't dispatch ordersViewed event here - it causes infinite loop
      }
    } catch (err) {
      console.error('Error loading orders:', err);
      alert('Error loading orders: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Section handlers
  const handleAddSection = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { error } = await supabase
        .from('marketplace_sections')
        .insert([sectionForm])
        .select()
        .single();

      if (error) throw error;
      await loadSections();
      setSectionForm({ name: '', display_order: 0 });
      alert('Section added successfully!');
    } catch (err) {
      console.error('Error adding section:', err);
      alert('Error adding section: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSection = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { error } = await supabase
        .from('marketplace_sections')
        .update(sectionForm)
        .eq('id', editingSection.id)
        .select()
        .single();

      if (error) throw error;
      await loadSections();
      setEditingSection(null);
      setSectionForm({ name: '', display_order: 0 });
      alert('Section updated successfully!');
    } catch (err) {
      console.error('Error updating section:', err);
      alert('Error updating section: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSection = async (id) => {
    if (!window.confirm('Are you sure you want to delete this section? All products in this section will also be deleted.')) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('marketplace_sections')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadSections();
      await loadProducts();
      alert('Section deleted successfully!');
    } catch (err) {
      console.error('Error deleting section:', err);
      alert('Error deleting section: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Product handlers
  const handleImageUpload = async (e, index = null) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    try {
      setUploadingImage(true);
      const uploadedUrls = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadingImageIndex(i);
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
      setUploadingImageIndex(null);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index) => {
    const updatedUrls = productForm.image_urls.filter((_, i) => i !== index);
    setProductForm({ ...productForm, image_urls: updatedUrls });
  };

  // Drag and drop handlers for image reordering
  const handleDragStart = (e, index) => {
    setDraggedImageIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragEnd = (e) => {
    setDraggedImageIndex(null);
    // Remove drag-over class from all items
    document.querySelectorAll('.image-preview-item').forEach(item => {
      item.classList.remove('drag-over');
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedImageIndex === null || draggedImageIndex === index) return;
    // Remove drag-over from all items first
    document.querySelectorAll('.image-preview-item').forEach(item => {
      item.classList.remove('drag-over');
    });
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only remove if leaving to outside (not to child elements)
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      e.currentTarget.classList.remove('drag-over');
    }
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Remove drag-over class from all items
    document.querySelectorAll('.image-preview-item').forEach(item => {
      item.classList.remove('drag-over');
    });
    
    if (draggedImageIndex === null || draggedImageIndex === dropIndex) {
      setDraggedImageIndex(null);
      return;
    }

    const newImageUrls = [...productForm.image_urls];
    
    // Swap the images
    const draggedImage = newImageUrls[draggedImageIndex];
    const targetImage = newImageUrls[dropIndex];
    newImageUrls[dropIndex] = draggedImage;
    newImageUrls[draggedImageIndex] = targetImage;
    
    setProductForm({ ...productForm, image_urls: newImageUrls });
    setDraggedImageIndex(null);
  };

  // Move image left (decrease index)
  const moveImageLeft = (index) => {
    if (index === 0) return;
    const newImageUrls = [...productForm.image_urls];
    [newImageUrls[index - 1], newImageUrls[index]] = [newImageUrls[index], newImageUrls[index - 1]];
    setProductForm({ ...productForm, image_urls: newImageUrls });
  };

  // Move image right (increase index)
  const moveImageRight = (index) => {
    if (index === productForm.image_urls.length - 1) return;
    const newImageUrls = [...productForm.image_urls];
    [newImageUrls[index], newImageUrls[index + 1]] = [newImageUrls[index + 1], newImageUrls[index]];
    setProductForm({ ...productForm, image_urls: newImageUrls });
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      // Store HTML description to preserve formatting
      const { error } = await supabase
        .from('marketplace_products')
        .insert([{
          ...productForm,
          price: parseFloat(productForm.price),
          original_price: productForm.original_price ? parseFloat(productForm.original_price) : null,
          description: descriptionHtml || ''
        }])
        .select()
        .single();

      if (error) throw error;
      await loadProducts();
      setProductForm({ name: '', price: '', original_price: '', image_urls: [], section_id: '', description: '' });
      setDescriptionHtml('');
      alert('Product added successfully!');
    } catch (err) {
      console.error('Error adding product:', err);
      alert('Error adding product: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      // Store HTML description to preserve formatting
      const { error } = await supabase
        .from('marketplace_products')
        .update({
          name: productForm.name,
          price: parseFloat(productForm.price),
          original_price: productForm.original_price ? parseFloat(productForm.original_price) : null,
          image_urls: productForm.image_urls.length > 0 ? productForm.image_urls : null,
          image_url: productForm.image_urls.length > 0 ? productForm.image_urls[0] : null,
          section_id: productForm.section_id,
          description: descriptionHtml || null
        })
        .eq('id', editingProduct.id)
        .select()
        .single();

      if (error) throw error;
      await loadProducts();
      setEditingProduct(null);
      setProductForm({ name: '', price: '', original_price: '', image_urls: [], section_id: '', description: '' });
      setDescriptionHtml('');
      alert('Product updated successfully!');
    } catch (err) {
      console.error('Error updating product:', err);
      alert('Error updating product: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleHideProduct = async (product) => {
    const isCurrentlyHidden = product.is_hidden || false;
    const action = isCurrentlyHidden ? 'show' : 'hide';
    
    if (!window.confirm(`Are you sure you want to ${action} this product? ${isCurrentlyHidden ? 'It will be visible to customers.' : 'It will be hidden from customers.'}`)) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('marketplace_products')
        .update({ is_hidden: !isCurrentlyHidden })
        .eq('id', product.id);

      if (error) throw error;
      await loadProducts();
      alert(`Product ${isCurrentlyHidden ? 'shown' : 'hidden'} successfully!`);
    } catch (err) {
      console.error('Error toggling product visibility:', err);
      alert('Error toggling product visibility: ' + err.message);
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
        .eq('id', id);

      if (error) throw error;
      await loadProducts();
      alert('Product deleted successfully!');
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Error deleting product: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle tab parameter from URL and ensure hash stays as #admin
  useEffect(() => {
    const checkTabParameter = () => {
      const hash = window.location.hash;
      
      // Allow order-details and other routes to pass through without interference
      if (hash.startsWith('#order-details') || hash.startsWith('#cart') || hash.startsWith('#checkout') || hash.startsWith('#order-history')) {
        return;
      }
      
      // Check if there's a tab parameter in the URL
      if (hash.includes('#admin')) {
        // Extract tab parameter from hash like #admin?tab=orders or #admin/marketplace?tab=orders
        const hashParts = hash.split('?');
        if (hashParts.length > 1) {
          const urlParams = new URLSearchParams(hashParts[1]);
          const tabParam = urlParams.get('tab');
          if (tabParam && ['products', 'sections', 'orders'].includes(tabParam)) {
            setActiveTab(tabParam);
            if (tabParam === 'orders') {
              loadOrders();
            }
            // Keep the tab parameter in URL, but ensure it's in the correct format
            if (hash.includes('#admin/marketplace')) {
              // Already in correct format
              return;
            } else if (hash.includes('#admin?tab=')) {
              // Update to marketplace format
              window.history.replaceState(null, '', window.location.pathname + '#admin/marketplace?tab=' + tabParam);
            }
            return;
          }
        }
      }
      // If no tab parameter and hash is just #admin or #admin/marketplace, default to orders tab
      if (window.location.hash === '#admin' || window.location.hash === '#admin/marketplace') {
        setActiveTab('orders');
        loadOrders();
        window.history.replaceState(null, '', window.location.pathname + '#admin/marketplace?tab=orders');
        return;
      }
      // If hash doesn't include #admin, set it (but only if not navigating to other routes)
      if (!window.location.hash.includes('#admin')) {
        window.history.replaceState(null, '', window.location.pathname + '#admin');
      }
    };

    // Check on mount
    checkTabParameter();

    // Listen for hash changes
    const handleHashChange = () => {
      checkTabParameter();
    };
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Keep hash as #admin when switching tabs (but preserve tab parameter if it exists)
  useEffect(() => {
    const hash = window.location.hash;
    
    // Allow order-details and other routes to pass through without interference
    if (hash.startsWith('#order-details') || hash.startsWith('#cart') || hash.startsWith('#checkout') || hash.startsWith('#order-history')) {
      return;
    }
    
    if (hash.includes('#admin?tab=')) {
      // Preserve the tab parameter
      return;
    }
    if (hash === '#admin') {
      return;
    }
    // Only update if hash doesn't include #admin at all
    if (!hash.includes('#admin')) {
      window.history.replaceState(null, '', window.location.pathname + '#admin');
    }
  }, [activeTab]);

  const handleBackToProducts = () => {
    localStorage.setItem('showProductsPage', 'true');
    sessionStorage.setItem('showProductsPage', 'true');
    window.location.href = '/marketplace';
  };

  const handleTabChange = (tab) => {
    // Prevent any navigation
    setActiveTab(tab);
    // Update URL with tab parameter
    window.history.replaceState(null, '', window.location.pathname + `#admin?tab=${tab}`);
    // Load orders if switching to orders tab
    if (tab === 'orders') {
      loadOrders();
    }
  };

  const handleBackToAdmin = () => {
    window.location.hash = '#admin';
  };

  return (
    <div className="marketplace-admin">
      <div className="admin-header">
        <button 
          className="admin-back-button"
          onClick={handleBackToAdmin}
          title="Back to Admin Dashboard"
          style={{
            marginBottom: '15px',
            padding: '8px 16px',
            backgroundColor: '#f0f0f0',
            border: '1px solid #ddd',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            color: '#666',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#e0e0e0';
            e.target.style.color = '#333';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#f0f0f0';
            e.target.style.color = '#666';
          }}
        >
          ← Back to Admin Dashboard
        </button>
        <h1>Marketplace Admin</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={loadProducts} 
            className="back-button"
            style={{ backgroundColor: '#3b82f6', color: 'white' }}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh Products'}
          </button>
          <button onClick={handleBackToProducts} className="back-button">
            Back to Products
          </button>
        </div>
      </div>

      <div 
        className="admin-tabs"
        onClick={(e) => {
          // Stop all click events from bubbling up
          e.stopPropagation();
        }}
        onMouseDown={(e) => {
          // Also stop mousedown events
          e.stopPropagation();
        }}
      >
        <button
          type="button"
          className={activeTab === 'orders' ? 'active' : ''}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.nativeEvent?.stopImmediatePropagation();
            handleTabChange('orders');
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          Orders
        </button>
        <button
          type="button"
          className={activeTab === 'products' ? 'active' : ''}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.nativeEvent?.stopImmediatePropagation();
            handleTabChange('products');
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          Products
        </button>
        <button
          type="button"
          className={activeTab === 'sections' ? 'active' : ''}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.nativeEvent?.stopImmediatePropagation();
            handleTabChange('sections');
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          Sections
        </button>
      </div>

      {loading && activeTab === 'sections' && sections.length === 0 && (
        <div className="loading-message">Loading sections...</div>
      )}

      {loading && activeTab === 'products' && products.length === 0 && (
        <div className="loading-message">Loading products...</div>
      )}

      {loading && activeTab === 'orders' && orders.length === 0 && (
        <div className="loading-message">Loading orders...</div>
      )}

      {activeTab === 'sections' && (
        <div className="admin-section">
          <h2>Manage Sections</h2>
          <form onSubmit={editingSection ? handleUpdateSection : handleAddSection} className="admin-form">
            <input
              type="text"
              placeholder="Section Name"
              value={sectionForm.name}
              onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
              required
            />
            <input
              type="number"
              placeholder="Display Order"
              value={sectionForm.display_order}
              onChange={(e) => setSectionForm({ ...sectionForm, display_order: parseInt(e.target.value) || 0 })}
              required
            />
            <button type="submit" disabled={loading}>
              {editingSection ? 'Update Section' : 'Add Section'}
            </button>
            {editingSection && (
              <button type="button" onClick={() => {
                setEditingSection(null);
                setSectionForm({ name: '', display_order: 0 });
              }}>
                Cancel
              </button>
            )}
          </form>

          <div className="admin-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Order</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sections.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '2rem' }}>
                      No sections found. Add your first section above.
                    </td>
                  </tr>
                ) : (
                  sections.map((section) => (
                    <tr key={section.id}>
                      <td>{section.name}</td>
                      <td>{section.display_order}</td>
                      <td>
                        <button onClick={() => {
                          setEditingSection(section);
                          setSectionForm({ name: section.name, display_order: section.display_order });
                        }}>
                          Edit
                        </button>
                        <button onClick={() => handleDeleteSection(section.id)} className="delete-btn">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="admin-section">
          <h2>Manage Products</h2>
          <form onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct} className="admin-form">
            <input
              type="text"
              placeholder="Product Name"
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              required
            />
            <input
              type="number"
              placeholder="Price (PKR)"
              value={productForm.price}
              onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
              required
              min="0"
              step="0.01"
            />
            <input
              type="number"
              placeholder="Original Price (PKR) - Optional"
              value={productForm.original_price}
              onChange={(e) => setProductForm({ ...productForm, original_price: e.target.value })}
              min="0"
              step="0.01"
            />
            <select
              value={productForm.section_id}
              onChange={(e) => setProductForm({ ...productForm, section_id: e.target.value })}
              required
            >
              <option value="">Select Section</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </select>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                Product Feature (Description)
              </label>
              <RichTextEditor
                value={descriptionHtml}
                onChange={setDescriptionHtml}
                placeholder="Enter product description..."
            />
            </div>
            <div className="image-upload">
              <label>Product Images (You can upload multiple images)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                disabled={uploadingImage}
              />
              {uploadingImage && (
                <span className="upload-status">
                  Uploading{uploadingImageIndex !== null ? ` image ${uploadingImageIndex + 1}...` : '...'}
                </span>
              )}
              {productForm.image_urls && productForm.image_urls.length > 0 && (
                <>
                  <p className="drag-hint">💡 Drag images to swap positions, or use arrow buttons. First image will be the main product image.</p>
                  <div className="image-preview-grid">
                    {productForm.image_urls.map((url, index) => (
                      <div 
                        key={`img-${index}-${url}`} 
                        className={`image-preview-item ${draggedImageIndex === index ? 'dragging' : ''}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        onDragEnter={(e) => handleDragEnter(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index)}
                      >
                        <div className="drag-handle" title="Drag to reorder">⋮⋮</div>
                        <span className="image-order-badge">{index + 1}</span>
                        <img src={url} alt={`Preview ${index + 1}`} className="image-preview" />
                        <div className="image-move-buttons">
                          <button
                            type="button"
                            onClick={() => moveImageLeft(index)}
                            className="move-btn move-left"
                            disabled={index === 0}
                            title="Move left"
                          >
                            ←
                          </button>
                          <button
                            type="button"
                            onClick={() => moveImageRight(index)}
                            className="move-btn move-right"
                            disabled={index === productForm.image_urls.length - 1}
                            title="Move right"
                          >
                            →
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="remove-image-btn"
                        >
                          Remove
                        </button>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, index)}
                          disabled={uploadingImage}
                          style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <button type="submit" disabled={loading || uploadingImage}>
              {editingProduct ? 'Update Product' : 'Add Product'}
            </button>
            {editingProduct && (
              <button type="button" onClick={() => {
                setEditingProduct(null);
                setProductForm({ name: '', price: '', original_price: '', image_urls: [], section_id: '', description: '' });
                setDescriptionHtml('');
              }}>
                Cancel
              </button>
            )}
          </form>

          <div className="admin-table">
            <table>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Section</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 && !loading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                      No products found. Add your first product above.
                      <br />
                      <small style={{ color: '#6b7280', marginTop: '0.5rem', display: 'block' }}>
                        (Check browser console for details if products should be visible)
                      </small>
                    </td>
                  </tr>
                ) : products.length === 0 && loading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                      Loading products...
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        {(product.image_urls && Array.isArray(product.image_urls) && product.image_urls.length > 0) 
                          ? (
                            <img src={product.image_urls[0]} alt={product.name} className="product-thumb" />
                          ) 
                          : product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="product-thumb" />
                          ) : (
                            <span className="no-image">No Image</span>
                          )}
                      </td>
                      <td>{product.name}</td>
                      <td>Rs. {product.price?.toLocaleString()}</td>
                      <td>{product.marketplace_sections?.name || 'N/A'}</td>
                      <td>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          backgroundColor: product.is_hidden ? '#fef3c7' : '#d1fae5',
                          color: product.is_hidden ? '#92400e' : '#065f46'
                        }}>
                          {product.is_hidden ? '🔒 Hidden' : '✅ Visible'}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => {
                          setEditingProduct(product);
                          const description = product.description || '';
                          setProductForm({
                            name: product.name,
                            price: product.price?.toString() || '',
                            original_price: product.original_price?.toString() || '',
                            image_urls: product.image_urls && Array.isArray(product.image_urls) 
                              ? product.image_urls 
                              : (product.image_url ? [product.image_url] : []),
                            section_id: product.section_id || '',
                            description: description
                          });
                          // Check if description is HTML (contains tags) or plain text
                          const isHtml = description && /<[a-z][\s\S]*>/i.test(description);
                          if (isHtml) {
                            // Already HTML, use directly
                            setDescriptionHtml(description);
                          } else {
                            // Plain text, convert to HTML for the editor
                            setDescriptionHtml(plainTextToHtml(description));
                          }
                        }}>
                          Edit
                        </button>
                        <button 
                          onClick={() => handleHideProduct(product)} 
                          className="hide-show-btn"
                          style={{
                            backgroundColor: product.is_hidden ? '#10b981' : '#f59e0b',
                            color: 'white',
                            marginLeft: '0.5rem',
                            display: 'inline-block',
                            visibility: 'visible',
                            opacity: 1
                          }}
                          title={product.is_hidden ? 'Show product to customers' : 'Hide product from customers'}
                        >
                          {product.is_hidden ? 'Show' : 'Hide'}
                        </button>
                        <button onClick={() => handleDeleteProduct(product.id)} className="delete-btn" style={{ marginLeft: '0.5rem' }}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="admin-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Manage Orders</h2>
            <button 
              onClick={loadOrders} 
              className="back-button"
              style={{ backgroundColor: '#3b82f6', color: 'white' }}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh Orders'}
            </button>
          </div>

          <div className="admin-table">
            <table>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment Method</th>
                  <th>Payment Status</th>
                  <th>Order Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && !loading ? (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '2rem' }}>
                      No orders found.
                    </td>
                  </tr>
                ) : orders.length === 0 && loading ? (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '2rem' }}>
                      Loading orders...
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    const orderItems = Array.isArray(order.order_items) ? order.order_items : [];
                    const totalItems = orderItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
                    const formatDate = (dateString) => {
                      if (!dateString) return 'N/A';
                      const date = new Date(dateString);
                      return date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });
                    };

                    return (
                      <tr key={order.id}>
                        <td><strong>#{order.order_number || order.id.slice(0, 8)}</strong></td>
                        <td>{order.customer_name || 'N/A'}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            {order.customer_phone || 'N/A'}
                            {order.has_whatsapp && (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366" title="Has WhatsApp">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                              </svg>
                            )}
                          </div>
                        </td>
                        <td>{totalItems} item(s)</td>
                        <td>Rs. {order.total_amount?.toLocaleString() || '0'}</td>
                        <td>
                          {order.payment_method === 'bank_transfer' ? '🏦 Bank Transfer' : 
                           order.payment_method === 'cash_on_delivery' ? '💵 Cash on Delivery' : 
                           order.payment_method}
                        </td>
                        <td>
                          <select
                            value={order.payment_status || 'pending'}
                            onChange={async (e) => {
                              const newPaymentStatus = e.target.value;
                              try {
                                setLoading(true);
                                await orderService.updateOrderStatus(order.id, order.order_status, newPaymentStatus);
                                
                                // Auto-send WhatsApp message if payment is confirmed and customer has WhatsApp
                                if (order.has_whatsapp && order.customer_phone && newPaymentStatus === 'paid') {
                                  const updatedOrder = { ...order, payment_status: newPaymentStatus };
                                  orderService.sendWhatsAppMessage(updatedOrder, 'payment_confirmed');
                                }
                                
                                await loadOrders();
                                alert('Payment status updated successfully!');
                              } catch (err) {
                                console.error('Error updating payment status:', err);
                                alert('Error updating payment status: ' + err.message);
                              } finally {
                                setLoading(false);
                              }
                            }}
                            style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              border: '1px solid #d1d5db',
                              fontSize: '0.875rem'
                            }}
                          >
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td>
                          <select
                            value={order.order_status || 'pending'}
                            onChange={async (e) => {
                              const newStatus = e.target.value;
                              try {
                                setLoading(true);
                                await orderService.updateOrderStatus(order.id, newStatus);
                                
                                // Auto-send WhatsApp message if customer has WhatsApp
                                if (order.has_whatsapp && order.customer_phone) {
                                  // Map order status to WhatsApp message type
                                  const statusToMessageType = {
                                    'confirmed': 'order_confirmation',
                                    'shipped': 'order_shipped',
                                    'delivered': 'order_delivered',
                                    'processing': 'order_status',
                                    'cancelled': 'order_status'
                                  };
                                  
                                  const messageType = statusToMessageType[newStatus];
                                  if (messageType) {
                                    // Update order object with new status for message
                                    const updatedOrder = { ...order, order_status: newStatus };
                                    orderService.sendWhatsAppMessage(updatedOrder, messageType);
                                  }
                                }
                                
                                await loadOrders();
                                alert('Order status updated successfully!');
                              } catch (err) {
                                console.error('Error updating order status:', err);
                                alert('Error updating order status: ' + err.message);
                              } finally {
                                setLoading(false);
                              }
                            }}
                            style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              border: '1px solid #d1d5db',
                              fontSize: '0.875rem'
                            }}
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td>{formatDate(order.created_at)}</td>
                        <td>
                          <button 
                            onClick={() => {
                              const orderId = order.order_number || order.id;
                              // Use hash navigation to avoid full page reload
                              window.location.hash = `#order-details?orderId=${orderId}&from=admin`;
                            }}
                            style={{
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.875rem',
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketplaceAdmin;

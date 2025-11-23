import React, { useState, useEffect } from 'react';
import { supabase } from '../Supabase/supabase';
import './MarketplaceAdmin.css';
import RichTextEditor from './RichTextEditor';

const MarketplaceAdmin = () => {
  const [sections, setSections] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('sections');

  // Helper function to convert HTML to plain text (preserving line breaks)
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
    image_urls: [],
    section_id: '',
    description: ''
  });
  const [descriptionHtml, setDescriptionHtml] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingImageIndex, setUploadingImageIndex] = useState(null);

  // Load sections and products on mount
  useEffect(() => {
    loadSections();
    loadProducts();
  }, []);

  const loadSections = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
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

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error loading products:', err);
      alert('Error loading products: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Section handlers
  const handleAddSection = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { data, error } = await supabase
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
      const { data, error } = await supabase
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

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      // Store HTML description to preserve formatting
      const { data, error } = await supabase
        .from('marketplace_products')
        .insert([{
          ...productForm,
          price: parseFloat(productForm.price),
          description: descriptionHtml || ''
        }])
        .select()
        .single();

      if (error) throw error;
      await loadProducts();
      setProductForm({ name: '', price: '', image_urls: [], section_id: '', description: '' });
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
      const { data, error } = await supabase
        .from('marketplace_products')
        .update({
          name: productForm.name,
          price: parseFloat(productForm.price),
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
      setProductForm({ name: '', price: '', image_urls: [], section_id: '', description: '' });
      setDescriptionHtml('');
      alert('Product updated successfully!');
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

  const handleBackToProducts = () => {
    localStorage.setItem('showProductsPage', 'true');
    sessionStorage.setItem('showProductsPage', 'true');
    window.location.href = '/#products';
  };

  return (
    <div className="marketplace-admin">
      <div className="admin-header">
        <h1>Marketplace Admin</h1>
        <button onClick={handleBackToProducts} className="back-button">
          Back to Products
        </button>
      </div>

      <div className="admin-tabs">
        <button
          className={activeTab === 'sections' ? 'active' : ''}
          onClick={() => setActiveTab('sections')}
        >
          Sections
        </button>
        <button
          className={activeTab === 'products' ? 'active' : ''}
          onClick={() => setActiveTab('products')}
        >
          Products
        </button>
      </div>

      {loading && activeTab === 'sections' && sections.length === 0 && (
        <div className="loading-message">Loading sections...</div>
      )}

      {loading && activeTab === 'products' && products.length === 0 && (
        <div className="loading-message">Loading products...</div>
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
                <div className="image-preview-grid">
                  {productForm.image_urls.map((url, index) => (
                    <div key={index} className="image-preview-item">
                      <img src={url} alt={`Preview ${index + 1}`} className="image-preview" />
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
              )}
            </div>
            <button type="submit" disabled={loading || uploadingImage}>
              {editingProduct ? 'Update Product' : 'Add Product'}
            </button>
            {editingProduct && (
              <button type="button" onClick={() => {
                setEditingProduct(null);
                setProductForm({ name: '', price: '', image_urls: [], section_id: '', description: '' });
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                      No products found. Add your first product above.
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
                        <button onClick={() => {
                          setEditingProduct(product);
                          const description = product.description || '';
                          setProductForm({
                            name: product.name,
                            price: product.price?.toString() || '',
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
                        <button onClick={() => handleDeleteProduct(product.id)} className="delete-btn">
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
    </div>
  );
};

export default MarketplaceAdmin;

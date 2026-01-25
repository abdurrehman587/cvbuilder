import React, { useState, useEffect, useRef } from 'react';
import { supabase, authService } from '../Supabase/supabase';
import { orderService } from '../../utils/orders';
import './ShopkeeperProductManager.css';
import RichTextEditor from '../MarketplaceAdmin/RichTextEditor';

const ShopkeeperProductManager = ({ onProductAdded }) => {
  const [sections, setSections] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  const [currentUser, setCurrentUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(true);

  // Helper function to convert HTML to plain text (preserving line breaks)
  // Note: Currently unused but kept for potential future use
  // const htmlToPlainText = (html) => {
  //   if (!html) return '';
  //   const tempDiv = document.createElement('div');
  //   tempDiv.innerHTML = html;
  //   
  //   // Replace block elements with newlines
  //   const blockElements = tempDiv.querySelectorAll('p, div, li, br');
  //   blockElements.forEach(el => {
  //     if (el.tagName.toLowerCase() === 'br') {
  //       el.replaceWith('\n');
  //     } else {
  //       if (el.textContent.trim()) {
  //         el.textContent = el.textContent.trim() + '\n';
  //       }
  //     }
  //   });
  //   
  //   // Get text content and clean up
  //   let text = tempDiv.textContent || tempDiv.innerText || '';
  //   // Remove extra newlines (more than 2 consecutive)
  //   text = text.replace(/\n{3,}/g, '\n\n');
  //   // Trim each line
  //   text = text.split('\n').map(line => line.trim()).join('\n');
  //   
  //   return text.trim();
  // };

  // Helper function to convert plain text to HTML for editing
  const plainTextToHtml = (text) => {
    if (!text) return '';
    // Convert newlines to paragraphs
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    if (lines.length === 0) return '';
    return lines.map(line => `<p>${line.trim()}</p>`).join('');
  };

  // Form states for products
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    original_price: '',
    image_urls: [],
    section_id: '',
    description: '',
    stock: 1
  });
  const [descriptionHtml, setDescriptionHtml] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingImageIndex, setUploadingImageIndex] = useState(null);
  const [draggedImageIndex, setDraggedImageIndex] = useState(null);
  const [stockInputs, setStockInputs] = useState({});
  const [updatingStock, setUpdatingStock] = useState({});
  const updatingVisibilityRef = useRef(new Set());
  const pendingVisibilityUpdatesRef = useRef({});
  const pendingReloadTimeoutRef = useRef(null);
  const isReloadingRef = useRef(false);

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
        // First check user_metadata (from session)
        let type = user.user_metadata?.user_type || null;
        let adminStatus = false;
        
        console.log('ShopkeeperProductManager - Initial user check:', {
          email: user.email,
          user_metadata: user.user_metadata,
          typeFromMetadata: type
        });
        
        // Check database via RPC to ensure we have the correct user type and admin status
        try {
          const { data: rpcData, error: rpcError } = await supabase
            .rpc('get_users_with_type');
          
          if (!rpcError && rpcData) {
            const dbUser = rpcData.find(u => u.email === user.email);
            if (dbUser) {
              // RPC function gets user_type from auth.users.raw_user_meta_data
              type = dbUser.user_type || type || 'regular';
              adminStatus = dbUser.is_admin || false;
              console.log('ShopkeeperProductManager - RPC result:', {
                email: dbUser.email,
                user_type: dbUser.user_type,
                is_admin: dbUser.is_admin
              });
            } else {
              console.warn('ShopkeeperProductManager - User not found in RPC results');
            }
          } else {
            console.error('ShopkeeperProductManager - RPC error:', rpcError);
          }
          
          // Also check directly from users table as fallback
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('is_admin')
            .eq('id', user.id)
            .single();
          
          if (!userError && userData) {
            adminStatus = userData.is_admin || false;
          }
          
          // If still no type found, default to 'regular'
          if (!type) {
            type = 'regular';
            console.warn('ShopkeeperProductManager - No user_type found, defaulting to "regular"');
          }
        } catch (dbErr) {
          console.error('ShopkeeperProductManager - Error checking user type:', dbErr);
          // Default to regular if there's an error
          if (!type) {
            type = 'regular';
          }
        }
        
        console.log('ShopkeeperProductManager - Final user type determination:');
        console.log('  Email:', user.email);
        console.log('  User Type:', type);
        console.log('  Is Admin:', adminStatus);
        console.log('  User Metadata:', JSON.stringify(user.user_metadata, null, 2));
        console.log('  Raw User Meta Data:', JSON.stringify(user.raw_user_meta_data, null, 2));
        
        setUserType(type);
        setIsAdmin(adminStatus);
        
        // Only load data if user is shopkeeper AND not admin
        if (type === 'shopkeeper' && !adminStatus) {
          loadSections();
          loadProducts({}, user.id); // Pass user.id directly to avoid state timing issues
          loadOrders(user.id); // Load orders for this shopkeeper
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const loadOrders = async (userId = null) => {
    const userIdToUse = userId || currentUser?.id;
    if (!userIdToUse) {
      console.warn('loadOrders: No user ID available');
      return;
    }

    try {
      setLoading(true);
      const data = await orderService.getShopkeeperOrders(userIdToUse);
      setOrders(data || []);
    } catch (err) {
      console.error('Error loading orders:', err);
      alert('Error loading orders: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async (preserveVisibilityUpdates = {}, userId = null) => {
    const userIdToUse = userId || currentUser?.id;
    if (!userIdToUse) {
      console.warn('loadProducts: No user ID available');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Loading products for shopkeeper_id:', userIdToUse);
      const { data, error } = await supabase
        .from('marketplace_products')
        .select('*, marketplace_sections(name)')
        .eq('shopkeeper_id', userIdToUse)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error loading products:', error);
        throw error;
      }
      
      console.log('Loaded products:', data?.length || 0, 'products for shopkeeper');
      
      // Load saved visibility states from localStorage as backup
      const savedVisibility = JSON.parse(localStorage.getItem('productVisibilityStates') || '{}');
      
      // Always merge with pending visibility updates to prevent reverting other products
      const updatesToMerge = { ...pendingVisibilityUpdatesRef.current, ...preserveVisibilityUpdates };
      const merged = (data || []).map(product => {
        // Check if we have a pending update for this product
        if (updatesToMerge[product.id] !== undefined) {
          return { ...product, is_hidden: updatesToMerge[product.id] };
        }
        // Check if we have a saved visibility state that differs from DB (DB might have been reset)
        if (savedVisibility[product.id] !== undefined && savedVisibility[product.id] !== product.is_hidden) {
          console.warn(`Product ${product.id} visibility mismatch: DB=${product.is_hidden}, Saved=${savedVisibility[product.id]}. Restoring saved state.`);
          // Restore the saved state and update DB in background
          setTimeout(async () => {
            try {
              await supabase
                .from('marketplace_products')
                .update({ is_hidden: savedVisibility[product.id] })
                .eq('id', product.id)
                .eq('shopkeeper_id', userIdToUse);
            } catch (restoreErr) {
              console.error('Error restoring visibility state:', restoreErr);
            }
          }, 1000);
          return { ...product, is_hidden: savedVisibility[product.id] };
        }
        return product;
      });
      setProducts(merged);
      return merged;
    } catch (err) {
      console.error('Error loading products:', err);
      alert('Error loading products: ' + err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const scheduleProductsReload = () => {
    if (pendingReloadTimeoutRef.current) {
      clearTimeout(pendingReloadTimeoutRef.current);
    }
    pendingReloadTimeoutRef.current = setTimeout(async () => {
      if (isReloadingRef.current) return;
      if (!currentUser?.id) {
        console.warn('scheduleProductsReload: No currentUser.id available');
        return;
      }
      isReloadingRef.current = true;
      try {
        const updatesToPreserve = { ...pendingVisibilityUpdatesRef.current };
        if (Object.keys(updatesToPreserve).length === 0) {
          isReloadingRef.current = false;
          return;
        }
        
        // First, fetch raw DB data (without merging) to verify actual DB state
        const { data: rawData, error } = await supabase
          .from('marketplace_products')
          .select('id, is_hidden')
          .in('id', Object.keys(updatesToPreserve).map(id => id))
          .eq('shopkeeper_id', currentUser.id);
        
        if (error) {
          console.error('Error verifying DB state:', error);
          // Don't clear pending updates on error
          isReloadingRef.current = false;
          return;
        }
        
        // Verify which updates are actually persisted in DB
        const rawById = new Map((rawData || []).map(p => [p.id, p]));
        Object.entries(updatesToPreserve).forEach(([id, desiredHidden]) => {
          const rawProduct = rawById.get(id);
          // Only clear if DB actually matches desired state
          if (rawProduct && rawProduct.is_hidden === desiredHidden) {
            delete pendingVisibilityUpdatesRef.current[id];
          }
        });
        
        // Now reload with remaining pending updates (those not yet in DB)
        await loadProducts();
      } catch (e) {
        console.error('Scheduled reload error:', e);
      } finally {
        isReloadingRef.current = false;
      }
    }, 2000); // Increased delay to give DB more time to propagate
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

        // Get current user to verify authentication
        const currentUser = await authService.getCurrentUser();
        console.log('=== IMAGE UPLOAD DEBUG ===');
        console.log('Current user email:', currentUser?.email);
        console.log('Current user ID:', currentUser?.id);
        console.log('User metadata:', JSON.stringify(currentUser?.user_metadata, null, 2));
        console.log('Raw user meta data:', JSON.stringify(currentUser?.raw_user_meta_data, null, 2));
        console.log('User type from metadata:', currentUser?.user_metadata?.user_type);
        console.log('User type from raw:', currentUser?.raw_user_meta_data?.user_type);
        
        // Also check via RPC to verify user type
        try {
          const { data: rpcData, error: rpcError } = await supabase.rpc('get_users_with_type');
          if (!rpcError && rpcData) {
            const dbUser = rpcData.find(u => u.email === currentUser?.email);
            console.log('User type from RPC:');
            console.log('  Email:', dbUser?.email);
            console.log('  User Type:', dbUser?.user_type);
            console.log('  Is Admin:', dbUser?.is_admin);
            if (!dbUser || dbUser.user_type !== 'shopkeeper') {
              console.error('❌ PROBLEM: User type is not "shopkeeper"!');
              console.error('   Expected: "shopkeeper"');
              console.error('   Actual:', dbUser?.user_type || 'NULL');
            } else {
              console.log('✅ User type is correct: shopkeeper');
            }
          } else {
            console.error('RPC Error:', rpcError);
          }
        } catch (rpcErr) {
          console.error('Error checking user type via RPC:', rpcErr);
        }
        console.log('========================');

        const { error: uploadError } = await supabase.storage
          .from('marketplace-images')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Storage upload error details:', {
            error: uploadError,
            message: uploadError.message,
            status: uploadError.statusCode,
            statusCode: uploadError.statusCode,
            filePath: filePath,
            bucket: 'marketplace-images',
            errorDetails: JSON.stringify(uploadError, null, 2)
          });
          console.error('Full error object:', uploadError);
          throw uploadError;
        }

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
    if (!currentUser) {
      alert('You must be logged in to add products.');
      return;
    }

    try {
      setLoading(true);
      // Store HTML description to preserve formatting
      const { error } = await supabase
        .from('marketplace_products')
        .insert([{
          ...productForm,
          shopkeeper_id: currentUser.id,
          price: parseFloat(productForm.price),
          original_price: productForm.original_price ? parseFloat(productForm.original_price) : null,
          stock: parseInt(productForm.stock) || 1,
          description: descriptionHtml || ''
        }])
        .select()
        .single();

      if (error) throw error;
      await loadProducts();
      setProductForm({ name: '', price: '', original_price: '', image_urls: [], section_id: '', description: '', stock: 1 });
      setDescriptionHtml('');
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
    if (!editingProduct || !currentUser) return;

    try {
      setLoading(true);
      
      // Get current product state to preserve is_hidden
      const currentProduct = products.find(p => p.id === editingProduct.id);
      const preserveIsHidden = currentProduct?.is_hidden ?? false;
      
      const { error } = await supabase
        .from('marketplace_products')
        .update({
          name: productForm.name,
          price: parseFloat(productForm.price),
          original_price: productForm.original_price ? parseFloat(productForm.original_price) : null,
          image_urls: productForm.image_urls.length > 0 ? productForm.image_urls : null,
          section_id: productForm.section_id || null,
          stock: parseInt(productForm.stock) || 1,
          description: descriptionHtml || null,
          is_hidden: preserveIsHidden // CRITICAL: Preserve visibility state
        })
        .eq('id', editingProduct.id)
        .eq('shopkeeper_id', currentUser.id); // Ensure shopkeeper can only update their own products

      if (error) throw error;
      
      // Verify is_hidden was preserved
      const { data: verifyData } = await supabase
        .from('marketplace_products')
        .select('id, is_hidden')
        .eq('id', editingProduct.id)
        .single();
      
      if (verifyData && verifyData.is_hidden !== preserveIsHidden) {
        console.warn('is_hidden was not preserved, fixing...');
        await supabase
          .from('marketplace_products')
          .update({ is_hidden: preserveIsHidden })
          .eq('id', editingProduct.id)
          .eq('shopkeeper_id', currentUser.id);
      }
      
      await loadProducts();
      setEditingProduct(null);
      setProductForm({ name: '', price: '', original_price: '', image_urls: [], section_id: '', description: '', stock: 1 });
      setDescriptionHtml('');
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

  const handleHideProduct = async (product) => {
    // Prevent double-clicks or concurrent updates
    if (updatingVisibilityRef.current.has(product.id)) {
      return;
    }
    
    const isCurrentlyHidden = product.is_hidden || false;
    const newHiddenState = !isCurrentlyHidden;
    const action = isCurrentlyHidden ? 'show' : 'hide';
    
    if (!window.confirm(`Are you sure you want to ${action} this product? ${isCurrentlyHidden ? 'It will be visible to customers.' : 'It will be hidden from customers.'}`)) {
      return;
    }

    try {
      updatingVisibilityRef.current.add(product.id);
      setLoading(true);
      
      // Update with select to verify the update actually happened
      const { data: updatedData, error } = await supabase
        .from('marketplace_products')
        .update({ is_hidden: newHiddenState })
        .eq('id', product.id)
        .eq('shopkeeper_id', currentUser.id) // Ensure shopkeeper can only hide/show their own products
        .select('id, is_hidden')
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }
      
      // Verify the update actually persisted
      if (!updatedData) {
        throw new Error('Update failed - no data returned from database. You may not have permission to update this product.');
      }
      
      if (updatedData.is_hidden !== newHiddenState) {
        console.error('Update verification failed:', {
          expected: newHiddenState,
          actual: updatedData.is_hidden,
          productId: product.id
        });
        throw new Error(`Update verification failed - database state (${updatedData.is_hidden}) does not match expected value (${newHiddenState})`);
      }
      
      console.log('Product visibility updated successfully:', {
        productId: product.id,
        is_hidden: newHiddenState,
        verified: true
      });
      
      // Track this visibility update
      pendingVisibilityUpdatesRef.current[product.id] = newHiddenState;
      
      // Also save to localStorage as backup
      const savedVisibility = JSON.parse(localStorage.getItem('productVisibilityStates') || '{}');
      savedVisibility[product.id] = newHiddenState;
      localStorage.setItem('productVisibilityStates', JSON.stringify(savedVisibility));
      
      // Update local state immediately for better UX
      setProducts(prevProducts => 
        prevProducts.map(p => 
          p.id === product.id ? { ...p, is_hidden: newHiddenState } : p
        )
      );
      
      alert(`Product ${isCurrentlyHidden ? 'shown' : 'hidden'} successfully!`);
      
      // Verify update persisted after a short delay, then clear pending update
      setTimeout(async () => {
        try {
          const { data: verifyData, error: verifyError } = await supabase
            .from('marketplace_products')
            .select('id, is_hidden')
            .eq('id', product.id)
            .eq('shopkeeper_id', currentUser.id)
            .single();
          
          if (!verifyError && verifyData && verifyData.is_hidden === newHiddenState) {
            // Update persisted correctly, clear from pending
            delete pendingVisibilityUpdatesRef.current[product.id];
            console.log(`Verified: Product ${product.id} visibility update persisted`);
          } else {
            console.warn(`Warning: Product ${product.id} visibility may not have persisted correctly`);
          }
        } catch (verifyErr) {
          console.error('Error verifying update persistence:', verifyErr);
        }
      }, 3000); // Wait 3 seconds before verification
      
      updatingVisibilityRef.current.delete(product.id);
      
      if (onProductAdded) {
        onProductAdded();
      }
    } catch (err) {
      console.error('Error toggling product visibility:', err);
      alert('Error toggling product visibility: ' + err.message);
      // Reload products on error to ensure UI is in sync
      await loadProducts();
      updatingVisibilityRef.current.delete(product.id);
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
      
      await loadProducts();
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

  // Debug: Log user status to help troubleshoot
  useEffect(() => {
    if (!isCheckingUser) {
      console.log('ShopkeeperProductManager - User Status:', {
        isCheckingUser,
        userType,
        isAdmin,
        currentUser: currentUser?.email,
        willShow: !isCheckingUser && userType === 'shopkeeper' && !isAdmin
      });
    }
  }, [isCheckingUser, userType, isAdmin, currentUser]);

  // Don't render if:
  // 1. Still checking user status
  // 2. User is not a shopkeeper
  // 3. User is an admin (admins should use the admin panel, not this component)
  if (isCheckingUser) {
    return (
      <div className="shopkeeper-product-manager">
        <div className="loading-message">Checking user permissions...</div>
      </div>
    );
  }

  if (userType !== 'shopkeeper' || isAdmin) {
    // Show a helpful message for debugging
    if (currentUser) {
      const reason = isAdmin 
        ? 'You are logged in as an Admin. Please use the Admin Panel instead of the Shopkeeper Panel.'
        : `Your account type is "${userType || 'not set'}", but you need to be a "shopkeeper" to access this panel.`;
      
      console.warn('ShopkeeperProductManager - Not showing panel because:', {
        userType,
        isAdmin,
        userEmail: currentUser.email,
        reason
      });
      
      // Show a visible message to help user understand why panel isn't showing
      return (
        <div className="shopkeeper-product-manager">
          <div className="admin-section" style={{ 
            padding: '2rem', 
            textAlign: 'center',
            backgroundColor: '#fef3c7',
            border: '2px solid #f59e0b',
            borderRadius: '8px',
            margin: '2rem 0'
          }}>
            <h2 style={{ color: '#92400e', marginBottom: '1rem' }}>Shopkeeper Panel Not Available</h2>
            <p style={{ color: '#78350f', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              {reason}
            </p>
            {!isAdmin && (
              <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#fff', borderRadius: '6px' }}>
                <p style={{ color: '#374151', marginBottom: '0.5rem', fontWeight: '600' }}>
                  To fix this:
                </p>
                <ol style={{ textAlign: 'left', color: '#6b7280', maxWidth: '600px', margin: '0 auto' }}>
                  <li>Make sure you've created the shopkeeper account (shopkeeper@cvbuilder.com)</li>
                  <li>Run the SQL script: <code style={{ backgroundColor: '#f3f4f6', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>create_shopkeeper_test_account.sql</code></li>
                  <li>Verify your account has <code style={{ backgroundColor: '#f3f4f6', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>user_type = 'shopkeeper'</code> in the database</li>
                  <li>Log out and log back in</li>
                </ol>
                <p style={{ marginTop: '1rem', color: '#6b7280', fontSize: '0.9rem' }}>
                  Current Status: <strong>User Type = "{userType || 'not set'}"</strong>, <strong>Is Admin = {isAdmin ? 'Yes' : 'No'}</strong>
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="shopkeeper-product-manager">
      <div className="shopkeeper-header">
        <h1>My Products Management</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={loadProducts} 
            className="back-button"
            style={{ backgroundColor: '#3b82f6', color: 'white' }}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh Products'}
          </button>
        </div>
      </div>

      <div className="admin-tabs">
        <button
          type="button"
          className={activeTab === 'products' ? 'active' : ''}
          onClick={() => setActiveTab('products')}
        >
          Products
        </button>
        <button
          type="button"
          className={activeTab === 'inventory' ? 'active' : ''}
          onClick={() => setActiveTab('inventory')}
        >
          Inventory
        </button>
        <button
          type="button"
          className={activeTab === 'orders' ? 'active' : ''}
          onClick={() => {
            setActiveTab('orders');
            if (currentUser) {
              loadOrders();
            }
          }}
        >
          Orders
        </button>
      </div>

      {loading && activeTab === 'products' && products.length === 0 && (
        <div className="loading-message">Loading products...</div>
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
            <input
              type="number"
              placeholder="Stock Quantity"
              value={productForm.stock}
              onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
              required
              min="0"
              step="1"
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
                          style={{ 
                            display: 'block',
                            visibility: 'visible',
                            opacity: 1,
                            marginTop: '0.75rem'
                          }}
                        >
                          🗑️ Remove Picture
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
                setProductForm({ name: '', price: '', original_price: '', image_urls: [], section_id: '', description: '', stock: 1 });
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
                            description: description,
                            stock: product.stock?.toString() || '1'
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

      {activeTab === 'inventory' && (
        <div className="admin-section">
          <h2>Manage Inventory</h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            View and update stock quantities for your products.
          </p>
          
          {loading && products.length === 0 ? (
            <div className="loading-message">Loading inventory...</div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Product Name</th>
                    <th>Current Stock</th>
                    <th>Status</th>
                    <th>Update Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                        No products found. Add your first product in the Products tab.
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => {
                      const productStock = stockInputs[product.id] !== undefined 
                        ? stockInputs[product.id] 
                        : (product.stock?.toString() || '1');
                      
                      return (
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
                          <td style={{ fontWeight: '600' }}>{product.name}</td>
                          <td>
                            <span style={{
                              padding: '0.25rem 0.75rem',
                              borderRadius: '4px',
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              backgroundColor: (product.stock || 0) > 10 ? '#d1fae5' : (product.stock || 0) > 0 ? '#fef3c7' : '#fee2e2',
                              color: (product.stock || 0) > 10 ? '#065f46' : (product.stock || 0) > 0 ? '#92400e' : '#991b1b'
                            }}>
                              {product.stock || 0}
                            </span>
                          </td>
                          <td>
                            <span style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              backgroundColor: (product.stock || 0) > 10 ? '#d1fae5' : (product.stock || 0) > 0 ? '#fef3c7' : '#fee2e2',
                              color: (product.stock || 0) > 10 ? '#065f46' : (product.stock || 0) > 0 ? '#92400e' : '#991b1b'
                            }}>
                              {(product.stock || 0) > 10 ? '✅ In Stock' : (product.stock || 0) > 0 ? '⚠️ Low Stock' : '❌ Out of Stock'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <input
                                type="number"
                                value={productStock}
                                onChange={(e) => setStockInputs({ ...stockInputs, [product.id]: e.target.value })}
                                min="0"
                                step="1"
                                style={{
                                  width: '80px',
                                  padding: '0.5rem',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '4px'
                                }}
                                disabled={updatingStock[product.id]}
                              />
                              <button
                                onClick={async () => {
                                  const stockValue = parseInt(productStock);
                                  if (isNaN(stockValue) || stockValue < 0) {
                                    alert('Please enter a valid stock quantity (0 or greater)');
                                    return;
                                  }
                                  
                                  if (!window.confirm(`Update stock for "${product.name}" to ${stockValue}?`)) {
                                    return;
                                  }
                                  
                                  try {
                                    setUpdatingStock({ ...updatingStock, [product.id]: true });
                                    const { error } = await supabase
                                      .from('marketplace_products')
                                      .update({ stock: stockValue })
                                      .eq('id', product.id)
                                      .eq('shopkeeper_id', currentUser.id);
                                    
                                    if (error) throw error;
                                    await loadProducts();
                                    setStockInputs({ ...stockInputs, [product.id]: stockValue.toString() });
                                    alert('Stock updated successfully!');
                                  } catch (err) {
                                    console.error('Error updating stock:', err);
                                    alert('Error updating stock: ' + err.message);
                                  } finally {
                                    setUpdatingStock({ ...updatingStock, [product.id]: false });
                                  }
                                }}
                                disabled={updatingStock[product.id] || parseInt(productStock) === product.stock}
                                style={{
                                  padding: '0.5rem 1rem',
                                  backgroundColor: '#3b82f6',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: updatingStock[product.id] || parseInt(productStock) === product.stock ? 'not-allowed' : 'pointer',
                                  opacity: updatingStock[product.id] || parseInt(productStock) === product.stock ? 0.6 : 1
                                }}
                              >
                                {updatingStock[product.id] ? 'Updating...' : 'Update'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="admin-section">
          <h2>Manage Orders</h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            View and manage orders for your products.
          </p>
          
          <div style={{ marginBottom: '1rem' }}>
            <button 
              onClick={() => loadOrders()} 
              className="back-button"
              style={{ backgroundColor: '#3b82f6', color: 'white' }}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh Orders'}
            </button>
          </div>

          {loading && orders.length === 0 ? (
            <div className="loading-message">Loading orders...</div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
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
                      // Filter to show only items from this shopkeeper's products
                      const shopkeeperProductIds = products.map(p => p.id);
                      const shopkeeperOrderItems = orderItems.filter(item => shopkeeperProductIds.includes(item.id));
                      const totalItems = shopkeeperOrderItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
                      const shopkeeperTotal = shopkeeperOrderItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
                      
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
                          <td>Rs. {shopkeeperTotal?.toLocaleString() || '0'}</td>
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
                                window.location.hash = `#order-details?orderId=${orderId}&from=shopkeeper`;
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
          )}
        </div>
      )}
    </div>
  );
};

export default ShopkeeperProductManager;

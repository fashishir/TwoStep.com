import { useState, useEffect, useCallback } from 'react';
import { productsAPI, categoriesAPI } from '../../services/api';
import { formatPrice } from '../../utils/formatPrice';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiImage } from 'react-icons/fi';
import './AdminPages.scss';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    salePrice: '',
    sku: '',
    stockQuantity: '',
    categoryId: '',
    isFeatured: false,
  });

  const [sizes, setSizes] = useState(['']);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [removedImageIds, setRemovedImageIds] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [pagination.page]);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await productsAPI.getAll({ page: pagination.page, limit: 10 });
      if (response.data.success) {
        setProducts(response.data.data.items);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page]);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: '', description: '', price: '', salePrice: '',
      sku: '', stockQuantity: '', categoryId: '', isFeatured: false,
    });
    setImages([]);
    setImagePreviews([]);
    setRemovedImageIds([]);
    setSizes(['']);
  };

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        salePrice: product.sale_price || '',
        sku: product.sku || '',
        stockQuantity: product.stock_quantity || '',
        categoryId: product.category_id || '',
        isFeatured: product.is_featured || false,
      });

      const existingPreviews = (product.images || []).map(img => ({
        id: img.id,
        url: img.image_url,
        isExisting: true,
      }));
      setImagePreviews(existingPreviews);
      setRemovedImageIds([]);

      const extractedSizes = (product.filters || [])
        .filter((f) => f.filter_key === 'size' && f.filter_value)
        .map((f) => String(f.filter_value));

      setSizes(extractedSizes.length ? extractedSizes : ['']);
    } else {
      resetForm();
    }
    setImages([]);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImageChange = (e) => {
    const newFiles = Array.from(e.target.files);
    if (newFiles.length === 0) return;
    setImages(prev => [...prev, ...newFiles]);
    const newPreviews = newFiles.map(file => ({
      url: URL.createObjectURL(file),
      isExisting: false,
    }));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const handleRemoveImage = (index) => {
    const preview = imagePreviews[index];
    if (preview.isExisting && preview.id) {
      setRemovedImageIds(prev => [...prev, preview.id]);
    } else if (!preview.isExisting) {
      // Revoke object URL to prevent memory leak
      URL.revokeObjectURL(preview.url);
      // Also remove from images array if it's a new file
      const newIndex = imagePreviews.slice(0, index).filter(p => !p.isExisting).length;
      setImages(prev => prev.filter((_, i) => i !== newIndex));
    }
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!formData.name || !formData.price || !formData.categoryId) {
      alert('Name, price, and category are required');
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description || '');
      data.append('price', formData.price);
      data.append('salePrice', formData.salePrice || '');
      data.append('sku', formData.sku || '');
      data.append('stockQuantity', formData.stockQuantity || '0');
      data.append('categoryId', formData.categoryId);
      data.append('isFeatured', String(formData.isFeatured));

      const normalizedSizes = (sizes || [])
        .map((s) => String(s || '').trim())
        .filter(Boolean);

      const filtersPayload = normalizedSizes.map((s) => ({ key: 'size', value: s }));
      data.append('filters', JSON.stringify(filtersPayload));

      images.forEach((image) => {
        data.append('images', image);
      });

      if (editingProduct) {
        if (removedImageIds.length > 0) {
          data.append('removedImageIds', JSON.stringify(removedImageIds));
        }
        await productsAPI.update(editingProduct.id, data);
      } else {
        await productsAPI.create(data);
      }

      await fetchProducts();
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save product:', error);
      alert(error.response?.data?.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productsAPI.delete(id);
        fetchProducts();
      } catch (error) {
        console.error('Failed to delete product:', error);
        alert('Failed to delete product');
      }
    }
  };

  if (loading) return <div className="loading" />;

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h2>Products ({pagination.total})</h2>
        <button className="btn btn--primary" onClick={() => handleOpenModal()}>
          <FiPlus size={18} />
          <span className="admin-page__btn-text">Add Product</span>
        </button>
      </div>

      {/* Desktop Table */}
      <div className="admin-page__table-wrapper admin-page__table-wrapper--desktop">
        <table className="admin-page__table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Featured</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: '#757575' }}>
                  No products found. Click "Add Product" to create one.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="admin-page__image">
                      {product.images?.[0]?.image_url ? (
                        <img src={product.images[0].image_url} alt={product.name} />
                      ) : (
                        <div className="admin-page__no-image"><FiImage size={16} /></div>
                      )}
                    </div>
                  </td>
                  <td><strong>{product.name}</strong></td>
                  <td>{product.category_name || '-'}</td>
                  <td>
                    {product.sale_price ? (
                      <>
                        <span className="admin-page__sale-price">{formatPrice(product.sale_price)}</span>{' '}
                        <span className="admin-page__original-price">{formatPrice(product.price)}</span>
                      </>
                    ) : (
                      formatPrice(product.price)
                    )}
                  </td>
                  <td>
                    <span className={`admin-page__stock ${product.stock_quantity === 0 ? 'admin-page__stock--out' : ''}`}>
                      {product.stock_quantity}
                    </span>
                  </td>
                  <td>{product.is_featured ? 'Yes' : 'No'}</td>
                  <td>
                    <div className="admin-page__actions">
                      <button onClick={() => handleOpenModal(product)} className="admin-page__action-btn" title="Edit">
                        <FiEdit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="admin-page__action-btn admin-page__action-btn--delete" title="Delete">
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
      <div className="admin-page__card-list">
        {products.length === 0 ? (
          <div className="admin-page__empty">
            <p>No products found. Click "Add Product" to create one.</p>
          </div>
        ) : (
          products.map((product) => (
            <div key={product.id} className="admin-product-card">
              <div className="admin-product-card__image">
                {product.images?.[0]?.image_url ? (
                  <img src={product.images[0].image_url} alt={product.name} />
                ) : (
                  <div className="admin-product-card__no-image"><FiImage size={24} /></div>
                )}
              </div>
              <div className="admin-product-card__info">
                <h3 className="admin-product-card__name">{product.name}</h3>
                <p className="admin-product-card__category">{product.category_name || '-'}</p>
                <div className="admin-product-card__details">
                  <span className="admin-product-card__price">
                    {product.sale_price ? (
                      <>
                        <span className="admin-page__sale-price">{formatPrice(product.sale_price)}</span>{' '}
                        <span className="admin-page__original-price">{formatPrice(product.price)}</span>
                      </>
                    ) : (
                      formatPrice(product.price)
                    )}
                  </span>
                  <span className={`admin-product-card__stock ${product.stock_quantity === 0 ? 'admin-product-card__stock--out' : ''}`}>
                    Stock: {product.stock_quantity}
                  </span>
                </div>
                {product.is_featured && <span className="admin-product-card__featured">Featured</span>}
              </div>
              <div className="admin-product-card__actions">
                <button onClick={() => handleOpenModal(product)} className="admin-page__action-btn" title="Edit">
                  <FiEdit2 size={16} />
                </button>
                <button onClick={() => handleDelete(product.id)} className="admin-page__action-btn admin-page__action-btn--delete" title="Delete">
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="admin-page__pagination">
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page === 1}
          >
            Previous
          </button>
          <span>Page {pagination.page} of {pagination.pages}</span>
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page === pagination.pages}
          >
            Next
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="admin-modal">
          <div className="admin-modal__overlay" onClick={submitting ? undefined : handleCloseModal} />
          <div className="admin-modal__content">
            <div className="admin-modal__header">
              <h3>{editingProduct ? 'Edit Product' : 'Add Product'}</h3>
              <button onClick={handleCloseModal} className="admin-modal__close" disabled={submitting}>
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="admin-modal__form">
              <div className="admin-modal__field">
                <label>Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required disabled={submitting} />
              </div>

              <div className="admin-modal__field">
                <label>Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={3} disabled={submitting} />
              </div>

              <div className="admin-modal__row">
                <div className="admin-modal__field">
                  <label>Price *</label>
                  <input type="number" name="price" value={formData.price} onChange={handleChange} step="0.01" required disabled={submitting} />
                </div>
                <div className="admin-modal__field">
                  <label>Sale Price</label>
                  <input type="number" name="salePrice" value={formData.salePrice} onChange={handleChange} step="0.01" disabled={submitting} />
                </div>
              </div>

              <div className="admin-modal__row">
                <div className="admin-modal__field">
                  <label>SKU</label>
                  <input type="text" name="sku" value={formData.sku} onChange={handleChange} disabled={submitting} />
                </div>
                <div className="admin-modal__field">
                  <label>Stock Quantity *</label>
                  <input type="number" name="stockQuantity" value={formData.stockQuantity} onChange={handleChange} required disabled={submitting} />
                </div>
              </div>

              <div className="admin-modal__field">
                <label>Sizes</label>
                <div className="admin-modal__sizes">
                  {sizes.map((size, index) => (
                    <div key={`${index}-${size}`} className="admin-modal__size-row">
                      <input
                        type="text"
                        placeholder={index === 0 ? 'e.g., S' : 'e.g., M'}
                        value={size}
                        onChange={(e) => {
                          const value = e.target.value;
                          setSizes((prev) => {
                            const next = [...prev];
                            next[index] = value;
                            return next;
                          });
                        }}
                        disabled={submitting}
                      />
                      {sizes.length > 1 && (
                        <button
                          type="button"
                          className="admin-modal__size-remove"
                          onClick={() => {
                            setSizes((prev) => {
                              const next = prev.filter((_, i) => i !== index);
                              return next.length ? next : [''];
                            });
                          }}
                          disabled={submitting}
                          title="Remove size"
                        >
                          <FiX size={12} />
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() => setSizes((prev) => [...prev, ''])}
                    disabled={submitting}
                    style={{ marginTop: '8px' }}
                  >
                    <FiPlus size={16} /> Add size
                  </button>
                </div>
              </div>

              <div className="admin-modal__field">
                <label>Category *</label>
                <select name="categoryId" value={formData.categoryId} onChange={handleChange} required disabled={submitting}>
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="admin-modal__field">
                <label>Images</label>
                <input type="file" accept="image/*" multiple onChange={handleImageChange} disabled={submitting} />
                {imagePreviews.length > 0 && (
                  <div className="admin-modal__image-previews">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="admin-modal__image-preview">
                        <img src={preview.url} alt={`Preview ${index + 1}`} />
                        <button
                          type="button"
                          className="admin-modal__image-remove"
                          onClick={() => handleRemoveImage(index)}
                          disabled={submitting}
                        >
                          <FiX size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <label className="admin-modal__checkbox">
                <input type="checkbox" name="isFeatured" checked={formData.isFeatured} onChange={handleChange} disabled={submitting} />
                Featured Product
              </label>

              <div className="admin-modal__actions">
                <button type="button" onClick={handleCloseModal} className="btn btn--secondary" disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingProduct ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;

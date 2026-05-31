import { useState, useEffect } from 'react';
import { productsAPI, categoriesAPI } from '../../services/api';
import { formatPrice } from '../../utils/formatPrice';
import { FiPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
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
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [pagination.page]);

  useEffect(() => {
    return () => {
      imagePreviews.forEach(p => {
        if (!p.isExisting) URL.revokeObjectURL(p.url);
      });
    };
  }, [imagePreviews]);

  const fetchProducts = async () => {
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
  };

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

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price,
        salePrice: product.sale_price || '',
        sku: product.sku || '',
        stockQuantity: product.stock_quantity,
        categoryId: product.category_id,
        isFeatured: product.is_featured,
      });
      const existingPreviews = (product.images || []).map(img => ({
        url: img.image_url,
        isExisting: true,
      }));
      setImagePreviews(existingPreviews);
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        salePrice: '',
        sku: '',
        stockQuantity: '',
        categoryId: '',
        isFeatured: false,
      });
      setImagePreviews([]);
    }
    setImages([]);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      salePrice: '',
      sku: '',
      stockQuantity: '',
      categoryId: '',
      isFeatured: false,
    });
    setImages([]);
    setImagePreviews([]);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleImageChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setImages(newFiles);
    const newPreviews = newFiles.map(file => ({
      url: URL.createObjectURL(file),
      isExisting: false,
    }));
    setImagePreviews(prev => [...prev.filter(p => p.isExisting), ...newPreviews]);
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
      images.forEach((image) => {
        data.append('images', image);
      });

      if (editingProduct) {
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

  if (loading) {
    return <div className="loading" />;
  }

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h2>Products ({pagination.total})</h2>
        <button className="btn btn--primary" onClick={() => handleOpenModal()}>
          <FiPlus size={18} />
          Add Product
        </button>
      </div>

      <div className="admin-page__table-wrapper">
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
            {products.map((product) => (
              <tr key={product.id}>
                <td>
                  <div className="admin-page__image">
                    {product.images?.[0]?.image_url ? (
                      <img src={product.images[0].image_url} alt={product.name} />
                    ) : (
                      <div className="admin-page__no-image">No Image</div>
                    )}
                  </div>
                </td>
                <td>{product.name}</td>
                <td>{product.category_name}</td>
                <td>
                  {product.sale_price ? (
                    <>
                      <span className="admin-page__sale-price">{formatPrice(product.sale_price)}</span>
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
                    <button onClick={() => handleOpenModal(product)} className="admin-page__action-btn">
                      <FiEdit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="admin-page__action-btn admin-page__action-btn--delete">
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.pages > 1 && (
        <div className="admin-page__pagination">
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            disabled={pagination.page === 1}
          >
            Previous
          </button>
          <span>Page {pagination.page} of {pagination.pages}</span>
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            disabled={pagination.page === pagination.pages}
          >
            Next
          </button>
        </div>
      )}

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
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="admin-modal__field">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  disabled={submitting}
                />
              </div>

              <div className="admin-modal__row">
                <div className="admin-modal__field">
                  <label>Price *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    step="0.01"
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="admin-modal__field">
                  <label>Sale Price</label>
                  <input
                    type="number"
                    name="salePrice"
                    value={formData.salePrice}
                    onChange={handleChange}
                    step="0.01"
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="admin-modal__row">
                <div className="admin-modal__field">
                  <label>SKU</label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                </div>

                <div className="admin-modal__field">
                  <label>Stock Quantity *</label>
                  <input
                    type="number"
                    name="stockQuantity"
                    value={formData.stockQuantity}
                    onChange={handleChange}
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="admin-modal__field">
                <label>Category *</label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  required
                  disabled={submitting}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="admin-modal__field">
                <label>Images</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  disabled={submitting}
                />
                {imagePreviews.length > 0 && (
                  <div className="admin-modal__image-previews">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="admin-modal__image-preview">
                        <img src={preview.url} alt={`Preview ${index + 1}`} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <label className="admin-modal__checkbox">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleChange}
                  disabled={submitting}
                />
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

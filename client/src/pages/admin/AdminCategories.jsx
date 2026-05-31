import { useState, useEffect } from 'react';
import { categoriesAPI } from '../../services/api';
import { FiPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import './AdminPages.scss';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentId: '',
    sortOrder: '',
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        parentId: category.parent_id || '',
        sortOrder: category.sort_order || '',
      });
      setImagePreview(category.image_url || null);
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        parentId: '',
        sortOrder: '',
      });
      setImagePreview(null);
    }
    setImage(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '', parentId: '', sortOrder: '' });
    setImage(null);
    setImagePreview(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append('name', formData.name);
      if (formData.description) data.append('description', formData.description);
      if (formData.parentId) data.append('parentId', formData.parentId);
      if (formData.sortOrder) data.append('sortOrder', formData.sortOrder);
      if (image) data.append('image', image);

      if (editingCategory) {
        await categoriesAPI.update(editingCategory.id, data);
      } else {
        await categoriesAPI.create(data);
      }

      handleCloseModal();
      fetchCategories();
    } catch (error) {
      console.error('Failed to save category:', error);
      alert(error.response?.data?.message || 'Failed to save category');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await categoriesAPI.delete(id);
        fetchCategories();
      } catch (error) {
        console.error('Failed to delete category:', error);
        alert(error.response?.data?.message || 'Failed to delete category');
      }
    }
  };

  const allCategories = [];
  categories.forEach((cat) => {
    allCategories.push(cat);
    if (cat.children) {
      cat.children.forEach((child) => allCategories.push(child));
    }
  });

  if (loading) {
    return <div className="loading" />;
  }

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h2>Categories ({allCategories.length})</h2>
        <button className="btn btn--primary" onClick={() => handleOpenModal()}>
          <FiPlus size={18} />
          Add Category
        </button>
      </div>

      <div className="admin-page__table-wrapper">
        <table className="admin-page__table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Description</th>
              <th>Products</th>
              <th>Sort Order</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td>
                  <div className="admin-page__image">
                    {category.image_url ? (
                      <img src={category.image_url} alt={category.name} />
                    ) : (
                      <div className="admin-page__no-image">No Image</div>
                    )}
                  </div>
                </td>
                <td>
                  <strong>{category.name}</strong>
                  {category.children?.length > 0 && (
                    <div style={{ fontSize: '12px', color: '#757575', marginTop: '4px' }}>
                      {category.children.map((child) => (
                        <span key={child.id} style={{ marginRight: '8px' }}>{child.name}</span>
                      ))}
                    </div>
                  )}
                </td>
                <td>{category.description || '-'}</td>
                <td>{category.product_count || 0}</td>
                <td>{category.sort_order}</td>
                <td>
                  <div className="admin-page__actions">
                    <button onClick={() => handleOpenModal(category)} className="admin-page__action-btn">
                      <FiEdit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(category.id)} className="admin-page__action-btn admin-page__action-btn--delete">
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="admin-modal">
          <div className="admin-modal__overlay" onClick={handleCloseModal} />
          <div className="admin-modal__content">
            <div className="admin-modal__header">
              <h3>{editingCategory ? 'Edit Category' : 'Add Category'}</h3>
              <button onClick={handleCloseModal} className="admin-modal__close">
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
                />
              </div>

              <div className="admin-modal__field">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                />
              </div>

              <div className="admin-modal__row">
                <div className="admin-modal__field">
                  <label>Parent Category</label>
                  <select
                    name="parentId"
                    value={formData.parentId}
                    onChange={handleChange}
                  >
                    <option value="">None (Root)</option>
                    {categories.filter((c) => !c.parent_id).map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="admin-modal__field">
                  <label>Sort Order</label>
                  <input
                    type="number"
                    name="sortOrder"
                    value={formData.sortOrder}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="admin-modal__field">
                <label>Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {imagePreview && (
                  <div style={{ marginTop: '8px' }}>
                    <img src={imagePreview} alt="Preview" style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'cover' }} />
                  </div>
                )}
              </div>

              <div className="admin-modal__actions">
                <button type="button" onClick={handleCloseModal} className="btn btn--secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary">
                  {editingCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;

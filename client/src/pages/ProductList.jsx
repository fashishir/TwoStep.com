import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/products/ProductCard';
import { productsAPI, categoriesAPI } from '../services/api';
import { FiSliders, FiX } from 'react-icons/fi';
import './ProductList.scss';

const ProductList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [availableFilters, setAvailableFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const currentPage = parseInt(searchParams.get('page')) || 1;
  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'newest';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  useEffect(() => {
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
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = { page: currentPage, limit: 12, sort };
        if (category) params.category = category;
        if (search) params.search = search;
        if (minPrice) params.minPrice = minPrice;
        if (maxPrice) params.maxPrice = maxPrice;

        const response = await productsAPI.getAll(params);
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
    fetchProducts();
  }, [category, search, sort, minPrice, maxPrice, currentPage]);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const response = await productsAPI.getFilters();
        if (response.data.success) {
          setAvailableFilters(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch filters:', error);
      }
    };
    fetchFilters();
  }, []);

  const updateSearchParams = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page');
    setSearchParams(params);
  };

  const handlePageChange = (page) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="product-list">
      <div className="container">
        <div className="product-list__header">
          <h1 className="heading heading--md">
            {category ? category.charAt(0).toUpperCase() + category.slice(1) : search ? `Results for "${search}"` : 'All Products'}
          </h1>
          <div className="product-list__controls">
            <button
              className="product-list__filter-btn"
              onClick={() => setIsFilterOpen(true)}
            >
              <FiSliders />
              Filter
            </button>
            <select
              value={sort}
              onChange={(e) => updateSearchParams('sort', e.target.value)}
              className="product-list__sort"
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>

        <div className="product-list__layout">
          <aside className={`product-list__sidebar ${isFilterOpen ? 'product-list__sidebar--open' : ''}`}>
            <div className="product-list__sidebar-header">
              <h3>Filters</h3>
              <button onClick={() => setIsFilterOpen(false)} className="product-list__close">
                <FiX size={20} />
              </button>
            </div>

            <div className="product-list__filter-group">
              <h4 className="product-list__filter-title">Category</h4>
              <label className="product-list__filter-option">
                <input
                  type="radio"
                  name="category"
                  checked={!category}
                  onChange={() => updateSearchParams('category', '')}
                />
                All Categories
              </label>
              {categories.map((cat) => (
                <label key={cat.id} className="product-list__filter-option">
                  <input
                    type="radio"
                    name="category"
                    checked={category === cat.slug}
                    onChange={() => updateSearchParams('category', cat.slug)}
                  />
                  {cat.name} ({cat.product_count})
                </label>
              ))}
            </div>

            <div className="product-list__filter-group">
              <h4 className="product-list__filter-title">Price Range</h4>
              <div className="product-list__price-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => updateSearchParams('minPrice', e.target.value)}
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => updateSearchParams('maxPrice', e.target.value)}
                />
              </div>
            </div>

            {Object.entries(availableFilters).map(([key, values]) => (
              <div key={key} className="product-list__filter-group">
                <h4 className="product-list__filter-title">{key}</h4>
                {values.map((value) => (
                  <label key={value} className="product-list__filter-option">
                    <input type="checkbox" />
                    {value}
                  </label>
                ))}
              </div>
            ))}
          </aside>

          <main className="product-list__main">
            {loading ? (
              <div className="loading" />
            ) : products.length === 0 ? (
              <div className="product-list__empty">
                <p>No products found</p>
              </div>
            ) : (
              <>
                <div className="product-list__grid">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {pagination.pages > 1 && (
                  <div className="product-list__pagination">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="product-list__page-btn"
                    >
                      Previous
                    </button>
                    <span className="product-list__page-info">
                      Page {currentPage} of {pagination.pages}
                    </span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === pagination.pages}
                      className="product-list__page-btn"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProductList;

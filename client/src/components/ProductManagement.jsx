import React, { useState, useEffect, useCallback } from 'react';
// --- FIX: We only need our magical API instance now! ---
import API from '../api/axios.js';

const ConfirmationModal = ({ show, onClose, onConfirm, title, children }) => {
    if (!show) return null;
    return (
        <div className="modal-backdrop" style={{ display: 'flex', position: 'fixed', zIndex: 1052 }}>
            <div className="modal-content">
                <div className="modal-header"><h4>{title}</h4><button onClick={onClose} className="modal-close-btn">&times;</button></div>
                <div className="modal-body">{children}</div>
                <div className="modal-actions">
                    <button onClick={onClose} className="btn btn-secondary-action">Cancel</button>
                    <button onClick={onConfirm} className="btn btn-danger-action">Confirm</button>
                </div>
            </div>
        </div>
    );
};

const ProductFormModal = ({ show, onClose, onSave, product, setProduct }) => {
    if (!show) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProduct(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave();
    };

    return (
        <div className="modal-backdrop" style={{ display: 'flex', position: 'fixed', zIndex: 1051 }}>
            <div className="modal-content">
                <form onSubmit={handleSubmit}>
                    <div className="modal-header">
                        <h4>{product.id ? 'Edit Product' : 'Add New Product'}</h4>
                        <button type="button" onClick={onClose} className="modal-close-btn">&times;</button>
                    </div>
                    <div className="modal-body">
                        <div style={{marginBottom: '1rem'}}><label>Name</label><input type="text" name="name" value={product.name || ''} onChange={handleChange} required /></div>
                        <div style={{marginBottom: '1rem'}}><label>Category</label><input type="text" name="category" value={product.category || ''} onChange={handleChange} /></div>
                        <div style={{marginBottom: '1rem'}}><label>Description</label><textarea name="description" value={product.description || ''} onChange={handleChange} rows="3"></textarea></div>
                        <div style={{display: 'flex', gap: '1rem', marginBottom: '1rem'}}>
                            <div style={{flex: 1}}><label>Price</label><input type="number" name="price" value={product.price || ''} onChange={handleChange} required step="0.01" /></div>
                            <div style={{flex: 1}}><label>Stock Quantity</label><input type="number" name="stock_quantity" value={product.stock_quantity || ''} onChange={handleChange} required /></div>
                        </div>
                        <div><label>Image URL</label><input type="text" name="imageUrl" value={product.imageUrl || ''} onChange={handleChange} /></div>
                    </div>
                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn btn-secondary-action">Cancel</button>
                        <button type="submit" className="btn">{product.id ? 'Save Changes' : 'Create Product'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

function ProductManagement() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState({});

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await API.get('/admin/products');
            setProducts(response.data.products || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch products.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleSaveProduct = async () => {
        setError(null);
        try {
            // --- FIX: The token is handled automatically by the interceptor! ---
            const productData = { ...selectedProduct };
            const action = selectedProduct.id
                ? API.put(`/admin/products/${selectedProduct.id}`, productData)
                : API.post('/admin/products', productData);
            
            await action;
            setFormModalOpen(false);
            fetchProducts();
        } catch(err) {
            setError(err.response?.data?.message || 'Failed to save the product.');
        }
    };
    
    const handleDeleteConfirm = async () => {
        setError(null);
        setDeleteModalOpen(false);
        try {
            // --- FIX: The token is handled automatically by the interceptor! ---
            await API.delete(`/admin/products/${selectedProduct.id}`);
            fetchProducts();
        } catch(err) {
             setError(err.response?.data?.message || 'Failed to delete the product.');
        }
    };

    const openAddModal = () => {
        setSelectedProduct({ name: '', price: '', description: '', stock_quantity: '', category: '', imageUrl: '' });
        setFormModalOpen(true);
    };

    const openEditModal = (product) => {
        setSelectedProduct(product);
        setFormModalOpen(true);
    };
    
    const openDeleteModal = (product) => {
        setSelectedProduct(product);
        setDeleteModalOpen(true);
    }

    if (loading) {
        return <div className="loading-spinner-container"><div className="loading-spinner"></div><p>Loading Products...</p></div>;
    }

    return (
        <>
            <ProductFormModal
                show={isFormModalOpen}
                onClose={() => setFormModalOpen(false)}
                onSave={handleSaveProduct}
                product={selectedProduct}
                setProduct={setSelectedProduct}
            />
            <ConfirmationModal
                show={isDeleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Confirm Deletion"
            >
                <p>Are you sure you want to delete the product <strong>{selectedProduct.name}</strong>?</p>
            </ConfirmationModal>

            <div className="card">
                <div className="card-header">
                    <h2>Product Management</h2>
                    <button className="btn" onClick={openAddModal}>
                        <i className="fas fa-plus" style={{marginRight: '8px'}}></i> Add New Product
                    </button>
                </div>
                <div className="card-content">
                    {error && <div className="message-area error" style={{ display: 'block' }}>{error}</div>}
                    <div className="table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Image</th>
                                    <th>Name</th>
                                    <th>Category</th>
                                    <th>Price</th>
                                    <th>Stock</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.length > 0 ? products.map(product => (
                                    <tr key={product.id}>
                                        <td>
                                            <img src={product.imageUrl || `https://placehold.co/50x50/cccccc/1a0922?text=N/A`} alt={product.name} className="product-table-image" />
                                        </td>
                                        <td>{product.name}</td>
                                        <td>{product.category || 'N/A'}</td>
                                        <td>${Number(product.price).toFixed(2)}</td>
                                        <td>{product.stock_quantity}</td>
                                        <td>
                                            <button className="btn btn-sm btn-secondary-action" onClick={() => openEditModal(product)}>
                                                Edit
                                            </button>
                                            <button className="btn btn-sm btn-danger-action" style={{marginLeft: '8px'}} onClick={() => openDeleteModal(product)}>
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '1rem' }}>No products found. Click "Add New Product" to start.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProductManagement;

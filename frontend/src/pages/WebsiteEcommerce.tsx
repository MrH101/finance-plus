import React, { useState, useEffect } from 'react';

interface WebsitePage {
  id: number;
  title: string;
  slug: string;
  content: string;
  meta_description: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  parent_name: string;
  is_active: boolean;
  created_at: string;
}

interface ProductReview {
  id: number;
  product_name: string;
  customer_name: string;
  customer_email: string;
  rating: number;
  review_text: string;
  is_approved: boolean;
  created_at: string;
}

const WebsiteEcommerce: React.FC = () => {
  const [activeTab, setActiveTab] = useState('pages');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [websitePages, setWebsitePages] = useState<WebsitePage[]>([]);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
  const [productReviews, setProductReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);

  const tabs = [
    { key: 'pages', label: 'Website Pages' },
    { key: 'categories', label: 'Product Categories' },
    { key: 'reviews', label: 'Product Reviews' },
    { key: 'dashboard', label: 'Dashboard' },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pagesRes, categoriesRes, reviewsRes] = await Promise.all([
        fetch('/api/website-pages/'),
        fetch('/api/product-categories/'),
        fetch('/api/product-reviews/')
      ]);

      if (pagesRes.ok) {
        const pagesData = await pagesRes.json();
        setWebsitePages(pagesData);
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setProductCategories(categoriesData);
      }

      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json();
        setProductReviews(reviewsData);
      }
    } catch (error) {
      console.error('Error fetching website/e-commerce data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());

    try {
      const endpoint = modalType === 'page' ? '/api/website-pages/' :
                      modalType === 'category' ? '/api/product-categories/' :
                      '/api/product-reviews/';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        setShowModal(false);
        fetchData();
      }
    } catch (error) {
      console.error('Error creating website/e-commerce record:', error);
    }
  };

  const openModal = (type: string) => {
    setModalType(type);
    setShowModal(true);
  };

  const renderPages = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Website Pages</h3>
        <button 
          onClick={() => openModal('page')} 
          className="bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700 transition"
        >
          + New Page
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr className="bg-purple-50">
              <th className="py-2 px-4 text-left">Title</th>
              <th className="py-2 px-4 text-left">Slug</th>
              <th className="py-2 px-4 text-left">Status</th>
              <th className="py-2 px-4 text-left">Created</th>
            </tr>
          </thead>
          <tbody>
            {websitePages.map(page => (
              <tr key={page.id} className="border-b hover:bg-purple-50">
                <td className="py-2 px-4">{page.title}</td>
                <td className="py-2 px-4 text-sm text-gray-600">{page.slug}</td>
                <td className="py-2 px-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    page.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {page.is_published ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td className="py-2 px-4 text-sm">{new Date(page.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCategories = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Product Categories</h3>
        <button 
          onClick={() => openModal('category')} 
          className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 transition"
        >
          + New Category
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr className="bg-green-50">
              <th className="py-2 px-4 text-left">Name</th>
              <th className="py-2 px-4 text-left">Slug</th>
              <th className="py-2 px-4 text-left">Parent Category</th>
              <th className="py-2 px-4 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {productCategories.map(category => (
              <tr key={category.id} className="border-b hover:bg-green-50">
                <td className="py-2 px-4">{category.name}</td>
                <td className="py-2 px-4 text-sm text-gray-600">{category.slug}</td>
                <td className="py-2 px-4">{category.parent_name || 'None'}</td>
                <td className="py-2 px-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    category.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {category.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderReviews = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Product Reviews</h3>
        <button 
          onClick={() => openModal('review')} 
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition"
        >
          + New Review
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr className="bg-blue-50">
              <th className="py-2 px-4 text-left">Product</th>
              <th className="py-2 px-4 text-left">Customer</th>
              <th className="py-2 px-4 text-left">Rating</th>
              <th className="py-2 px-4 text-left">Status</th>
              <th className="py-2 px-4 text-left">Date</th>
            </tr>
          </thead>
          <tbody>
            {productReviews.map(review => (
              <tr key={review.id} className="border-b hover:bg-blue-50">
                <td className="py-2 px-4">{review.product_name}</td>
                <td className="py-2 px-4">
                  <div>
                    <div className="font-medium">{review.customer_name}</div>
                    <div className="text-sm text-gray-600">{review.customer_email}</div>
                  </div>
                </td>
                <td className="py-2 px-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="ml-1 text-sm text-gray-600">({review.rating})</span>
                  </div>
                </td>
                <td className="py-2 px-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    review.is_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {review.is_approved ? 'Approved' : 'Pending'}
                  </span>
                </td>
                <td className="py-2 px-4 text-sm">{new Date(review.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderDashboard = () => {
    const totalPages = websitePages.length;
    const publishedPages = websitePages.filter(p => p.is_published).length;
    const totalCategories = productCategories.length;
    const activeCategories = productCategories.filter(c => c.is_active).length;
    const totalReviews = productReviews.length;
    const approvedReviews = productReviews.filter(r => r.is_approved).length;
    const averageRating = productReviews.length > 0 
      ? (productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length).toFixed(1)
      : '0.0';

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Total Pages</h3>
            <p className="text-3xl font-bold text-purple-600">{totalPages}</p>
            <p className="text-sm text-gray-500">{publishedPages} published</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Product Categories</h3>
            <p className="text-3xl font-bold text-green-600">{totalCategories}</p>
            <p className="text-sm text-gray-500">{activeCategories} active</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Product Reviews</h3>
            <p className="text-3xl font-bold text-blue-600">{totalReviews}</p>
            <p className="text-sm text-gray-500">{approvedReviews} approved</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Average Rating</h3>
            <p className="text-3xl font-bold text-yellow-600">{averageRating}</p>
            <p className="text-sm text-gray-500">out of 5 stars</p>
          </div>
        </div>
      </div>
    );
  };

  const renderModal = () => {
    if (!showModal) return null;

    const getModalTitle = () => {
      switch (modalType) {
        case 'page': return 'New Website Page';
        case 'category': return 'New Product Category';
        case 'review': return 'New Product Review';
        default: return 'New Record';
      }
    };

    const getModalFields = () => {
      switch (modalType) {
        case 'page':
          return (
            <>
              <input name="title" className="w-full border rounded px-3 py-2" placeholder="Page Title" required />
              <input name="slug" className="w-full border rounded px-3 py-2" placeholder="URL Slug" required />
              <textarea name="content" className="w-full border rounded px-3 py-2" placeholder="Page Content" rows={6} required />
              <textarea name="meta_description" className="w-full border rounded px-3 py-2" placeholder="Meta Description" rows={3} />
              <label className="flex items-center">
                <input name="is_published" type="checkbox" className="mr-2" />
                Publish Page
              </label>
            </>
          );
        case 'category':
          return (
            <>
              <input name="name" className="w-full border rounded px-3 py-2" placeholder="Category Name" required />
              <input name="slug" className="w-full border rounded px-3 py-2" placeholder="URL Slug" required />
              <textarea name="description" className="w-full border rounded px-3 py-2" placeholder="Description" rows={3} />
              <input name="parent" className="w-full border rounded px-3 py-2" placeholder="Parent Category ID (optional)" />
              <label className="flex items-center">
                <input name="is_active" type="checkbox" className="mr-2" defaultChecked />
                Active Category
              </label>
            </>
          );
        case 'review':
          return (
            <>
              <input name="product" className="w-full border rounded px-3 py-2" placeholder="Product ID" required />
              <input name="customer_name" className="w-full border rounded px-3 py-2" placeholder="Customer Name" required />
              <input name="customer_email" type="email" className="w-full border rounded px-3 py-2" placeholder="Customer Email" required />
              <select name="rating" className="w-full border rounded px-3 py-2" required>
                <option value="">Select Rating</option>
                <option value="1">1 Star</option>
                <option value="2">2 Stars</option>
                <option value="3">3 Stars</option>
                <option value="4">4 Stars</option>
                <option value="5">5 Stars</option>
              </select>
              <textarea name="review_text" className="w-full border rounded px-3 py-2" placeholder="Review Text" rows={4} required />
              <label className="flex items-center">
                <input name="is_approved" type="checkbox" className="mr-2" />
                Approve Review
              </label>
            </>
          );
        default:
          return null;
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          <h4 className="text-lg font-bold mb-4">{getModalTitle()}</h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            {getModalFields()}
            <div className="flex justify-end gap-2">
              <button 
                type="button" 
                className="px-4 py-2 rounded bg-gray-200" 
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 rounded bg-purple-600 text-white"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow p-8 min-h-[60vh] flex items-center justify-center">
        <div className="text-lg">Loading Website/E-commerce...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-8 min-h-[60vh]">
      <h2 className="text-2xl font-bold mb-4 text-purple-700">Website & E-commerce</h2>
      <div className="mb-6 flex gap-4 border-b">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors duration-150 ${
              activeTab === tab.key 
                ? 'border-purple-600 text-purple-700' 
                : 'border-transparent text-gray-500 hover:text-purple-600'
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'pages' && renderPages()}
      {activeTab === 'categories' && renderCategories()}
      {activeTab === 'reviews' && renderReviews()}
      {activeTab === 'dashboard' && renderDashboard()}

      {renderModal()}
    </div>
  );
};

export default WebsiteEcommerce; 
import { useEffect, useState } from 'react';
import { ShoppingCart } from 'lucide-react';

const ProductList = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch('/api/products/')
      .then(response => response.json())
      .then(data => setProducts(data));
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Products</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {products.map(product => (
          <div key={product.id} className="border p-4 rounded-lg shadow-md">
            <img src={product.image} alt={product.name} className="w-full h-48 object-cover mb-4" />
            <h2 className="text-xl font-semibold">{product.name}</h2>
            <p className="text-gray-600">{product.description}</p>
            <div className="mt-4 flex justify-between items-center">
              <span className="text-lg font-bold">${product.price}</span>
              <button className="bg-blue-500 text-white px-4 py-2 rounded flex items-center">
                <ShoppingCart className="mr-2" />
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductList;
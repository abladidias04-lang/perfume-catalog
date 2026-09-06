import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

// Суретті сапасын жоғалтпай браузерде қысу функциясы
const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1000; // Жоғары сапа үшін 1000px ені
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // 0.8 (80%) сапада WebP форматына қысу
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Суретті қысу сәтсіз аяқталды'));
            }
          },
          'image/webp',
          0.8
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [perfumes, setPerfumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Жаңа парфюм қосу формасы
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    price: '',
    description: '',
    category: 'all',
  });
  const [imageFile, setImageFile] = useState(null);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    checkUser();
    fetchPerfumes();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/admin');
    }
  };

  const fetchPerfumes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('perfumes')
        .select('id, name, brand, price, description, category, image_url')
        .order('id', { ascending: false });

      if (error) throw error;
      setPerfumes(data || []);
    } catch (error) {
      console.error('Деректерді жүктеу қатесі:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      let imageUrl = formData.image_url;

      // Жаңа сурет таңдалған болса, қысып жүктейміз
      if (imageFile) {
        const compressedBlob = await compressImage(imageFile);
        const fileName = `${Date.now()}_perfume.webp`;

        const { error: uploadError } = await supabase.storage
          .from('perfumes')
          .upload(fileName, compressedBlob, {
            contentType: 'image/webp',
            cacheControl: '31536000', // 1 жылдық браузер кэші
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('perfumes')
          .getPublicUrl(fileName);

        imageUrl = publicUrlData.publicUrl;
      }

      const perfumePayload = {
        name: formData.name,
        brand: formData.brand,
        price: parseFloat(formData.price),
        description: formData.description,
        category: formData.category,
        ...(imageUrl && { image_url: imageUrl }),
      };

      if (editId) {
        const { error } = await supabase
          .from('perfumes')
          .update(perfumePayload)
          .eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('perfumes')
          .insert([perfumePayload]);
        if (error) throw error;
      }

      // Форманы тазарту
      setFormData({ name: '', brand: '', price: '', description: '', category: 'all' });
      setImageFile(null);
      setEditId(null);
      fetchPerfumes();
      alert('Сәтті сақталды!');
    } catch (error) {
      alert(`Қате орын алды: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (perfume) => {
    setEditId(perfume.id);
    setFormData({
      name: perfume.name,
      brand: perfume.brand,
      price: perfume.price,
      description: perfume.description,
      category: perfume.category || 'all',
      image_url: perfume.image_url,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Бұл тауарды өшіргіңіз келе ме?')) {
      try {
        const { error } = await supabase.from('perfumes').delete().eq('id', id);
        if (error) throw error;
        setPerfumes(perfumes.filter((p) => p.id !== id));
      } catch (error) {
        alert(error.message);
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Админ Панель</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm font-medium"
          >
            Шығу
          </button>
        </div>

        {/* Форма */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">
            {editId ? 'Парфюмді өңдеу' : 'Жаңа парфюм қосу'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Атауы</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Бренд</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Бағасы (₸)</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Санат</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Барлығы</option>
                  <option value="men">Ерлерге</option>
                  <option value="women">Әйелдерге</option>
                  <option value="unisex">Унисекс</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Сипаттамасы</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Сурет таңдау</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full border border-gray-300 p-2 rounded focus:outline-none text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                * Сурет автоматты түрде сапасы сақталып, жеңілдетіледі.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={uploading}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
              >
                {uploading ? 'Жүктелуде...' : editId ? 'Жаңарту' : 'Қосу'}
              </button>
              {editId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditId(null);
                    setFormData({ name: '', brand: '', price: '', description: '', category: 'all' });
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                >
                  Бас тарту
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Тізім */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Барлық тауарлар</h2>
          {loading ? (
            <p className="text-gray-500 text-sm">Жүктелуде...</p>
          ) : (
            <div className="divide-y divide-gray-200">
              {perfumes.map((item) => (
                <div key={item.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        loading="lazy"
                        className="w-14 h-14 object-cover rounded"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-400">
                        Суретсіз
                      </div>
                    )}
                    <div>
                      <h3 className="font-medium text-gray-800">{item.name}</h3>
                      <p className="text-sm text-gray-500">{item.brand} — {item.price} ₸</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="px-3 py-1 bg-yellow-400 text-yellow-900 rounded text-xs hover:bg-yellow-500"
                    >
                      Өңдеу
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                    >
                      Жою
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

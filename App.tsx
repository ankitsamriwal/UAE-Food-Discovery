import React, { useEffect, useState } from 'react';
import {
  Utensils,
  Plus,
  MapPin,
  Award,
  Search,
  X,
  Image as ImageIcon,
  ChefHat,
  CheckCircle,
  Trash2,
  Tag,
  Star,
  ExternalLink,
  Map as MapIcon
} from 'lucide-react';
import { EatingJoint } from './types';

const AVAILABLE_TAGS = [
  'Breakfast',
  'Buffet',
  'Shisha',
  'Kunafa',
  'Emirati',
  'Karak Tea',
  'Late Night',
  'Outdoor Seating',
  'Seafood',
  'Family Friendly',
  'Budget Friendly',
  'Fine Dining'
];

const INITIAL_JOINTS: EatingJoint[] = [
  {
    id: '1',
    name: 'Al Fanar Restaurant & Cafe',
    emirate: 'Dubai',
    address: 'Dubai Festival City Mall, Canal Walk, Dubai',
    lat: 25.2215,
    lng: 55.3524,
    specialty: 'Traditional Emirati Lamb Machboos & Luqaimat',
    image: 'https://images.unsplash.com/photo-1541518763669-27fef04b14e8?auto=format&fit=crop&q=80&w=800',
    tags: ['Emirati', 'Breakfast', 'Kunafa', 'Family Friendly'],
    rating: 4.8,
    reviewsCount: 142,
    contributor: 'Community Seed',
    createdAt: '2026-01-15'
  },
  {
    id: '2',
    name: 'Al Khayma Heritage Restaurant',
    emirate: 'Dubai',
    address: 'Building 79, Al Fahidi Historical District, Dubai',
    lat: 25.2634,
    lng: 55.2972,
    specialty: 'Charcoal Chicken Kebab & Fresh Regag Bread',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800',
    tags: ['Emirati', 'Outdoor Seating', 'Breakfast', 'Karak Tea'],
    rating: 4.9,
    reviewsCount: 210,
    contributor: 'Community Seed',
    createdAt: '2026-02-01'
  },
  {
    id: '3',
    name: "Mina Za'abeel Seafood Restaurant",
    emirate: 'Abu Dhabi',
    address: 'Free Port, Mina Zayed, Abu Dhabi',
    lat: 24.5222,
    lng: 54.3731,
    specialty: 'Freshly Fried Hamour & Spiced Rice',
    image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&q=80&w=800',
    tags: ['Seafood', 'Buffet', 'Budget Friendly'],
    rating: 4.6,
    reviewsCount: 88,
    contributor: 'AbuDhabiFoodie',
    createdAt: '2026-02-10'
  }
];

const EMIRATES = [
  'All Emirates',
  'Abu Dhabi',
  'Dubai',
  'Sharjah',
  'Ajman',
  'Umm Al Quwain',
  'Ras Al Khaimah',
  'Fujairah'
];

const STORAGE_KEY = 'uae_eating_joints_v3';
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800';

// Approximate city-center coordinates, used as a per-emirate fallback when a
// contributor doesn't provide precise coordinates.
const EMIRATE_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Abu Dhabi': { lat: 24.4539, lng: 54.3773 },
  'Dubai': { lat: 25.2048, lng: 55.2708 },
  'Sharjah': { lat: 25.3463, lng: 55.4209 },
  'Ajman': { lat: 25.4052, lng: 55.5136 },
  'Umm Al Quwain': { lat: 25.5647, lng: 55.5534 },
  'Ras Al Khaimah': { lat: 25.7895, lng: 55.9432 },
  'Fujairah': { lat: 25.1288, lng: 56.3265 }
};

interface JointFormState {
  name: string;
  emirate: string;
  address: string;
  lat: string;
  lng: string;
  specialty: string;
  image: string;
  rating: number;
  tags: string[];
  customTagInput: string;
  contributor: string;
}

const EMPTY_FORM: JointFormState = {
  name: '',
  emirate: 'Dubai',
  address: '',
  lat: '',
  lng: '',
  specialty: '',
  image: '',
  rating: 5,
  tags: [],
  customTagInput: '',
  contributor: ''
};

const App: React.FC = () => {
  const [joints, setJoints] = useState<EatingJoint[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as EatingJoint[]) : INITIAL_JOINTS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmirate, setSelectedEmirate] = useState('All Emirates');
  const [selectedTagFilter, setSelectedTagFilter] = useState('All');
  const [minRatingFilter, setMinRatingFilter] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeMapJoint, setActiveMapJoint] = useState<EatingJoint | null>(null);
  const [toastMessage, setToastMessage] = useState('');

  const [formData, setFormData] = useState<JointFormState>(EMPTY_FORM);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(joints));
  }, [joints]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTagToggle = (tag: string) => {
    setFormData((prev) => {
      const exists = prev.tags.includes(tag);
      return {
        ...prev,
        tags: exists ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag]
      };
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const fallbackCoords = EMIRATE_COORDINATES[formData.emirate] || EMIRATE_COORDINATES['Dubai'];

    const newJoint: EatingJoint = {
      id: Date.now().toString(),
      name: formData.name.trim(),
      emirate: formData.emirate,
      address: formData.address.trim(),
      lat: parseFloat(formData.lat) || fallbackCoords.lat,
      lng: parseFloat(formData.lng) || fallbackCoords.lng,
      specialty: formData.specialty.trim(),
      image: formData.image.trim() || DEFAULT_IMAGE,
      rating: Number(formData.rating) || 5,
      reviewsCount: 1,
      tags: formData.tags.length > 0 ? formData.tags : ['Popular Spot'],
      contributor: formData.contributor.trim() || 'Anonymous',
      createdAt: new Date().toISOString().split('T')[0]
    };

    setJoints((prev) => [newJoint, ...prev]);
    setIsModalOpen(false);
    setFormData(EMPTY_FORM);

    showToast('New eating joint & location pin added!');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to remove this eatery?')) {
      setJoints((prev) => prev.filter((j) => j.id !== id));
      showToast('Eatery removed.');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5 text-amber-400">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-3.5 h-3.5 ${
            star <= Math.round(rating)
              ? 'fill-amber-400 text-amber-400'
              : 'fill-slate-200 text-slate-300'
          }`}
        />
      ))}
    </div>
  );

  const filteredJoints = joints.filter((joint) => {
    const matchesEmirate = selectedEmirate === 'All Emirates' || joint.emirate === selectedEmirate;
    const matchesTag = selectedTagFilter === 'All' || (joint.tags && joint.tags.includes(selectedTagFilter));
    const matchesRating = joint.rating >= minRatingFilter;
    const matchesSearch =
      joint.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      joint.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      joint.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (joint.tags && joint.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesEmirate && matchesTag && matchesRating && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-12">
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg border border-emerald-500 animate-bounce">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      <header className="bg-slate-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <a href="/" className="flex items-center space-x-3">
            <div className="bg-amber-500 p-2.5 rounded-xl text-slate-900 shadow">
              <Utensils className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-amber-400">UAE Food Atlas</h1>
              <p className="text-xs text-slate-400">Directory with ratings, tags & map pins</p>
            </div>
          </a>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-4 py-2.5 rounded-lg transition shadow-md hover:shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Add Eating Joint</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-4 flex flex-col lg:flex-row gap-4 justify-between items-center">
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, dish, tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 shrink-0">
            <span>Min Rating:</span>
            {[0, 4, 4.5].map((val) => (
              <button
                key={val}
                onClick={() => setMinRatingFilter(val)}
                className={`px-2.5 py-1 rounded-md transition ${
                  minRatingFilter === val
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {val === 0 ? 'Any' : `${val}+ ★`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
            {EMIRATES.map((emirate) => (
              <button
                key={emirate}
                onClick={() => setSelectedEmirate(emirate)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition ${
                  selectedEmirate === emirate
                    ? 'bg-slate-900 text-amber-400 shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {emirate}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-slate-200 mb-8 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0 mr-2">
            <Tag className="w-3.5 h-3.5" /> Tags:
          </span>
          <button
            onClick={() => setSelectedTagFilter('All')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition shrink-0 ${
              selectedTagFilter === 'All'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Tags
          </button>
          {AVAILABLE_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTagFilter(tag === selectedTagFilter ? 'All' : tag)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition shrink-0 ${
                selectedTagFilter === tag
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>

        {filteredJoints.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
            <ChefHat className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-lg font-semibold text-slate-700">No matching joints found</h3>
            <p className="text-slate-500 text-sm mt-1">Try resetting your filters or search queries.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJoints.map((joint) => (
              <div
                key={joint.id}
                className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col group"
              >
                <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                  <img
                    src={joint.image}
                    alt={joint.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
                    }}
                  />
                  <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-amber-300 text-xs font-semibold px-2.5 py-1 rounded-md border border-slate-700">
                    {joint.emirate}
                  </span>
                  <button
                    onClick={() => handleDelete(joint.id)}
                    className="absolute top-3 right-3 p-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h3 className="text-lg font-bold text-slate-900 leading-tight">{joint.name}</h3>
                      <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded border border-amber-200 shrink-0">
                        {renderStars(joint.rating)}
                        <span className="text-xs font-bold text-slate-800 ml-1">{joint.rating}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-slate-600 text-xs mb-3">
                      <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>{joint.address}</span>
                    </div>

                    <div className="bg-amber-50/60 border border-amber-200/80 rounded-lg p-3 mb-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-1">
                        <Award className="w-4 h-4 text-amber-600" />
                        <span>Must-Try Specialty:</span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium leading-relaxed">{joint.specialty}</p>
                    </div>

                    {joint.tags && joint.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {joint.tags.map((tag) => (
                          <span
                            key={tag}
                            onClick={() => setSelectedTagFilter(tag)}
                            className="bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800 text-[11px] font-medium px-2 py-0.5 rounded cursor-pointer transition"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => setActiveMapJoint(joint)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200 transition"
                    >
                      <MapIcon className="w-3.5 h-3.5" />
                      <span>View Location Map</span>
                    </button>

                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(joint.name + ' ' + joint.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-slate-600 p-1"
                      title="Open in Google Maps"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {activeMapJoint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setActiveMapJoint(null)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-6 h-6 text-amber-500" />
              <h2 className="text-xl font-bold text-slate-900">{activeMapJoint.name}</h2>
            </div>
            <p className="text-xs text-slate-500 mb-4">{activeMapJoint.address}</p>

            <div className="h-72 w-full rounded-xl overflow-hidden border border-slate-200 mb-4 bg-slate-100 relative">
              <iframe
                title="Eatery Map Location"
                width="100%"
                height="100%"
                frameBorder={0}
                scrolling="no"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${(activeMapJoint.lng || 55.27) - 0.02}%2C${(activeMapJoint.lat || 25.20) - 0.02}%2C${(activeMapJoint.lng || 55.27) + 0.02}%2C${(activeMapJoint.lat || 25.20) + 0.02}&layer=mapnik&marker=${activeMapJoint.lat || 25.20}%2C${activeMapJoint.lng || 55.27}`}
              ></iframe>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>Coordinates: {activeMapJoint.lat || '25.2048'}, {activeMapJoint.lng || '55.2708'}</span>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeMapJoint.name + ' ' + activeMapJoint.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-900 text-amber-400 font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 hover:bg-slate-800"
              >
                <span>Navigate via Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative my-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <ChefHat className="w-6 h-6 text-amber-500" />
              <h2 className="text-xl font-bold text-slate-900">Add an Eating Joint</h2>
            </div>
            <p className="text-xs text-slate-500 mb-5">Share location, rating, and specialties with the UAE community.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Restaurant Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Firas Sweets"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Emirate *</label>
                  <select
                    name="emirate"
                    value={formData.emirate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
                  >
                    {EMIRATES.filter((e) => e !== 'All Emirates').map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Rating *</label>
                  <div className="flex items-center gap-1 py-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        onClick={() => setFormData((prev) => ({ ...prev, rating: star }))}
                        className={`w-6 h-6 cursor-pointer ${
                          star <= formData.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-slate-100 text-slate-300'
                        }`}
                      />
                    ))}
                    <span className="text-xs font-bold text-slate-700 ml-2">{formData.rating} Stars</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Address / Location *</label>
                <input
                  type="text"
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="e.g., 2nd December St, Al Satwa, Dubai"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Latitude (Optional)</label>
                  <input
                    type="number"
                    step="any"
                    name="lat"
                    value={formData.lat}
                    onChange={handleChange}
                    placeholder="e.g., 25.2048"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Longitude (Optional)</label>
                  <input
                    type="number"
                    step="any"
                    name="lng"
                    value={formData.lng}
                    onChange={handleChange}
                    placeholder="e.g., 55.2708"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Specialty / Must-Order Dishes *</label>
                <textarea
                  name="specialty"
                  required
                  rows={2}
                  value={formData.specialty}
                  onChange={handleChange}
                  placeholder="e.g., Warm Nabulsi Cheese Kunafa & Turkish Coffee"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-amber-500" /> Select Tags
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2 max-h-28 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-200">
                  {AVAILABLE_TAGS.map((tag) => {
                    const isSelected = formData.tags.includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => handleTagToggle(tag)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}{tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contributor Handle</label>
                <input
                  type="text"
                  name="contributor"
                  value={formData.contributor}
                  onChange={handleChange}
                  placeholder="e.g., FoodieDXB"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow"
                >
                  Publish Eating Joint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

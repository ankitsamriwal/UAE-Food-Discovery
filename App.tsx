import React, { useEffect, useState } from 'react';
import {
  Utensils,
  Plus,
  MapPin,
  Award,
  Search,
  X,
  ChefHat,
  CheckCircle,
  Trash2,
  Star,
  ExternalLink,
  Map as MapIcon,
  Moon,
  DollarSign,
  HeartHandshake,
  Compass,
  Upload,
  Loader2,
  Sparkles
} from 'lucide-react';
import { EatingJoint } from './types';
import { fetchJoints, createJoint, deleteJoint } from './lib/joints';
import { uploadImageToCloudinary } from './lib/cloudinary';

// Preset Metadata Tags
const AVAILABLE_TAGS = [
  'Karak Tea',
  'Under AED 20',
  'Late Night',
  'Kunafa',
  'Regag Bread',
  'Emirati Heritage',
  'Cafeteria Vibe',
  'Shisha Courtyard',
  'Seafood Market',
  'Hidden Gem',
  'Budget Feast'
];

// Curated Local Playlists
const PLAYLISTS = [
  { id: 'all', title: 'All Local Gems' },
  { id: 'under_20', title: '💰 Old Dubai Bites Under 20 AED' },
  { id: 'late_night', title: '🌙 Late Night Karak & Shawarma Run' },
  { id: 'heritage', title: '🇦🇪 Authentic Emirati Heritage' }
];

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

// Local fallback shown before Supabase is configured (or unreachable), and
// otherwise mirrored to localStorage purely as an offline backup.
const INITIAL_JOINTS: EatingJoint[] = [
  {
    id: '1',
    name: 'Al Muraqqabat Karak & Cafeteria',
    emirate: 'Dubai',
    address: 'Al Muraqqabat Street, Deira, Dubai',
    lat: 25.2671,
    lng: 55.3235,
    specialty: 'Cardamom Karak Tea & Fresh Oman Chips Regag',
    story: 'The uncle here has been pulling tea since 1998. Order off-menu: ask for extra cheese and hot sauce in your regag bread.',
    image: 'https://images.unsplash.com/photo-1541518763669-27fef04b14e8?auto=format&fit=crop&q=80&w=800',
    tags: ['Karak Tea', 'Under AED 20', 'Late Night', 'Cafeteria Vibe', 'Regag Bread'],
    isLateNight: true,
    isUnder20: true,
    rating: 4.9,
    contributor: 'DeiraLocal',
    createdAt: '2026-01-15'
  },
  {
    id: '2',
    name: 'Al Khayma Heritage Restaurant',
    emirate: 'Dubai',
    address: 'Building 79, Al Fahidi Historical District, Dubai',
    lat: 25.2634,
    lng: 55.2972,
    specialty: 'Charcoal Lamb Machboos & Hot Luqaimat',
    story: 'Set inside a windtower courtyard. Best place to take visiting friends for real Emirati hospitality.',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800',
    tags: ['Emirati Heritage', 'Kunafa', 'Shisha Courtyard', 'Hidden Gem'],
    isLateNight: false,
    isUnder20: false,
    rating: 4.8,
    contributor: 'Community Seed',
    createdAt: '2026-02-01'
  },
  {
    id: '3',
    name: 'Bu Qtair Seafood Shack',
    emirate: 'Dubai',
    address: 'Old 32B Street, Fishing Harbour 2, Umm Suqeim, Dubai',
    lat: 25.1412,
    lng: 55.1915,
    specialty: 'Deep-Fried Fresh Hamour in Secret Spices & Paratha',
    story: 'No menu. You pick raw fish by weight at the port counter, they fry it crispy with Indian spices.',
    image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&q=80&w=800',
    tags: ['Seafood Market', 'Budget Feast', 'Hidden Gem'],
    isLateNight: false,
    isUnder20: false,
    rating: 4.7,
    contributor: 'JumeirahFoodie',
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

const STORAGE_KEY = 'uae_eating_joints_v4';
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800';

interface JointFormState {
  name: string;
  emirate: string;
  address: string;
  lat: string;
  lng: string;
  specialty: string;
  story: string;
  rating: number;
  isLateNight: boolean;
  isUnder20: boolean;
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
  story: '',
  rating: 5,
  isLateNight: false,
  isUnder20: false,
  tags: [],
  customTagInput: '',
  contributor: ''
};

const App: React.FC = () => {
  const [joints, setJoints] = useState<EatingJoint[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmirate, setSelectedEmirate] = useState('All Emirates');
  const [activePlaylist, setActivePlaylist] = useState('all');
  const [lateNightOnly, setLateNightOnly] = useState(false);
  const [under20Only, setUnder20Only] = useState(false);

  // Modals & UI States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeMapJoint, setActiveMapJoint] = useState<EatingJoint | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const [formData, setFormData] = useState<JointFormState>(EMPTY_FORM);

  // Fetch joints from Supabase; fall back to a local backup (or the seed
  // set) if Supabase isn't configured yet or is unreachable.
  useEffect(() => {
    fetchEatingJoints();
  }, []);

  const fetchEatingJoints = async () => {
    setLoading(true);
    try {
      const data = await fetchJoints();
      if (data.length > 0) {
        setJoints(data);
        setLoading(false);
        return;
      }
    } catch {
      console.warn('Supabase not configured or unreachable, using local seed state.');
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    setJoints(saved ? (JSON.parse(saved) as EatingJoint[]) : INITIAL_JOINTS);
    setLoading(false);
  };

  // Mirror to localStorage as an offline backup.
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(joints));
    }
  }, [joints, loading]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploading(true);

    const fallbackCoords = EMIRATE_COORDINATES[formData.emirate] || EMIRATE_COORDINATES['Dubai'];

    try {
      const imageUrl = selectedFile ? await uploadImageToCloudinary(selectedFile) : DEFAULT_IMAGE;

      const newJoint = await createJoint({
        name: formData.name.trim(),
        emirate: formData.emirate,
        address: formData.address.trim(),
        lat: parseFloat(formData.lat) || fallbackCoords.lat,
        lng: parseFloat(formData.lng) || fallbackCoords.lng,
        specialty: formData.specialty.trim(),
        story: formData.story.trim() || 'Unsponsored local community recommendation.',
        image: imageUrl,
        rating: Number(formData.rating) || 5,
        isLateNight: formData.isLateNight,
        isUnder20: formData.isUnder20,
        tags: formData.tags.length > 0 ? formData.tags : ['Hidden Gem'],
        contributor: formData.contributor.trim() || 'Anonymous Explorer'
      });

      setJoints((prev) => [newJoint, ...prev]);
      resetForm();
      showToast('Spot added to the un-sponsored community atlas!');
    } catch (err) {
      console.error('Submission error:', err);

      // Supabase unreachable/unconfigured: still add it to the local copy
      // so the contributor doesn't lose what they typed.
      const localJoint: EatingJoint = {
        id: crypto.randomUUID(),
        name: formData.name.trim(),
        emirate: formData.emirate,
        address: formData.address.trim(),
        lat: parseFloat(formData.lat) || fallbackCoords.lat,
        lng: parseFloat(formData.lng) || fallbackCoords.lng,
        specialty: formData.specialty.trim(),
        story: formData.story.trim() || 'Unsponsored local community recommendation.',
        image: previewUrl || DEFAULT_IMAGE,
        rating: Number(formData.rating) || 5,
        isLateNight: formData.isLateNight,
        isUnder20: formData.isUnder20,
        tags: formData.tags.length > 0 ? formData.tags : ['Hidden Gem'],
        contributor: formData.contributor.trim() || 'Anonymous Explorer',
        createdAt: new Date().toISOString().split('T')[0]
      };

      setJoints((prev) => [localJoint, ...prev]);
      resetForm();
      showToast('Added locally! (Sync failed)');
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setIsModalOpen(false);
    setSelectedFile(null);
    setPreviewUrl('');
    setFormData(EMPTY_FORM);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this eatery from the atlas?')) return;

    try {
      await deleteJoint(id);
    } catch {
      console.warn('Supabase delete failed; removing locally only.');
    }
    setJoints((prev) => prev.filter((j) => j.id !== id));
    showToast('Eatery removed.');
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
    const matchesLateNight = !lateNightOnly || joint.isLateNight;
    const matchesUnder20 = !under20Only || joint.isUnder20;

    let matchesPlaylist = true;
    if (activePlaylist === 'under_20') matchesPlaylist = joint.isUnder20;
    if (activePlaylist === 'late_night') matchesPlaylist = joint.isLateNight;
    if (activePlaylist === 'heritage') matchesPlaylist = joint.tags?.includes('Emirati Heritage') ?? false;

    const matchesSearch =
      joint.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      joint.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      joint.story?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      joint.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (joint.tags && joint.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

    return matchesEmirate && matchesLateNight && matchesUnder20 && matchesPlaylist && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-16">
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-emerald-500 text-slate-950 px-4 py-3 rounded-xl shadow-2xl font-bold animate-bounce">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm">{toastMessage}</span>
        </div>
      )}

      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-amber-500 p-2.5 rounded-xl text-slate-950 shadow-lg shadow-amber-500/20">
              <Utensils className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-wider text-amber-400 uppercase">UAE Food Atlas</h1>
                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <HeartHandshake className="w-3 h-3" /> 100% Unsponsored
                </span>
              </div>
              <p className="text-xs text-slate-400">Authentic cafeterias, street bites & hidden gems Big Tech ignores</p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-4 py-2.5 rounded-xl transition shadow-lg shadow-amber-500/20 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>Add Hidden Spot</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <Compass className="w-4 h-4 text-amber-400" /> Community Trail Playlists
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PLAYLISTS.map((pl) => (
              <button
                key={pl.id}
                onClick={() => setActivePlaylist(pl.id)}
                className={`p-3 rounded-xl border text-left text-xs font-bold transition flex items-center justify-between ${
                  activePlaylist === pl.id
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:bg-slate-800'
                }`}
              >
                <span>{pl.title}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60 mb-6 flex flex-col lg:flex-row gap-4 justify-between items-center shadow-xl">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by dish (e.g. Karak, Regag, Samosa)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-100 placeholder-slate-500"
            />
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
            <button
              onClick={() => setLateNightOnly(!lateNightOnly)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border ${
                lateNightOnly
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Late Night Radar</span>
            </button>

            <button
              onClick={() => setUnder20Only(!under20Only)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border ${
                under20Only
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/30'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Under AED 20</span>
            </button>

            <select
              value={selectedEmirate}
              onChange={(e) => setSelectedEmirate(e.target.value)}
              className="bg-slate-900 text-amber-400 border border-slate-700 text-xs font-bold px-3 py-2 rounded-xl focus:outline-none"
            >
              {EMIRATES.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 mx-auto text-amber-400 animate-spin mb-2" />
            <p className="text-xs text-slate-400 font-mono">Brewing the Karak & loading spots...</p>
          </div>
        ) : filteredJoints.length === 0 ? (
          <div className="text-center py-20 bg-slate-800/40 rounded-2xl border border-slate-800">
            <ChefHat className="w-12 h-12 mx-auto text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-slate-300">No hidden gems match this radar filter</h3>
            <p className="text-slate-500 text-xs mt-1">Be the first local to submit an unsponsored spot!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJoints.map((joint) => (
              <div
                key={joint.id}
                className="bg-slate-800/90 rounded-2xl overflow-hidden border border-slate-700/80 shadow-xl flex flex-col group hover:border-amber-500/50 transition duration-300"
              >
                <div className="relative h-48 w-full bg-slate-900 overflow-hidden">
                  <img
                    src={joint.image}
                    alt={joint.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
                    }}
                  />
                  <span className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md text-amber-400 text-xs font-extrabold px-2.5 py-1 rounded-lg border border-slate-700">
                    {joint.emirate}
                  </span>

                  {joint.isUnder20 && (
                    <span className="absolute top-3 left-24 bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider">
                      Under 20 AED
                    </span>
                  )}

                  <button
                    onClick={() => handleDelete(joint.id)}
                    className="absolute top-3 right-3 p-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h3 className="text-lg font-black text-slate-100 leading-tight">{joint.name}</h3>
                      <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-700 shrink-0">
                        {renderStars(joint.rating)}
                        <span className="text-xs font-bold text-amber-400 ml-1">{joint.rating}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-1.5 text-slate-400 text-xs mb-3">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{joint.address}</span>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-1">
                        <Award className="w-3.5 h-3.5" />
                        <span>Must-Order Dish:</span>
                      </div>
                      <p className="text-xs text-slate-200 font-semibold">{joint.specialty}</p>
                    </div>

                    {joint.story && (
                      <p className="text-xs text-slate-400 italic mb-4 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                        "{joint.story}"
                      </p>
                    )}

                    {joint.tags && joint.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {joint.tags.map((tag) => (
                          <span
                            key={tag}
                            className="bg-slate-900 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-700"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
                    <button
                      onClick={() => setActiveMapJoint(joint)}
                      className="flex items-center gap-1.5 text-amber-400 font-bold hover:underline"
                    >
                      <MapIcon className="w-3.5 h-3.5" />
                      <span>View Map Pin</span>
                    </button>

                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(joint.name + ' ' + joint.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-slate-200"
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-700 shadow-2xl relative my-8 text-slate-100">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-100 hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl font-black text-amber-400">Add an Un-sponsored Spot</h2>
            </div>
            <p className="text-xs text-slate-400 mb-5">Share an authentic local eating joint with fellow foodies across the UAE.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Eatery / Cafeteria Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Al Muraqqabat Karak"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Emirate *</label>
                  <select
                    name="emirate"
                    value={formData.emirate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none"
                  >
                    {EMIRATES.filter((e) => e !== 'All Emirates').map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Rating</label>
                  <div className="flex items-center gap-1 py-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        onClick={() => setFormData((prev) => ({ ...prev, rating: star }))}
                        className={`w-5 h-5 cursor-pointer ${
                          star <= formData.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Address / Street Landmark *</label>
                <input
                  type="text"
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="e.g. Opposite Al Muraqqabat Park, Deira"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Must-Order Dish *</label>
                <input
                  type="text"
                  name="specialty"
                  required
                  value={formData.specialty}
                  onChange={handleChange}
                  placeholder="e.g. Cardamom Karak & Oman Chips Porotta Roll"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">The "Why It's Special" Story</label>
                <textarea
                  name="story"
                  rows={2}
                  value={formData.story}
                  onChange={handleChange}
                  placeholder="e.g. Uncle has been making tea here since 1998. Always ask for extra cheese!"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex gap-6 py-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-300">
                  <input
                    type="checkbox"
                    name="isLateNight"
                    checked={formData.isLateNight}
                    onChange={handleChange}
                    className="rounded border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <span>Open Past 2:00 AM</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-300">
                  <input
                    type="checkbox"
                    name="isUnder20"
                    checked={formData.isUnder20}
                    onChange={handleChange}
                    className="rounded border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <span>Full Meal Under 20 AED</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Upload Photo from Device</label>
                <div className="border-2 border-dashed border-slate-700 hover:border-amber-500 rounded-2xl p-4 text-center relative bg-slate-950">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="h-32 w-full object-cover rounded-xl" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-slate-400">
                      <Upload className="w-6 h-6 text-amber-400 mb-1" />
                      <span className="text-xs font-bold text-slate-300">Tap to upload photo from camera roll</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Tags</label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_TAGS.map((tag) => {
                    const isSelected = formData.tags.includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            tags: isSelected ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag]
                          }))
                        }
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-slate-950 text-slate-400 border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}{tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Contributor Handle</label>
                <input
                  type="text"
                  name="contributor"
                  value={formData.contributor}
                  onChange={handleChange}
                  placeholder="e.g., FoodieDXB"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2"
                >
                  {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isUploading ? 'Uploading...' : 'Publish to Atlas'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeMapJoint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 rounded-3xl max-w-xl w-full p-6 border border-slate-700 shadow-2xl relative">
            <button
              onClick={() => setActiveMapJoint(null)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-amber-400 mb-1">{activeMapJoint.name}</h3>
            <p className="text-xs text-slate-400 mb-4">{activeMapJoint.address}</p>

            <div className="h-64 w-full rounded-2xl overflow-hidden border border-slate-700 mb-4">
              <iframe
                title="Location Map"
                width="100%"
                height="100%"
                frameBorder={0}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${activeMapJoint.lng - 0.01}%2C${activeMapJoint.lat - 0.01}%2C${activeMapJoint.lng + 0.01}%2C${activeMapJoint.lat + 0.01}&layer=mapnik&marker=${activeMapJoint.lat}%2C${activeMapJoint.lng}`}
              ></iframe>
            </div>

            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeMapJoint.name + ' ' + activeMapJoint.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2"
            >
              <span>Navigate in Google Maps</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

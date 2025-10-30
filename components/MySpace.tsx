import React, { useState, useEffect, useRef } from 'react';
import { MySpaceEntry, EntryCategory, EntryLocation, MySpaceStats } from '../types';
import * as mySpaceService from '../services/mySpaceService';
import { analyzeEntryImage } from '../services/geminiService';
import { CameraIcon } from './icons/CameraIcon';
import { PlusIcon } from './icons/PlusIcon';
import { MapPinIcon } from './icons/MapPinIcon';
import { HeartIcon } from './icons/HeartIcon';
import { LoadingSpinner } from './icons/LoadingSpinner';

type View = 'categories' | 'categoryList' | 'entryDetail' | 'addEntry' | 'search' | 'stats' | 'map';

const MySpace: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>('categories');
    const [selectedCategory, setSelectedCategory] = useState<EntryCategory | null>(null);
    const [selectedEntry, setSelectedEntry] = useState<MySpaceEntry | null>(null);
    const [entries, setEntries] = useState<MySpaceEntry[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState<MySpaceStats | null>(null);

    // Add entry state
    const [showAddModal, setShowAddModal] = useState(false);
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const [userPrompt, setUserPrompt] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const [editableTitle, setEditableTitle] = useState('');
    const [editableDescription, setEditableDescription] = useState('');
    const [editableCategory, setEditableCategory] = useState<EntryCategory>('memories');
    const [editableLocation, setEditableLocation] = useState<EntryLocation | null>(null);
    const [editableRating, setEditableRating] = useState<number>(0);
    const [editableNotes, setEditableNotes] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        refreshData();
    }, []);

    const refreshData = () => {
        setEntries(mySpaceService.getAllEntries());
        setStats(mySpaceService.getStats());
    };

    // ========================================
    // IMAGE COMPRESSION
    // ========================================

    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    const maxSize = 1200;
                    if (width > height && width > maxSize) {
                        height = (height * maxSize) / width;
                        width = maxSize;
                    } else if (height > maxSize) {
                        width = (width * maxSize) / height;
                        height = maxSize;
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error('Failed to get canvas context'));
                        return;
                    }

                    ctx.drawImage(img, 0, 0, width, height);
                    const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    resolve(compressedDataUrl);
                };
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = e.target?.result as string;
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    };

    // ========================================
    // ADD ENTRY HANDLERS
    // ========================================

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        try {
            const compressed: string[] = [];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (file.type.startsWith('image/')) {
                    const compressedImage = await compressImage(file);
                    compressed.push(compressedImage);
                    console.log('✅ Image compressed:', file.size, 'bytes →', compressedImage.length, 'chars');
                }
            }
            setUploadedImages([...uploadedImages, ...compressed]);
        } catch (error) {
            console.error('❌ Error compressing images:', error);
            alert('حدث خطأ في معالجة الصور');
        }
    };

    const handleAnalyzeImages = async () => {
        if (uploadedImages.length === 0) {
            alert('الرجاء رفع صورة أولاً');
            return;
        }

        setIsAnalyzing(true);
        console.log('🔍 Analyzing entry...');

        try {
            const base64Data = uploadedImages[0].split(',')[1];
            const result = await analyzeEntryImage(base64Data, 'image/jpeg', userPrompt || undefined);

            console.log('✅ Analysis complete:', result);
            setAnalysisResult(result);
            setEditableTitle(result.title);
            setEditableDescription(result.description);
            setEditableCategory(result.suggestedCategory);
            setEditableLocation(result.location || null);
        } catch (error) {
            console.error('❌ Analysis error:', error);
            alert('حدث خطأ في التحليل. حاول مرة أخرى.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSaveEntry = () => {
        if (!editableTitle.trim()) {
            alert('الرجاء إدخال عنوان');
            return;
        }

        const newEntry = mySpaceService.createEntry(
            editableCategory,
            editableTitle,
            editableDescription,
            uploadedImages,
            editableLocation || undefined,
            editableRating || undefined,
            editableNotes || undefined,
            analysisResult ? {
                detectedType: analysisResult.detectedType,
                extractedInfo: analysisResult.description,
                suggestedCategory: analysisResult.suggestedCategory,
                confidence: analysisResult.confidence
            } : undefined,
            analysisResult?.tags
        );

        console.log('✅ Entry saved:', newEntry);

        // Reset form
        setShowAddModal(false);
        setUploadedImages([]);
        setUserPrompt('');
        setAnalysisResult(null);
        setEditableTitle('');
        setEditableDescription('');
        setEditableCategory('memories');
        setEditableLocation(null);
        setEditableRating(0);
        setEditableNotes('');

        refreshData();
        alert('تم الحفظ بنجاح! ✅');
    };

    const handleDeleteEntry = (entryId: string) => {
        if (window.confirm('هل تريد حذف هذا الإدخال؟')) {
            mySpaceService.deleteEntry(entryId);
            refreshData();
            setCurrentView('categories');
            setSelectedEntry(null);
        }
    };

    const handleToggleFavorite = (entryId: string) => {
        mySpaceService.toggleFavorite(entryId);
        refreshData();
        if (selectedEntry) {
            setSelectedEntry(mySpaceService.getEntryById(entryId));
        }
    };

    const handleViewCategory = (category: EntryCategory) => {
        setSelectedCategory(category);
        setCurrentView('categoryList');
    };

    const handleViewEntry = (entry: MySpaceEntry) => {
        setSelectedEntry(entry);
        setCurrentView('entryDetail');
    };

    // ========================================
    // RENDER: CATEGORIES VIEW (Main)
    // ========================================

    const renderCategoriesView = () => {
        const categories: EntryCategory[] = ['accommodation', 'restaurants', 'landmarks', 'memories', 'notes', 'important'];

        return (
            <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900" dir="rtl">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-6 flex-shrink-0">
                    <h1 className="text-3xl font-bold mb-2">📱 مساحتي الشخصية</h1>
                    <p className="text-emerald-100">دفتر رحلاتي وذكرياتي</p>
                </div>

                {/* Stats Summary */}
                {stats && (
                    <div className="bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <div className="text-2xl font-bold text-emerald-600">{stats.totalEntries}</div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">إجمالي</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-blue-600">{stats.countriesVisited.length}</div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">دولة</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-red-600">{stats.favoriteCount}</div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">مفضل</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Categories */}
                <div className="flex-grow overflow-y-auto p-4 space-y-3">
                    {categories.map(category => {
                        const count = stats?.entriesByCategory[category] || 0;
                        const icon = mySpaceService.getCategoryIcon(category);
                        const name = mySpaceService.getCategoryName(category);

                        return (
                            <button
                                key={category}
                                onClick={() => handleViewCategory(category)}
                                className="w-full bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">{icon}</span>
                                    <div className="text-right">
                                        <h3 className="font-bold text-gray-900 dark:text-gray-100">{name}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{count} إدخال</p>
                                    </div>
                                </div>
                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        );
                    })}
                </div>

                {/* Floating Add Button */}
                <button
                    onClick={() => setShowAddModal(true)}
                    className="fixed bottom-6 left-6 w-16 h-16 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 flex items-center justify-center transition hover:scale-110"
                    title="إضافة جديد"
                >
                    <PlusIcon className="w-8 h-8" />
                </button>
            </div>
        );
    };

    // ========================================
    // RENDER: CATEGORY LIST VIEW
    // ========================================

    const renderCategoryListView = () => {
        if (!selectedCategory) return null;

        const categoryEntries = mySpaceService.getEntriesByCategory(selectedCategory);
        const icon = mySpaceService.getCategoryIcon(selectedCategory);
        const name = mySpaceService.getCategoryName(selectedCategory);

        return (
            <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900" dir="rtl">
                {/* Header */}
                <div className="bg-emerald-600 text-white p-4 flex items-center gap-3 flex-shrink-0">
                    <button onClick={() => setCurrentView('categories')} className="p-2 hover:bg-emerald-700 rounded-full">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19l7-7-7-7" />
                        </svg>
                    </button>
                    <span className="text-3xl">{icon}</span>
                    <div>
                        <h2 className="text-xl font-bold">{name}</h2>
                        <p className="text-sm text-emerald-100">{categoryEntries.length} إدخال</p>
                    </div>
                </div>

                {/* Entries List */}
                <div className="flex-grow overflow-y-auto p-4 space-y-3">
                    {categoryEntries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                            <span className="text-6xl mb-4">{icon}</span>
                            <p className="text-lg font-semibold">لا توجد إدخالات</p>
                            <p className="text-sm mt-2">ابدأ بإضافة ذكرياتك!</p>
                        </div>
                    ) : (
                        categoryEntries.map(entry => (
                            <div
                                key={entry.id}
                                onClick={() => handleViewEntry(entry)}
                                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer hover:border-emerald-500 transition"
                            >
                                {entry.images.length > 0 && (
                                    <img
                                        src={entry.images[0]}
                                        alt={entry.title}
                                        className="w-full h-48 object-cover"
                                    />
                                )}
                                <div className="p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-bold text-gray-900 dark:text-gray-100 flex-grow">{entry.title}</h3>
                                        {entry.isFavorite && <HeartIcon className="w-5 h-5 text-red-500" />}
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">{entry.description}</p>
                                    {entry.location && (
                                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                                            <MapPinIcon className="w-4 h-4" />
                                            <span>{entry.location.name}</span>
                                        </div>
                                    )}
                                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                        {new Date(entry.date).toLocaleDateString('ar-SA')}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Add Button */}
                <button
                    onClick={() => {
                        setEditableCategory(selectedCategory);
                        setShowAddModal(true);
                    }}
                    className="fixed bottom-6 left-6 w-16 h-16 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 flex items-center justify-center transition hover:scale-110"
                >
                    <PlusIcon className="w-8 h-8" />
                </button>
            </div>
        );
    };

    // ========================================
    // RENDER: ENTRY DETAIL VIEW
    // ========================================

    const renderEntryDetailView = () => {
        if (!selectedEntry) return null;

        return (
            <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900" dir="rtl">
                {/* Header */}
                <div className="bg-emerald-600 text-white p-4 flex items-center gap-3 flex-shrink-0">
                    <button onClick={() => setCurrentView('categoryList')} className="p-2 hover:bg-emerald-700 rounded-full">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19l7-7-7-7" />
                        </svg>
                    </button>
                    <h2 className="text-xl font-bold flex-grow">{selectedEntry.title}</h2>
                    <button
                        onClick={() => handleToggleFavorite(selectedEntry.id)}
                        className="p-2 hover:bg-emerald-700 rounded-full"
                    >
                        <HeartIcon className={`w-6 h-6 ${selectedEntry.isFavorite ? 'text-red-300' : 'text-white/50'}`} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-grow overflow-y-auto">
                    {/* Images */}
                    {selectedEntry.images.length > 0 && (
                        <div className="grid grid-cols-2 gap-1">
                            {selectedEntry.images.map((img, idx) => (
                                <img key={idx} src={img} alt={`${selectedEntry.title} ${idx + 1}`} className="w-full h-48 object-cover" />
                            ))}
                        </div>
                    )}

                    <div className="p-4 space-y-4">
                        {/* Description */}
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">الوصف</h3>
                            <p className="text-gray-700 dark:text-gray-300">{selectedEntry.description}</p>
                        </div>

                        {/* Location */}
                        {selectedEntry.location && (
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                                    <MapPinIcon className="w-5 h-5 text-emerald-600" />
                                    الموقع
                                </h3>
                                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedEntry.location.name}</p>
                                    {selectedEntry.location.address && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{selectedEntry.location.address}</p>
                                    )}
                                    {selectedEntry.location.city && selectedEntry.location.country && (
                                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                                            {selectedEntry.location.city}, {selectedEntry.location.country}
                                        </p>
                                    )}
                                    {selectedEntry.location.latitude && selectedEntry.location.longitude && (
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${selectedEntry.location.latitude},${selectedEntry.location.longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-block mt-2 text-sm text-emerald-600 hover:text-emerald-700 font-semibold"
                                        >
                                            🗺️ عرض على الخريطة
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Rating */}
                        {selectedEntry.rating && (
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">تقييمي</h3>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <span key={star} className={`text-2xl ${star <= selectedEntry.rating! ? 'text-yellow-400' : 'text-gray-300'}`}>
                                            ⭐
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        {selectedEntry.notes && (
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">ملاحظاتي</h3>
                                <p className="text-gray-700 dark:text-gray-300 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                    {selectedEntry.notes}
                                </p>
                            </div>
                        )}

                        {/* Tags */}
                        {selectedEntry.tags && selectedEntry.tags.length > 0 && (
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">الكلمات المفتاحية</h3>
                                <div className="flex flex-wrap gap-2">
                                    {selectedEntry.tags.map((tag, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* AI Analysis */}
                        {selectedEntry.aiAnalysis && (
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">🤖 تحليل الذكاء الاصطناعي</h3>
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800 text-sm">
                                    <p className="text-gray-700 dark:text-gray-300">
                                        <strong>نوع:</strong> {selectedEntry.aiAnalysis.detectedType}
                                    </p>
                                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                                        {selectedEntry.aiAnalysis.extractedInfo}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Date */}
                        <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4 border-t border-gray-200 dark:border-gray-700">
                            تم الإضافة: {new Date(selectedEntry.date).toLocaleString('ar-SA')}
                        </div>

                        {/* Delete Button */}
                        <button
                            onClick={() => handleDeleteEntry(selectedEntry.id)}
                            className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition"
                        >
                            🗑️ حذف الإدخال
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // ========================================
    // RENDER: ADD ENTRY MODAL
    // ========================================

    const renderAddModal = () => {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" dir="rtl">
                <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="bg-emerald-600 text-white p-4 flex items-center justify-between sticky top-0">
                        <h2 className="text-xl font-bold">إضافة إدخال جديد</h2>
                        <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-emerald-700 rounded-full">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="p-4 space-y-4">
                        {/* Step 1: Upload Images */}
                        <div>
                            <label className="block font-bold text-gray-900 dark:text-gray-100 mb-2">📸 الصور</label>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageUpload}
                                ref={fileInputRef}
                                className="hidden"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-emerald-500 transition flex items-center justify-center gap-2"
                            >
                                <CameraIcon className="w-6 h-6" />
                                <span>اختر صور ({uploadedImages.length})</span>
                            </button>
                            {uploadedImages.length > 0 && (
                                <div className="grid grid-cols-3 gap-2 mt-2">
                                    {uploadedImages.map((img, idx) => (
                                        <div key={idx} className="relative">
                                            <img src={img} alt={`Upload ${idx + 1}`} className="w-full h-24 object-cover rounded" />
                                            <button
                                                onClick={() => setUploadedImages(uploadedImages.filter((_, i) => i !== idx))}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Step 2: Optional Prompt */}
                        <div>
                            <label className="block font-bold text-gray-900 dark:text-gray-100 mb-2">💬 وصف إضافي (اختياري)</label>
                            <textarea
                                value={userPrompt}
                                onChange={(e) => setUserPrompt(e.target.value)}
                                placeholder="مثال: هذا فندقي في باريس، هذا منظر من برج إيفل..."
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                rows={2}
                            />
                        </div>

                        {/* Step 3: Analyze */}
                        <button
                            onClick={handleAnalyzeImages}
                            disabled={uploadedImages.length === 0 || isAnalyzing}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
                        >
                            {isAnalyzing ? (
                                <>
                                    <LoadingSpinner />
                                    <span>جاري التحليل...</span>
                                </>
                            ) : (
                                <>
                                    <span>🤖</span>
                                    <span>تحليل بالذكاء الاصطناعي</span>
                                </>
                            )}
                        </button>

                        {/* Step 4: Edit Results */}
                        {analysisResult && (
                            <>
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                    <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3">✏️ تعديل التفاصيل</h3>

                                    {/* Category */}
                                    <div className="mb-3">
                                        <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">القسم</label>
                                        <select
                                            value={editableCategory}
                                            onChange={(e) => setEditableCategory(e.target.value as EntryCategory)}
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700"
                                        >
                                            <option value="accommodation">🏨 السكن</option>
                                            <option value="restaurants">🍽️ مطاعمي</option>
                                            <option value="landmarks">🏛️ معالم زرتها</option>
                                            <option value="memories">📸 ذكريات</option>
                                            <option value="notes">📝 ملاحظات</option>
                                            <option value="important">⭐ مهم</option>
                                        </select>
                                    </div>

                                    {/* Title */}
                                    <div className="mb-3">
                                        <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">العنوان</label>
                                        <input
                                            type="text"
                                            value={editableTitle}
                                            onChange={(e) => setEditableTitle(e.target.value)}
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700"
                                        />
                                    </div>

                                    {/* Description */}
                                    <div className="mb-3">
                                        <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">الوصف</label>
                                        <textarea
                                            value={editableDescription}
                                            onChange={(e) => setEditableDescription(e.target.value)}
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700"
                                            rows={3}
                                        />
                                    </div>

                                    {/* Rating (for accommodation & restaurants) */}
                                    {(editableCategory === 'accommodation' || editableCategory === 'restaurants') && (
                                        <div className="mb-3">
                                            <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">التقييم</label>
                                            <div className="flex gap-2">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <button
                                                        key={star}
                                                        onClick={() => setEditableRating(star)}
                                                        className="text-3xl"
                                                    >
                                                        {star <= editableRating ? '⭐' : '☆'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Notes */}
                                    <div className="mb-3">
                                        <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">ملاحظات شخصية</label>
                                        <textarea
                                            value={editableNotes}
                                            onChange={(e) => setEditableNotes(e.target.value)}
                                            placeholder="أضف ملاحظاتك الخاصة..."
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700"
                                            rows={2}
                                        />
                                    </div>
                                </div>

                                {/* Save Button */}
                                <button
                                    onClick={handleSaveEntry}
                                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition"
                                >
                                    ✅ حفظ الإدخال
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // ========================================
    // MAIN RENDER
    // ========================================

    if (showAddModal) {
        return renderAddModal();
    }

    if (currentView === 'categories') {
        return renderCategoriesView();
    }

    if (currentView === 'categoryList') {
        return renderCategoryListView();
    }

    if (currentView === 'entryDetail' && selectedEntry) {
        return renderEntryDetailView();
    }

    return null;
};

export default MySpace;

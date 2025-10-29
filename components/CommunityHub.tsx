import React, { useState, useEffect, useRef } from 'react';
import * as communityService from '../services/communityService';
import { getUserId } from '../services/userService';
import { Community, CommunityPost, Attachment } from '../types';
import { reverseGeocode } from '../services/geminiService';
import { UsersIcon } from './icons/UsersIcon';
import { FindItIcon } from './icons/FindItIcon';
import { PlusIcon } from './icons/PlusIcon';
import { KeyIcon } from './icons/KeyIcon';
import { TrashIcon } from './icons/TrashIcon';
import { PaperclipIcon } from './icons/PaperclipIcon';
import { FilePdfIcon } from './icons/FilePdfIcon';
import { BlockIcon } from './icons/BlockIcon';
import { LocationMarkerIcon } from './icons/LocationMarkerIcon';

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

// FIX: Added missing helper function to generate unique IDs for attachments.
const generateId = (): string => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

const CommunityHub: React.FC = () => {
    const [communities, setCommunities] = useState<Community[]>([]);
    const [filteredCommunities, setFilteredCommunities] = useState<Community[]>([]);
    const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newCommunityName, setNewCommunityName] = useState('');
    const [newCommunityDesc, setNewCommunityDesc] = useState('');

    const [newPostContent, setNewPostContent] = useState('');
    const [newPostAttachments, setNewPostAttachments] = useState<File[]>([]);
    const [attachmentPreviews, setAttachmentPreviews] = useState<string[]>([]);
    const [attachedLocation, setAttachedLocation] = useState<CommunityPost['location'] | null>(null);
    const [isAttachingLocation, setIsAttachingLocation] = useState(false);

    const [isAdmin, setIsAdmin] = useState(false);
    const [showBannedModal, setShowBannedModal] = useState(false);
    const [bannedUsers, setBannedUsers] = useState<string[]>([]);

    const currentUserId = getUserId();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const refreshCommunities = () => {
        const allCommunities = communityService.getCommunities();
        setCommunities(allCommunities);
    };

    useEffect(() => {
        refreshCommunities();
    }, []);

    useEffect(() => {
        const results = communities.filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredCommunities(results);
    }, [searchTerm, communities]);

    const handleSelectCommunity = (community: Community) => {
        const banned = communityService.getBannedUsers();
        const filteredCommunity = {
            ...community,
            posts: community.posts.filter(p => !banned.includes(p.authorId))
        };
        setSelectedCommunity(filteredCommunity);
    };
    
    const handleCreateCommunity = () => {
        if (!newCommunityName.trim() || !newCommunityDesc.trim()) return;
        communityService.addCommunity(newCommunityName, newCommunityDesc, currentUserId);
        refreshCommunities();
        setShowCreateModal(false);
        setNewCommunityName('');
        setNewCommunityDesc('');
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        setNewPostAttachments(prev => [...prev, ...files]);

        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                setAttachmentPreviews(prev => [...prev, e.target?.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeAttachment = (index: number) => {
        setNewPostAttachments(prev => prev.filter((_, i) => i !== index));
        setAttachmentPreviews(prev => prev.filter((_, i) => i !== index));
    };

     const handleAttachLocation = async () => {
        if (attachedLocation) {
            setAttachedLocation(null);
            return;
        }
        setIsAttachingLocation(true);
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                const name = await reverseGeocode(latitude, longitude);
                setAttachedLocation({ name, lat: latitude, lon: longitude });
            } catch (e) {
                setAttachedLocation({ name: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, lat: latitude, lon: longitude });
            } finally {
                setIsAttachingLocation(false);
            }
        }, (error) => {
            console.error("Geolocation error:", error);
            alert("فشل تحديد الموقع. يرجى التأكد من منح الإذن.");
            setIsAttachingLocation(false);
        });
    };

    const handleAddPost = async () => {
        if (!selectedCommunity || (!newPostContent.trim() && newPostAttachments.length === 0)) return;
        if (communityService.isUserBanned(currentUserId)) {
            alert("لا يمكنك النشر لأنك محظور.");
            return;
        }

        const attachments: Attachment[] = [];
        for (const file of newPostAttachments) {
            const data = await fileToBase64(file);
            attachments.push({ id: generateId(), name: file.name, type: file.type, data });
        }
        
        communityService.addPostToCommunity(selectedCommunity.id, newPostContent, currentUserId, attachments, attachedLocation || undefined);
        refreshCommunities();
        const updatedCommunity = communityService.getCommunities().find(c => c.id === selectedCommunity.id);
        if (updatedCommunity) handleSelectCommunity(updatedCommunity);

        setNewPostContent('');
        setNewPostAttachments([]);
        setAttachmentPreviews([]);
        setAttachedLocation(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleDeleteCommunity = (communityId: string) => {
        if (window.confirm("هل أنت متأكد من حذف هذا المجتمع وكل منشوراته؟")) {
            communityService.deleteCommunity(communityId);
            refreshCommunities();
        }
    };

    const handleDeletePost = (postId: string) => {
        if (window.confirm("هل أنت متأكد من حذف هذا المنشور؟")) {
            communityService.deletePost(selectedCommunity!.id, postId);
            refreshCommunities();
            const updatedCommunity = communityService.getCommunities().find(c => c.id === selectedCommunity!.id);
            if (updatedCommunity) handleSelectCommunity(updatedCommunity);
        }
    };

    const handleDeleteAttachment = (postId: string, attachmentId: string) => {
        if (window.confirm("هل أنت متأكد من حذف هذا المرفق؟")) {
            communityService.deleteAttachment(selectedCommunity!.id, postId, attachmentId);
            refreshCommunities();
            const updatedCommunity = communityService.getCommunities().find(c => c.id === selectedCommunity!.id);
            if (updatedCommunity) handleSelectCommunity(updatedCommunity);
        }
    };

    const handleAdminLogin = () => {
        const password = prompt("الرجاء إدخال كلمة مرور المدير:");
        if (password && communityService.checkAdminPassword(password)) {
            setIsAdmin(true);
            alert("تم تسجيل الدخول كمدير بنجاح.");
        } else if (password) {
            alert("كلمة مرور غير صحيحة.");
        }
    };

    const handleBanUser = (userId: string) => {
        if (window.confirm(`هل أنت متأكد من حظر المستخدم ${userId}؟ ستختفي جميع منشوراته.`)) {
            communityService.banUser(userId);
            if (selectedCommunity) {
                handleSelectCommunity(selectedCommunity); // Re-filter posts
            }
        }
    };
    
    const handleUnbanUser = (userId: string) => {
        communityService.unbanUser(userId);
        setBannedUsers(communityService.getBannedUsers()); // Refresh banned list
    };
    
    const openBannedModal = () => {
        setBannedUsers(communityService.getBannedUsers());
        setShowBannedModal(true);
    };

    const renderAttachment = (att: Attachment, postId: string, authorId: string, creatorId: string) => {
        const canDelete = isAdmin || currentUserId === authorId || currentUserId === creatorId;
        return (
            <div key={att.id} className="relative group">
                {att.type.startsWith('image/') && <img src={att.data} className="rounded-lg max-h-80" />}
                {att.type.startsWith('video/') && <video src={att.data} controls className="rounded-lg max-h-80" />}
                {att.type.startsWith('application/pdf') && (
                    <a href={att.data} download={att.name} className="flex items-center gap-2 p-3 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">
                        <FilePdfIcon className="w-6 h-6 text-red-500" />
                        <span className="truncate">{att.name}</span>
                    </a>
                )}
                {canDelete && (
                    <button onClick={() => handleDeleteAttachment(postId, att.id)} className="absolute top-1 right-1 bg-red-500/80 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <TrashIcon className="w-4 h-4" />
                    </button>
                )}
            </div>
        );
    };

    if (selectedCommunity) {
        return (
            <div className="flex flex-col h-full animate-fade-in p-4" dir="rtl">
                <div className="flex-shrink-0 mb-4">
                    <button onClick={() => setSelectedCommunity(null)} className="font-semibold text-emerald-600 dark:text-emerald-400 mb-2">&larr; العودة إلى المجتمعات</button>
                    <h2 className="text-2xl font-bold">{selectedCommunity.name}</h2>
                    <p className="text-gray-600 dark:text-gray-400">{selectedCommunity.description}</p>
                </div>

                <div className="flex-grow overflow-y-auto space-y-4">
                    {/* New Post Form */}
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <textarea
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            placeholder="شارك نصيحة أو سؤال..."
                            className="w-full p-2 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            rows={3}
                        />
                        {/* Previews */}
                        <div className="flex flex-wrap gap-2 mt-2">
                            {attachmentPreviews.map((preview, index) => (
                                <div key={index} className="relative">
                                    <img src={preview} className="h-20 w-20 object-cover rounded" />
                                    <button onClick={() => removeAttachment(index)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 text-xs">&times;</button>
                                </div>
                            ))}
                        </div>
                         {attachedLocation && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/50 p-2 rounded-md">
                                <LocationMarkerIcon className="w-4 h-4" />
                                <span>{attachedLocation.name}</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between mt-2">
                             <div>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple accept="image/*,video/*,application/pdf" className="hidden" />
                                <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 hover:text-emerald-500"><PaperclipIcon className="w-6 h-6" /></button>
                                <button onClick={handleAttachLocation} disabled={isAttachingLocation} className={`p-2 text-gray-500 hover:text-emerald-500 ${attachedLocation ? 'text-emerald-600' : ''}`}>
                                    {isAttachingLocation ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-500"></div> : <LocationMarkerIcon className="w-6 h-6" />}
                                </button>
                            </div>
                            <button onClick={handleAddPost} className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700">نشر</button>
                        </div>
                    </div>
                    {/* Posts */}
                    {selectedCommunity.posts.map(post => (
                        <div key={post.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs text-gray-500 flex items-center gap-2">
                                        <span className="font-semibold">{post.authorId.substring(0, 10)}...</span>
                                        <span>&bull; {new Date(post.timestamp).toLocaleString('ar-SA')}</span>
                                        {isAdmin && <button onClick={() => handleBanUser(post.authorId)} className="text-red-500 hover:text-red-700"><BlockIcon className="w-4 h-4"/></button>}
                                    </p>
                                    <p className="mt-2 text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{post.content}</p>
                                </div>
                                {(isAdmin || currentUserId === post.authorId || currentUserId === selectedCommunity.creatorId) && (
                                    <button onClick={() => handleDeletePost(post.id)} className="text-gray-400 hover:text-red-500"><TrashIcon className="w-5 h-5"/></button>
                                )}
                            </div>
                            {post.location && (
                                <a href={`https://www.google.com/maps?q=${post.location.lat},${post.location.lon}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:underline mt-2">
                                    <LocationMarkerIcon className="w-3 h-3"/> {post.location.name}
                                </a>
                            )}
                            <div className="mt-2 flex flex-col gap-2">
                                {post.attachments?.map(att => renderAttachment(att, post.id, post.authorId, selectedCommunity.creatorId))}
                            </div>
                        </div>
                    ))}
                    {selectedCommunity.posts.length === 0 && <p className="text-center text-gray-500 mt-8">كن أول من يشارك في هذا المجتمع!</p>}
                </div>
            </div>
        );
    }
    
    // Main View
    return (
        <div className="p-4 animate-fade-in" dir="rtl">
            <div className="flex justify-between items-center mb-4">
                 <h2 className="text-2xl font-bold flex items-center gap-2">
                    المجتمعات
                    <button onClick={handleAdminLogin} className="text-gray-400 hover:text-emerald-500"><KeyIcon className="w-5 h-5"/></button>
                </h2>
                {isAdmin && <button onClick={openBannedModal} className="text-sm font-semibold text-red-500">قائمة المحظورين</button>}
            </div>
            
            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    placeholder="ابحث عن مجتمع..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-grow p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button onClick={() => setShowCreateModal(true)} className="p-3 bg-emerald-600 text-white rounded-lg"><PlusIcon className="w-6 h-6"/></button>
            </div>

            <div className="space-y-3">
                {filteredCommunities.map(community => (
                    <div key={community.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <div onClick={() => handleSelectCommunity(community)} className="cursor-pointer flex-grow">
                            <h3 className="font-bold text-gray-900 dark:text-gray-100">{community.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{community.description}</p>
                        </div>
                        {isAdmin && (
                            <button onClick={() => handleDeleteCommunity(community.id)} className="text-gray-400 hover:text-red-500 flex-shrink-0 ml-4"><TrashIcon className="w-5 h-5"/></button>
                        )}
                    </div>
                ))}
                {filteredCommunities.length === 0 && <p className="text-center text-gray-500 mt-8">لم يتم العثور على مجتمعات. قم بإنشاء واحد!</p>}
            </div>

            {/* Create Community Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowCreateModal(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-4">إنشاء مجتمع جديد</h3>
                        <input type="text" placeholder="اسم المجتمع" value={newCommunityName} onChange={e => setNewCommunityName(e.target.value)} className="w-full p-2 mb-2 bg-gray-100 dark:bg-gray-700 border rounded"/>
                        <textarea placeholder="وصف موجز للمجتمع" value={newCommunityDesc} onChange={e => setNewCommunityDesc(e.target.value)} className="w-full p-2 mb-4 bg-gray-100 dark:bg-gray-700 border rounded" />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded">إلغاء</button>
                            <button onClick={handleCreateCommunity} className="px-4 py-2 bg-emerald-600 text-white rounded">إنشاء</button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Banned Users Modal */}
            {showBannedModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowBannedModal(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-4">المستخدمون المحظورون</h3>
                        <div className="max-h-60 overflow-y-auto space-y-2">
                           {bannedUsers.length > 0 ? bannedUsers.map(userId => (
                                <div key={userId} className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700 rounded">
                                    <span className="text-sm font-mono">{userId}</span>
                                    <button onClick={() => handleUnbanUser(userId)} className="text-sm text-emerald-600 font-semibold">رفع الحظر</button>
                                </div>
                            )) : <p className="text-center text-gray-500">لا يوجد مستخدمون محظورون حاليًا.</p>}
                        </div>
                         <button onClick={() => setShowBannedModal(false)} className="mt-4 w-full px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded">إغلاق</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommunityHub;

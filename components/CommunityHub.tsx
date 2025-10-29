import React, { useState, useEffect, useRef } from 'react';
import * as communityService from '../services/communityService';
import * as userService from '../services/userService';
import { Community, CommunityPost, Attachment } from '../types';
import { reverseGeocode } from '../services/geminiService';
import { UsersIcon } from './icons/UsersIcon';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { PaperclipIcon } from './icons/PaperclipIcon';
import { FilePdfIcon } from './icons/FilePdfIcon';
import { BlockIcon } from './icons/BlockIcon';
import { LocationMarkerIcon } from './icons/LocationMarkerIcon';
import { PencilIcon } from './icons/PencilIcon';

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

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
    const [viewingImage, setViewingImage] = useState<string | null>(null);

    const [userProfiles, setUserProfiles] = useState<Record<string, string>>({});
    const [showUsernameModal, setShowUsernameModal] = useState(false);
    const [usernameInput, setUsernameInput] = useState('');


    const currentUserId = userService.getUserId();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const refreshCommunities = () => {
        const allCommunities = communityService.getCommunities();
        setCommunities(allCommunities);
    };

    useEffect(() => {
        refreshCommunities();
        const profiles = userService.getAllUserProfiles();
        setUserProfiles(profiles);
        const currentUsername = profiles[currentUserId];
        if (!currentUsername) {
            setShowUsernameModal(true);
        } else {
            setUsernameInput(currentUsername);
        }
    }, [currentUserId]);
    
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selectedCommunity?.posts]);


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

        files.forEach((file: File) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result;
                if (typeof result === 'string') {
                    setAttachmentPreviews(prev => [...prev, result]);
                }
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
        if (!userService.getUsername(currentUserId)) {
            setShowUsernameModal(true);
            alert("الرجاء اختيار اسم مستخدم أولاً.");
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
            if (selectedCommunity?.id === communityId) {
                setSelectedCommunity(null);
            }
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
    
    const handleSetUsername = () => {
        if (!usernameInput.trim()) return;
        userService.setUsername(currentUserId, usernameInput.trim());
        setUserProfiles(userService.getAllUserProfiles());
        setShowUsernameModal(false);
    };

    const renderAttachment = (att: Attachment, postId: string, authorId: string, creatorId: string) => {
        const canDelete = isAdmin || currentUserId === authorId || currentUserId === creatorId;
        return (
            <div key={att.id} className="relative group mt-1">
                {att.type.startsWith('image/') && (
                    <button onClick={() => setViewingImage(att.data)} className="w-full text-left">
                        <img src={att.data} alt={att.name} className="rounded-lg max-h-80 object-contain w-full cursor-pointer bg-gray-100 dark:bg-gray-700" />
                    </button>
                )}
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
    
    const renderNewPostForm = () => (
        <div className="flex-shrink-0 p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            {(attachmentPreviews.length > 0 || attachedLocation) && (
                <div className="p-2">
                    <div className="flex flex-wrap gap-2">
                        {attachmentPreviews.map((preview, index) => (
                            <div key={index} className="relative">
                                <img src={preview} className="h-16 w-16 object-cover rounded" />
                                <button onClick={() => removeAttachment(index)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">&times;</button>
                            </div>
                        ))}
                    </div>
                     {attachedLocation && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/50 p-2 rounded-md">
                            <LocationMarkerIcon className="w-4 h-4" />
                            <span>{attachedLocation.name}</span>
                            <button onClick={() => setAttachedLocation(null)} className="mr-auto text-red-500 text-xs">&times;</button>
                        </div>
                    )}
                </div>
            )}
            <div className="flex items-center gap-2">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple accept="image/*,video/*,application/pdf" className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 hover:text-emerald-500"><PaperclipIcon className="w-6 h-6" /></button>
                <button onClick={handleAttachLocation} disabled={isAttachingLocation} className={`p-2 text-gray-500 hover:text-emerald-500 ${attachedLocation ? 'text-emerald-600' : ''}`}>
                    {isAttachingLocation ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-500"></div> : <LocationMarkerIcon className="w-6 h-6" />}
                </button>
                <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="اكتب رسالة..."
                    className="flex-grow p-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    rows={1}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAddPost();
                        }
                    }}
                />
                <button onClick={handleAddPost} className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700">إرسال</button>
            </div>
        </div>
    );

    return (
        <div className="flex h-full w-full" dir="rtl">
            <div className={`w-full md:w-1/3 lg:w-1/4 flex flex-col border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all duration-300 ${selectedCommunity ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="ابحث..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-grow p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                        />
                         <button onClick={() => setShowUsernameModal(true)} title="تغيير اسم المستخدم" className="p-2 text-gray-500 hover:text-emerald-500 rounded-lg flex-shrink-0"><PencilIcon className="w-5 h-5"/></button>
                         <button onClick={() => setShowCreateModal(true)} className="p-2 bg-emerald-600 text-white rounded-lg flex-shrink-0"><PlusIcon className="w-5 h-5"/></button>
                    </div>
                </div>
                <div className="overflow-y-auto flex-grow">
                    {filteredCommunities.map(community => (
                        <div 
                            key={community.id}
                            onClick={() => handleSelectCommunity(community)}
                            className={`p-3 cursor-pointer border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${selectedCommunity?.id === community.id ? 'bg-emerald-50 dark:bg-emerald-900/50' : ''}`}
                        >
                            <h3 className="font-bold text-gray-900 dark:text-gray-100">{community.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{community.description}</p>
                        </div>
                     ))}
                </div>
            </div>

            <div className="flex-grow flex flex-col bg-gray-100 dark:bg-gray-900">
                {selectedCommunity ? (
                    <>
                        <div className="flex-shrink-0 p-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3 bg-white dark:bg-gray-800">
                             <button onClick={() => setSelectedCommunity(null)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 md:hidden">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                </svg>
                             </button>
                            <div>
                                <h2 className="font-bold text-lg">{selectedCommunity.name}</h2>
                                <p className="text-xs text-gray-500">{selectedCommunity.posts.length} منشور</p>
                            </div>
                        </div>
                        <div className="flex-grow overflow-y-auto p-4">
                             <div className="space-y-4">
                                {selectedCommunity.posts.slice().reverse().map(post => (
                                    <div key={post.id} className={`flex items-end gap-2 ${post.authorId === currentUserId ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-md p-3 rounded-lg ${post.authorId === currentUserId ? 'bg-emerald-500 text-white rounded-br-none' : 'bg-white dark:bg-gray-700 rounded-bl-none'}`}>
                                            <p className="text-xs opacity-80 font-semibold mb-1">
                                                {userProfiles[post.authorId] || `مستخدم ${post.authorId.substring(0, 4)}`}
                                                {isAdmin && <button onClick={() => handleBanUser(post.authorId)} className="text-red-300 hover:text-red-100 ml-2"><BlockIcon className="w-3 h-3"/></button>}
                                            </p>
                                            <p className="whitespace-pre-wrap">{post.content}</p>
                                             {post.location && (
                                                <a href={`https://www.google.com/maps?q=${post.location.lat},${post.location.lon}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs hover:underline mt-2 opacity-90">
                                                    <LocationMarkerIcon className="w-3 h-3"/> {post.location.name}
                                                </a>
                                            )}
                                            <div className="mt-2 flex flex-col gap-2">
                                                {post.attachments?.map(att => renderAttachment(att, post.id, post.authorId, selectedCommunity.creatorId))}
                                            </div>
                                            <p className="text-xs opacity-70 mt-2 text-right">{new Date(post.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                ))}
                             </div>
                             <div ref={chatEndRef} />
                        </div>
                        {renderNewPostForm()}
                    </>
                ) : (
                    <div className="flex-grow flex items-center justify-center text-center text-gray-500 dark:text-gray-400">
                        <div>
                            <UsersIcon className="w-16 h-16 mx-auto mb-4" />
                            <h2 className="text-xl font-bold">اختر مجتمعًا</h2>
                            <p>أو أنشئ مجتمعًا جديدًا لتبدأ المحادثة.</p>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Modals */}
             {viewingImage && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setViewingImage(null)}>
                    <img src={viewingImage} alt="عرض مكبر" className="max-w-full max-h-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
                </div>
            )}
            {showUsernameModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-4">اختر اسم مستخدم</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            سيظهر هذا الاسم للآخرين في المجتمع.
                        </p>
                        <input type="text" placeholder="اسم المستخدم" value={usernameInput} onChange={e => setUsernameInput(e.target.value)} className="w-full p-2 mb-4 bg-gray-100 dark:bg-gray-700 border rounded"/>
                        <div className="flex justify-end gap-2">
                             {userService.getUsername(currentUserId) && (
                                <button onClick={() => setShowUsernameModal(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded">إلغاء</button>
                            )}
                            <button onClick={handleSetUsername} className="px-4 py-2 bg-emerald-600 text-white rounded">حفظ</button>
                        </div>
                    </div>
                </div>
            )}
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
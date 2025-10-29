import React, { useState, useEffect, useRef } from 'react';
import * as communityService from '../services/communityService';
import * as storyService from '../services/storyService';
import * as cityHubService from '../services/cityHubService';
import * as quickQAService from '../services/quickQAService';
import * as userService from '../services/userService';
import { Community, CommunityPost, Attachment, TravelStory, CityHub, QuickQuestion } from '../types';
import { reverseGeocode } from '../services/geminiService';
import { UsersIcon } from './icons/UsersIcon';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { PaperclipIcon } from './icons/PaperclipIcon';
import { FilePdfIcon } from './icons/FilePdfIcon';
import { BlockIcon } from './icons/BlockIcon';
import { LocationMarkerIcon } from './icons/LocationMarkerIcon';
import { PencilIcon } from './icons/PencilIcon';
import { ImageIcon } from './icons/ImageIcon';
import { CameraIcon } from './icons/CameraIcon';

type TabView = 'stories' | 'hubs' | 'questions' | 'groups';

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
    const [activeTab, setActiveTab] = useState<TabView>('stories');
    const [communities, setCommunities] = useState<Community[]>([]);
    const [stories, setStories] = useState<TravelStory[]>([]);
    const [cityHubs, setCityHubs] = useState<CityHub[]>([]);
    const [questions, setQuestions] = useState<QuickQuestion[]>([]);

    const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
    const [selectedHub, setSelectedHub] = useState<CityHub | null>(null);

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

    // Story creation state
    const [showCreateStory, setShowCreateStory] = useState(false);
    const [storyCaption, setStoryCaption] = useState('');
    const [storyMedia, setStoryMedia] = useState<File[]>([]);
    const [storyPreviews, setStoryPreviews] = useState<string[]>([]);
    const [storyCategory, setStoryCategory] = useState<TravelStory['category']>('general');

    // Question creation state
    const [showAskQuestion, setShowAskQuestion] = useState(false);
    const [questionText, setQuestionText] = useState('');
    const [questionCategory, setQuestionCategory] = useState<QuickQuestion['category']>('general');
    const [questionCity, setQuestionCity] = useState('');

    const currentUserId = userService.getUserId();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const storyFileInputRef = useRef<HTMLInputElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        refreshAll();
        const profiles = userService.getAllUserProfiles();
        setUserProfiles(profiles);
        const currentUsername = profiles[currentUserId];
        if (!currentUsername) {
            setShowUsernameModal(true);
        } else {
            setUsernameInput(currentUsername);
        }

        // Cleanup expired content
        storyService.cleanupExpiredStories();
        cityHubService.cleanupAllExpiredUpdates();
        quickQAService.cleanupExpiredQuestions();
    }, [currentUserId]);

    const refreshAll = () => {
        setCommunities(communityService.getCommunities());
        setStories(storyService.getPublicStories());
        setCityHubs(cityHubService.getCityHubs());
        setQuestions(quickQAService.getActiveQuestions());
    };

    const handleSetUsername = () => {
        if (!usernameInput.trim()) return;
        userService.setUsername(currentUserId, usernameInput.trim());
        setUserProfiles(userService.getAllUserProfiles());
        setShowUsernameModal(false);
    };

    // === STORIES TAB ===
    const handleCreateStory = async () => {
        if (storyMedia.length === 0) {
            alert('يرجى إضافة صورة أو فيديو على الأقل');
            return;
        }

        if (!userService.getUsername(currentUserId)) {
            setShowUsernameModal(true);
            return;
        }

        try {
            // Get current location
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });

            const { latitude, longitude } = position.coords;
            const locationName = await reverseGeocode(latitude, longitude);

            // Extract city and country (simplified)
            const parts = locationName.split(',').map(p => p.trim());
            const city = parts[0] || 'Unknown';
            const country = parts[parts.length - 1] || 'Unknown';

            // Convert media to base64
            const mediaData = await Promise.all(
                storyMedia.map(async (file, index) => ({
                    id: generateId(),
                    type: file.type.startsWith('image/') ? 'image' as const : 'video' as const,
                    data: await fileToBase64(file),
                    duration: file.type.startsWith('video/') ? 30 : undefined
                }))
            );

            const story = storyService.createStory(
                currentUserId,
                { name: locationName, lat: latitude, lon: longitude, city, country },
                mediaData,
                storyCaption || undefined,
                storyCategory,
                [],
                true
            );

            // Associate with city hub if exists
            const hub = cityHubService.getCityHubByName(city);
            if (hub) {
                cityHubService.addStoryToHub(hub.id, story.id);
            }

            setShowCreateStory(false);
            setStoryCaption('');
            setStoryMedia([]);
            setStoryPreviews([]);
            refreshAll();
            alert('تم نشر قصتك بنجاح! ستختفي بعد 24 ساعة.');
        } catch (error) {
            console.error('Error creating story:', error);
            alert('فشل إنشاء القصة. يرجى التأكد من منح إذن الموقع.');
        }
    };

    const handleStoryMediaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        setStoryMedia(files);

        files.forEach((file) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result) {
                    setStoryPreviews(prev => [...prev, e.target!.result as string]);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    // === QUESTIONS TAB ===
    const handleAskQuestion = async () => {
        if (!questionText.trim()) return;
        if (!userService.getUsername(currentUserId)) {
            setShowUsernameModal(true);
            return;
        }

        try {
            let city = questionCity.trim();
            let lat = 0;
            let lon = 0;

            if (!city) {
                // Use current location
                const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject);
                });
                lat = position.coords.latitude;
                lon = position.coords.longitude;
                const locationName = await reverseGeocode(lat, lon);
                city = locationName.split(',')[0].trim();
            }

            quickQAService.askQuestion(
                currentUserId,
                questionText,
                { city, lat, lon },
                questionCategory,
                'low',
                []
            );

            setShowAskQuestion(false);
            setQuestionText('');
            setQuestionCity('');
            refreshAll();
        } catch (error) {
            console.error('Error asking question:', error);
            alert('فشل نشر السؤال');
        }
    };

    const handleAnswerQuestion = (questionId: string) => {
        const answer = prompt('اكتب إجابتك:');
        if (answer && answer.trim()) {
            quickQAService.addAnswer(questionId, currentUserId, answer.trim());
            refreshAll();
        }
    };

    // === CITY HUBS TAB ===
    const handleSelectHub = (hub: CityHub) => {
        cityHubService.joinCityHub(hub.id, currentUserId);
        setSelectedHub(hub);
        refreshAll();
    };

    const handleAddHubUpdate = (hubId: string) => {
        const title = prompt('عنوان التحديث:');
        if (!title) return;
        const content = prompt('محتوى التحديث:');
        if (!content) return;

        cityHubService.addUpdate(
            hubId,
            currentUserId,
            'tip',
            title,
            content,
            'low'
        );
        refreshAll();
    };

    // === GROUPS TAB (Existing functionality) ===
    const refreshCommunities = () => {
        const allCommunities = communityService.getCommunities();
        setCommunities(allCommunities);
    };

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
        refreshAll();
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
        refreshAll();
        const updatedCommunity = communityService.getCommunities().find(c => c.id === selectedCommunity.id);
        if (updatedCommunity) handleSelectCommunity(updatedCommunity);

        setNewPostContent('');
        setNewPostAttachments([]);
        setAttachmentPreviews([]);
        setAttachedLocation(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleDeletePost = (postId: string) => {
        if (window.confirm("هل أنت متأكد من حذف هذا المنشور؟")) {
            communityService.deletePost(selectedCommunity!.id, postId);
            refreshCommunities();
            refreshAll();
            const updatedCommunity = communityService.getCommunities().find(c => c.id === selectedCommunity!.id);
            if (updatedCommunity) handleSelectCommunity(updatedCommunity);
        }
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

    // === RENDER TABS ===
    const renderTabContent = () => {
        switch (activeTab) {
            case 'stories':
                return (
                    <div className="p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">قصص السفر</h2>
                            <button onClick={() => setShowCreateStory(true)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg flex items-center gap-2">
                                <CameraIcon className="w-5 h-5" />
                                أضف قصة
                            </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {stories.map(story => (
                                <div key={story.id} className="relative bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden aspect-[9/16] cursor-pointer group">
                                    {story.media[0] && (
                                        story.media[0].type === 'image' ? (
                                            <img src={story.media[0].data} alt="Story" className="w-full h-full object-cover" />
                                        ) : (
                                            <video src={story.media[0].data} className="w-full h-full object-cover" />
                                        )
                                    )}
                                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                                        <p className="text-white text-sm font-semibold">{userProfiles[story.authorId] || 'مسافر'}</p>
                                        <p className="text-white/80 text-xs">{story.location.city}</p>
                                        {story.caption && <p className="text-white text-xs mt-1">{story.caption}</p>}
                                    </div>
                                    <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                                        {story.category}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {stories.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <p>لا توجد قصص نشطة حالياً</p>
                                <p className="text-sm mt-2">كن أول من ينشر قصة!</p>
                            </div>
                        )}
                    </div>
                );

            case 'hubs':
                return selectedHub ? (
                    <div className="flex flex-col h-full">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-4">
                            <button onClick={() => setSelectedHub(null)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                </svg>
                            </button>
                            <div>
                                <h2 className="font-bold text-lg">{selectedHub.city}, {selectedHub.country}</h2>
                                <p className="text-xs text-gray-500">{selectedHub.members.length} عضو</p>
                            </div>
                        </div>
                        <div className="flex-grow overflow-y-auto p-4">
                            <button
                                onClick={() => handleAddHubUpdate(selectedHub.id)}
                                className="w-full p-3 mb-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-lg border-2 border-dashed border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                            >
                                + أضف تحديث للمحطة
                            </button>
                            <div className="space-y-3">
                                {cityHubService.getActiveUpdates(selectedHub.id).map(update => (
                                    <div key={update.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-grow">
                                                <h4 className="font-bold">{update.title}</h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{update.content}</p>
                                                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                                    <span>{new Date(update.timestamp).toLocaleDateString('ar-SA')}</span>
                                                    <span className={`px-2 py-0.5 rounded ${
                                                        update.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                                        update.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                                        'bg-gray-100 text-gray-700'
                                                    }`}>
                                                        {update.type}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-4">
                        <h2 className="text-xl font-bold mb-4">محطات المدن</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {cityHubs.map(hub => (
                                <button
                                    key={hub.id}
                                    onClick={() => handleSelectHub(hub)}
                                    className="p-4 text-right bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-emerald-500 transition-all"
                                >
                                    <h3 className="font-bold text-lg">{hub.city}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{hub.country}</p>
                                    <p className="text-xs text-gray-500 mt-2">{hub.members.length} عضو</p>
                                    <p className="text-xs text-emerald-600 mt-1">{cityHubService.getActiveUpdates(hub.id).length} تحديث نشط</p>
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 'questions':
                return (
                    <div className="p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">أسئلة سريعة</h2>
                            <button onClick={() => setShowAskQuestion(true)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg">
                                اسأل سؤال
                            </button>
                        </div>
                        <div className="space-y-3">
                            {questions.map(q => (
                                <div key={q.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-grow">
                                            <p className="font-semibold">{q.question}</p>
                                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                                <LocationMarkerIcon className="w-3 h-3" />
                                                <span>{q.location.city}</span>
                                                <span>•</span>
                                                <span>{q.category}</span>
                                                <span>•</span>
                                                <span>{new Date(q.timestamp).toLocaleDateString('ar-SA')}</span>
                                            </div>
                                            {q.answers.length > 0 && (
                                                <div className="mt-3 space-y-2">
                                                    {q.answers.map(answer => (
                                                        <div key={answer.id} className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded text-sm">
                                                            <p>{answer.text}</p>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                {userProfiles[answer.userId] || 'مسافر'} • {answer.helpful.length} مفيد
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {q.status === 'active' && (
                                        <button
                                            onClick={() => handleAnswerQuestion(q.id)}
                                            className="mt-3 text-sm text-emerald-600 hover:text-emerald-700 font-semibold"
                                        >
                                            أجب على هذا السؤال
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        {questions.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                <p>لا توجد أسئلة نشطة حالياً</p>
                            </div>
                        )}
                    </div>
                );

            case 'groups':
                return (
                    <div className="flex h-full">
                        <div className={`w-full md:w-1/3 lg:w-1/4 flex flex-col border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 ${selectedCommunity ? 'hidden md:flex' : 'flex'}`}>
                            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        placeholder="ابحث..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="flex-grow p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                                    />
                                    <button onClick={() => setShowCreateModal(true)} className="p-2 bg-emerald-600 text-white rounded-lg">
                                        <PlusIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-y-auto flex-grow">
                                {communities.map(community => (
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
                                        <h2 className="text-xl font-bold">اختر مجموعة</h2>
                                        <p>أو أنشئ مجموعة جديدة للمحادثة</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col h-full w-full" dir="rtl">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <button
                    onClick={() => setActiveTab('stories')}
                    className={`flex-1 px-4 py-3 font-semibold ${activeTab === 'stories' ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-gray-600 dark:text-gray-400'}`}
                >
                    📸 القصص
                </button>
                <button
                    onClick={() => setActiveTab('hubs')}
                    className={`flex-1 px-4 py-3 font-semibold ${activeTab === 'hubs' ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-gray-600 dark:text-gray-400'}`}
                >
                    📡 المحطات
                </button>
                <button
                    onClick={() => setActiveTab('questions')}
                    className={`flex-1 px-4 py-3 font-semibold ${activeTab === 'questions' ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-gray-600 dark:text-gray-400'}`}
                >
                    ⚡ أسئلة
                </button>
                <button
                    onClick={() => setActiveTab('groups')}
                    className={`flex-1 px-4 py-3 font-semibold ${activeTab === 'groups' ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-gray-600 dark:text-gray-400'}`}
                >
                    💬 مجموعات
                </button>
            </div>

            {/* Content */}
            <div className="flex-grow overflow-hidden">
                {renderTabContent()}
            </div>

            {/* Modals */}
            {viewingImage && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setViewingImage(null)}>
                    <img src={viewingImage} alt="عرض مكبر" className="max-w-full max-h-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
                </div>
            )}

            {showUsernameModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm">
                        <h3 className="text-xl font-bold mb-4">اختر اسم مستخدم</h3>
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
                        <h3 className="text-xl font-bold mb-4">إنشاء مجموعة جديدة</h3>
                        <input type="text" placeholder="اسم المجموعة" value={newCommunityName} onChange={e => setNewCommunityName(e.target.value)} className="w-full p-2 mb-2 bg-gray-100 dark:bg-gray-700 border rounded"/>
                        <textarea placeholder="وصف موجز" value={newCommunityDesc} onChange={e => setNewCommunityDesc(e.target.value)} className="w-full p-2 mb-4 bg-gray-100 dark:bg-gray-700 border rounded" />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded">إلغاء</button>
                            <button onClick={handleCreateCommunity} className="px-4 py-2 bg-emerald-600 text-white rounded">إنشاء</button>
                        </div>
                    </div>
                </div>
            )}

            {showCreateStory && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowCreateStory(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-4">إنشاء قصة جديدة</h3>
                        <input type="file" ref={storyFileInputRef} onChange={handleStoryMediaChange} accept="image/*,video/*" className="hidden" />
                        <button onClick={() => storyFileInputRef.current?.click()} className="w-full p-3 mb-3 bg-gray-100 dark:bg-gray-700 border-2 border-dashed rounded-lg">
                            اختر صورة أو فيديو
                        </button>
                        {storyPreviews.length > 0 && (
                            <div className="mb-3 flex gap-2 flex-wrap">
                                {storyPreviews.map((preview, i) => (
                                    <img key={i} src={preview} className="h-20 w-20 object-cover rounded" />
                                ))}
                            </div>
                        )}
                        <select value={storyCategory} onChange={e => setStoryCategory(e.target.value as any)} className="w-full p-2 mb-3 bg-gray-100 dark:bg-gray-700 border rounded">
                            <option value="general">عام</option>
                            <option value="food">طعام</option>
                            <option value="hotel">فندق</option>
                            <option value="activity">نشاط</option>
                            <option value="tip">نصيحة</option>
                            <option value="warning">تحذير</option>
                            <option value="transport">نقل</option>
                        </select>
                        <textarea placeholder="تعليق (اختياري)" value={storyCaption} onChange={e => setStoryCaption(e.target.value)} className="w-full p-2 mb-4 bg-gray-100 dark:bg-gray-700 border rounded" rows={3} />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowCreateStory(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded">إلغاء</button>
                            <button onClick={handleCreateStory} className="px-4 py-2 bg-emerald-600 text-white rounded">نشر</button>
                        </div>
                    </div>
                </div>
            )}

            {showAskQuestion && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowAskQuestion(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-4">اسأل سؤال سريع</h3>
                        <textarea placeholder="ما هو سؤالك؟" value={questionText} onChange={e => setQuestionText(e.target.value)} className="w-full p-2 mb-3 bg-gray-100 dark:bg-gray-700 border rounded" rows={3} />
                        <select value={questionCategory} onChange={e => setQuestionCategory(e.target.value as any)} className="w-full p-2 mb-3 bg-gray-100 dark:bg-gray-700 border rounded">
                            <option value="general">عام</option>
                            <option value="food">طعام</option>
                            <option value="transport">نقل</option>
                            <option value="safety">أمان</option>
                            <option value="accommodation">سكن</option>
                        </select>
                        <input type="text" placeholder="المدينة (اتركه فارغاً لاستخدام موقعك)" value={questionCity} onChange={e => setQuestionCity(e.target.value)} className="w-full p-2 mb-4 bg-gray-100 dark:bg-gray-700 border rounded"/>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowAskQuestion(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded">إلغاء</button>
                            <button onClick={handleAskQuestion} className="px-4 py-2 bg-emerald-600 text-white rounded">نشر السؤال</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommunityHub;

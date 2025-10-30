import React, { useState, useEffect, useRef } from 'react';
import { TelegramChat, TelegramMessage, TelegramStory, MessageType, ChatType } from '../types';
import * as telegramService from '../services/telegramService';
import * as userService from '../services/userService';
import { PlusIcon } from './icons/PlusIcon';
import { CameraIcon } from './icons/CameraIcon';
import { UsersIcon } from './icons/UsersIcon';
import { PaperclipIcon } from './icons/PaperclipIcon';
import { LocationMarkerIcon } from './icons/LocationMarkerIcon';
import { ImageIcon } from './icons/ImageIcon';

type View = 'chatList' | 'chat' | 'newChat' | 'storyViewer';

const generateId = (): string => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

const CommunityHub: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>('chatList');
    const [chats, setChats] = useState<TelegramChat[]>([]);
    const [stories, setStories] = useState<TelegramStory[]>([]);
    const [selectedChat, setSelectedChat] = useState<TelegramChat | null>(null);
    const [messages, setMessages] = useState<TelegramMessage[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    // New chat modal state
    const [newChatType, setNewChatType] = useState<ChatType>('private');
    const [newChatName, setNewChatName] = useState('');
    const [newChatDesc, setNewChatDesc] = useState('');

    // Message input state
    const [messageInput, setMessageInput] = useState('');
    const [replyingTo, setReplyingTo] = useState<TelegramMessage | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    // Story creation state
    const [showStoryCreator, setShowStoryCreator] = useState(false);
    const [storyCaption, setStoryCaption] = useState('');
    const [storyFile, setStoryFile] = useState<File | null>(null);
    const [storyPreview, setStoryPreview] = useState<string | null>(null);

    // User management
    const [showUsernameModal, setShowUsernameModal] = useState(false);
    const [usernameInput, setUsernameInput] = useState('');
    const [userProfiles, setUserProfiles] = useState<Record<string, string>>({});

    const currentUserId = userService.getUserId();
    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const storyFileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        refreshData();
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
        if (selectedChat) {
            const chatMessages = telegramService.getMessagesByChat(selectedChat.id);
            setMessages(chatMessages);
            telegramService.markChatAsRead(selectedChat.id);

            // Mark all messages as read
            chatMessages.forEach(msg => {
                telegramService.markMessageAsRead(msg.id);
            });

            scrollToBottom();
        }
    }, [selectedChat]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const refreshData = () => {
        setChats(telegramService.getAllChats());
        setStories(telegramService.getAllStories());
    };

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSetUsername = () => {
        if (usernameInput.trim()) {
            userService.setUserName(usernameInput.trim());
            setUserProfiles(userService.getAllUserProfiles());
            setShowUsernameModal(false);
        }
    };

    const handleCreateChat = () => {
        if (!newChatName.trim()) return;

        const chat = telegramService.createChat(
            newChatType,
            newChatName.trim(),
            [], // Start with no other participants
            newChatDesc.trim()
        );

        setNewChatName('');
        setNewChatDesc('');
        setCurrentView('chatList');
        refreshData();
    };

    const handleSelectChat = (chat: TelegramChat) => {
        setSelectedChat(chat);
        setCurrentView('chat');
    };

    const handleSendMessage = () => {
        if (!messageInput.trim() || !selectedChat) return;

        telegramService.sendMessage(
            selectedChat.id,
            'text',
            messageInput.trim(),
            replyingTo?.id
        );

        setMessageInput('');
        setReplyingTo(null);
        const updatedMessages = telegramService.getMessagesByChat(selectedChat.id);
        setMessages(updatedMessages);
        refreshData();
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedChat) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            telegramService.sendMessage(
                selectedChat.id,
                file.type.startsWith('image/') ? 'image' : 'file',
                base64,
                undefined,
                file.name,
                file.size
            );

            const updatedMessages = telegramService.getMessagesByChat(selectedChat.id);
            setMessages(updatedMessages);
            refreshData();
        };
        reader.readAsDataURL(file);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleAddReaction = (messageId: string, emoji: string) => {
        telegramService.addReaction(messageId, emoji);
        if (selectedChat) {
            const updatedMessages = telegramService.getMessagesByChat(selectedChat.id);
            setMessages(updatedMessages);
        }
    };

    const handleDeleteMessage = (messageId: string) => {
        if (window.confirm('هل تريد حذف هذه الرسالة؟')) {
            telegramService.deleteMessage(messageId);
            if (selectedChat) {
                const updatedMessages = telegramService.getMessagesByChat(selectedChat.id);
                setMessages(updatedMessages);
            }
            refreshData();
        }
    };

    const handleCreateStory = () => {
        if (!storyFile || !storyPreview) return;

        telegramService.createStory(
            storyPreview,
            storyFile.type.startsWith('image/') ? 'image' : 'video',
            storyCaption.trim()
        );

        setShowStoryCreator(false);
        setStoryFile(null);
        setStoryPreview(null);
        setStoryCaption('');
        refreshData();
    };

    const handleStoryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setStoryFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setStoryPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleViewStory = (story: TelegramStory) => {
        telegramService.viewStory(story.id);
        refreshData();
    };

    const filteredChats = searchQuery
        ? chats.filter(chat => chat.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : chats;

    const getUserName = (userId: string): string => {
        return userProfiles[userId] || `مستخدم ${userId.substring(0, 4)}`;
    };

    const formatTime = (timestamp: number): string => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - timestamp;

        if (diff < 60000) return 'الآن';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} د`;
        if (diff < 86400000) return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
        if (diff < 604800000) {
            const days = Math.floor(diff / 86400000);
            return days === 1 ? 'أمس' : `${days} أيام`;
        }
        return date.toLocaleDateString('ar-SA');
    };

    // ========================================
    // RENDER: USERNAME MODAL
    // ========================================

    if (showUsernameModal) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" dir="rtl">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">اختر اسم المستخدم</h2>
                    <input
                        type="text"
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSetUsername()}
                        placeholder="أدخل اسمك..."
                        className="w-full p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg mb-4"
                        autoFocus
                    />
                    <button
                        onClick={handleSetUsername}
                        disabled={!usernameInput.trim()}
                        className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:bg-gray-400 transition"
                    >
                        متابعة
                    </button>
                </div>
            </div>
        );
    }

    // ========================================
    // RENDER: STORY CREATOR MODAL
    // ========================================

    if (showStoryCreator) {
        return (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50" dir="rtl">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">إنشاء قصة</h2>
                        <button
                            onClick={() => {
                                setShowStoryCreator(false);
                                setStoryFile(null);
                                setStoryPreview(null);
                                setStoryCaption('');
                            }}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            ✕
                        </button>
                    </div>

                    <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleStoryFileChange}
                        ref={storyFileInputRef}
                        className="hidden"
                    />

                    {!storyPreview ? (
                        <button
                            onClick={() => storyFileInputRef.current?.click()}
                            className="w-full py-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-emerald-500 transition"
                        >
                            <CameraIcon className="w-12 h-12 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">اختر صورة أو فيديو</span>
                        </button>
                    ) : (
                        <div className="space-y-4">
                            <img src={storyPreview} alt="Preview" className="w-full rounded-lg max-h-64 object-cover" />
                            <input
                                type="text"
                                value={storyCaption}
                                onChange={(e) => setStoryCaption(e.target.value)}
                                placeholder="أضف تعليق (اختياري)..."
                                className="w-full p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleCreateStory}
                                    className="flex-1 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition"
                                >
                                    نشر القصة
                                </button>
                                <button
                                    onClick={() => {
                                        setStoryFile(null);
                                        setStoryPreview(null);
                                    }}
                                    className="px-6 py-3 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                                >
                                    تغيير
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ========================================
    // RENDER: NEW CHAT MODAL
    // ========================================

    if (currentView === 'newChat') {
        return (
            <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900" dir="rtl">
                <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setCurrentView('chatList')}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
                        >
                            ←
                        </button>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">محادثة جديدة</h2>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">نوع المحادثة</label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => setNewChatType('private')}
                                className={`p-3 rounded-lg text-center transition ${newChatType === 'private' ? 'bg-emerald-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
                            >
                                💬<br/>خاصة
                            </button>
                            <button
                                onClick={() => setNewChatType('group')}
                                className={`p-3 rounded-lg text-center transition ${newChatType === 'group' ? 'bg-emerald-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
                            >
                                👥<br/>مجموعة
                            </button>
                            <button
                                onClick={() => setNewChatType('channel')}
                                className={`p-3 rounded-lg text-center transition ${newChatType === 'channel' ? 'bg-emerald-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
                            >
                                📢<br/>قناة
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">الاسم</label>
                        <input
                            type="text"
                            value={newChatName}
                            onChange={(e) => setNewChatName(e.target.value)}
                            placeholder="اسم المحادثة..."
                            className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">الوصف (اختياري)</label>
                        <textarea
                            value={newChatDesc}
                            onChange={(e) => setNewChatDesc(e.target.value)}
                            placeholder="وصف المحادثة..."
                            rows={3}
                            className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg resize-none"
                        />
                    </div>

                    <button
                        onClick={handleCreateChat}
                        disabled={!newChatName.trim()}
                        className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:bg-gray-400 transition"
                    >
                        إنشاء المحادثة
                    </button>
                </div>
            </div>
        );
    }

    // ========================================
    // RENDER: CHAT VIEW
    // ========================================

    if (currentView === 'chat' && selectedChat) {
        return (
            <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900" dir="rtl">
                {/* Chat Header */}
                <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3 flex-shrink-0">
                    <button
                        onClick={() => {
                            setCurrentView('chatList');
                            setSelectedChat(null);
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
                    >
                        ←
                    </button>
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                        {selectedChat.name.charAt(0)}
                    </div>
                    <div className="flex-grow">
                        <h3 className="font-bold text-gray-900 dark:text-gray-100">{selectedChat.name}</h3>
                        {selectedChat.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">{selectedChat.description}</p>
                        )}
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-grow overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                            <UsersIcon className="w-16 h-16 mb-2 opacity-50" />
                            <p>لا توجد رسائل بعد</p>
                            <p className="text-sm">ابدأ المحادثة بإرسال رسالة</p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isOwn = msg.senderId === currentUserId;
                            const replyingToMsg = msg.replyToId ? messages.find(m => m.id === msg.replyToId) : null;

                            return (
                                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[75%] space-y-1`}>
                                        {!isOwn && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 px-2">{msg.senderName}</p>
                                        )}

                                        <div
                                            className={`p-3 rounded-2xl ${
                                                isOwn
                                                    ? 'bg-emerald-600 text-white rounded-br-none'
                                                    : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none'
                                            }`}
                                        >
                                            {replyingToMsg && (
                                                <div className="mb-2 pb-2 border-b border-white/20 dark:border-gray-600 text-xs opacity-75">
                                                    <p className="font-semibold">{replyingToMsg.senderName}</p>
                                                    <p className="truncate">{replyingToMsg.content.substring(0, 50)}</p>
                                                </div>
                                            )}

                                            {msg.type === 'text' && <p>{msg.content}</p>}
                                            {msg.type === 'image' && (
                                                <img src={msg.content} alt="صورة" className="rounded-lg max-w-full" />
                                            )}
                                            {msg.type === 'file' && (
                                                <div className="flex items-center gap-2">
                                                    <PaperclipIcon className="w-5 h-5" />
                                                    <div>
                                                        <p className="font-semibold">{msg.fileName}</p>
                                                        {msg.fileSize && <p className="text-xs">{(msg.fileSize / 1024).toFixed(1)} KB</p>}
                                                    </div>
                                                </div>
                                            )}
                                            {msg.type === 'location' && msg.location && (
                                                <div className="flex items-center gap-2">
                                                    <LocationMarkerIcon className="w-5 h-5" />
                                                    <span>{msg.location.name}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 px-2">
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {formatTime(msg.timestamp)}
                                                {msg.isEdited && ' • معدلة'}
                                            </span>

                                            {/* Reactions */}
                                            {msg.reactions.length > 0 && (
                                                <div className="flex gap-1">
                                                    {msg.reactions.map((reaction, idx) => (
                                                        <span key={idx} className="text-xs bg-gray-200 dark:bg-gray-600 px-1 rounded">
                                                            {reaction.emoji}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Actions */}
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => handleAddReaction(msg.id, '👍')}
                                                    className="text-xs hover:scale-125 transition"
                                                    title="إعجاب"
                                                >
                                                    👍
                                                </button>
                                                <button
                                                    onClick={() => handleAddReaction(msg.id, '❤️')}
                                                    className="text-xs hover:scale-125 transition"
                                                    title="حب"
                                                >
                                                    ❤️
                                                </button>
                                                <button
                                                    onClick={() => setReplyingTo(msg)}
                                                    className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                                    title="رد"
                                                >
                                                    ↩
                                                </button>
                                                {isOwn && (
                                                    <button
                                                        onClick={() => handleDeleteMessage(msg.id)}
                                                        className="text-xs text-red-500 hover:text-red-700"
                                                        title="حذف"
                                                    >
                                                        🗑️
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Input Bar */}
                <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 flex-shrink-0">
                    {replyingTo && (
                        <div className="mb-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg flex justify-between items-center">
                            <div>
                                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">الرد على {replyingTo.senderName}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{replyingTo.content.substring(0, 50)}</p>
                            </div>
                            <button
                                onClick={() => setReplyingTo(null)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="hidden"
                            accept="image/*,application/pdf,.doc,.docx"
                        />

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition"
                            title="إرفاق ملف"
                        >
                            <PaperclipIcon className="w-6 h-6" />
                        </button>

                        <input
                            type="text"
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="اكتب رسالة..."
                            className="flex-grow p-3 bg-gray-100 dark:bg-gray-700 border-none rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />

                        <button
                            onClick={handleSendMessage}
                            disabled={!messageInput.trim()}
                            className="p-3 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:bg-gray-400 transition"
                        >
                            ➤
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ========================================
    // RENDER: CHAT LIST (Main View)
    // ========================================

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900" dir="rtl">
            {/* Header */}
            <div className="bg-emerald-600 text-white p-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Telegram</h1>
                    <button
                        onClick={() => setShowStoryCreator(true)}
                        className="p-2 hover:bg-emerald-700 rounded-full transition"
                        title="إنشاء قصة"
                    >
                        <CameraIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Search */}
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث..."
                    className="w-full mt-3 p-2 bg-emerald-700/50 border-none rounded-full text-white placeholder-emerald-200 focus:outline-none focus:ring-2 focus:ring-white/30"
                />
            </div>

            {/* Stories Bar */}
            {stories.length > 0 && (
                <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3 flex gap-3 overflow-x-auto flex-shrink-0">
                    {stories.map(story => {
                        const isViewed = story.viewedBy.find(v => v.userId === currentUserId);
                        return (
                            <div
                                key={story.id}
                                onClick={() => handleViewStory(story)}
                                className="flex-shrink-0 cursor-pointer"
                            >
                                <div className={`w-16 h-16 rounded-full p-1 ${isViewed ? 'bg-gray-300 dark:bg-gray-600' : 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500'}`}>
                                    <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 p-0.5">
                                        <img
                                            src={story.mediaUrl}
                                            alt={story.userName}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-center mt-1 truncate w-16">{story.userName}</p>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Chat List */}
            <div className="flex-grow overflow-y-auto">
                {filteredChats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 p-8">
                        <UsersIcon className="w-20 h-20 mb-4 opacity-50" />
                        <p className="text-lg font-semibold">لا توجد محادثات</p>
                        <p className="text-sm text-center mt-2">ابدأ محادثة جديدة بالضغط على زر + في الأسفل</p>
                    </div>
                ) : (
                    filteredChats
                        .sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0))
                        .map(chat => {
                            const unreadCount = chat.unreadCount[currentUserId] || 0;

                            return (
                                <div
                                    key={chat.id}
                                    onClick={() => handleSelectChat(chat)}
                                    className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer transition"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                            {chat.name.charAt(0)}
                                        </div>

                                        <div className="flex-grow min-w-0">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                                    {chat.name}
                                                </h3>
                                                {chat.lastMessageTime && (
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                                                        {formatTime(chat.lastMessageTime)}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex justify-between items-center">
                                                <p className="text-sm text-gray-600 dark:text-gray-400 truncate flex-grow">
                                                    {chat.lastMessageText || 'لا توجد رسائل'}
                                                </p>
                                                {unreadCount > 0 && (
                                                    <span className="bg-emerald-600 text-white text-xs font-bold rounded-full px-2 py-0.5 flex-shrink-0 ml-2">
                                                        {unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                )}
            </div>

            {/* Floating New Chat Button */}
            <button
                onClick={() => setCurrentView('newChat')}
                className="fixed bottom-6 left-6 w-14 h-14 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 flex items-center justify-center transition hover:scale-110"
                title="محادثة جديدة"
            >
                <PlusIcon className="w-7 h-7" />
            </button>
        </div>
    );
};

export default CommunityHub;

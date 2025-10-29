import React, { useState, useEffect, useRef } from 'react';
import { TravelStory } from '../types';
import * as storyService from '../services/storyService';
import * as userService from '../services/userService';
import { LocationMarkerIcon } from './icons/LocationMarkerIcon';

interface StoryViewerProps {
  stories: TravelStory[];
  initialStoryIndex: number;
  onClose: () => void;
  currentUserId: string;
  userProfiles: Record<string, string>;
}

const STORY_DURATION = 5000; // 5 seconds per media
const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '👏', '🔥'];

const StoryViewer: React.FC<StoryViewerProps> = ({
  stories,
  initialStoryIndex,
  onClose,
  currentUserId,
  userProfiles
}) => {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showViewers, setShowViewers] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  const currentStory = stories[currentStoryIndex];
  const currentMedia = currentStory?.media[currentMediaIndex];
  const isOwnStory = currentStory?.authorId === currentUserId;

  // Mark story as viewed
  useEffect(() => {
    if (currentStory && !isOwnStory) {
      storyService.viewStory(currentStory.id, currentUserId);
    }
  }, [currentStory?.id, currentUserId, isOwnStory]);

  // Auto-advance media/story
  useEffect(() => {
    if (!currentStory || isPaused) return;

    const startProgress = () => {
      setProgress(0);
      let elapsed = 0;
      const interval = 50; // Update every 50ms

      progressIntervalRef.current = setInterval(() => {
        elapsed += interval;
        const newProgress = (elapsed / STORY_DURATION) * 100;
        setProgress(newProgress);

        if (newProgress >= 100) {
          clearInterval(progressIntervalRef.current!);
          handleNext();
        }
      }, interval);
    };

    startProgress();

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [currentStoryIndex, currentMediaIndex, isPaused]);

  const handleNext = () => {
    if (currentMediaIndex < currentStory.media.length - 1) {
      // Next media in current story
      setCurrentMediaIndex(prev => prev + 1);
      setProgress(0);
    } else if (currentStoryIndex < stories.length - 1) {
      // Next story
      setCurrentStoryIndex(prev => prev + 1);
      setCurrentMediaIndex(0);
      setProgress(0);
    } else {
      // End of stories
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentMediaIndex > 0) {
      // Previous media in current story
      setCurrentMediaIndex(prev => prev - 1);
      setProgress(0);
    } else if (currentStoryIndex > 0) {
      // Previous story (go to last media of previous story)
      setCurrentStoryIndex(prev => prev - 1);
      setCurrentMediaIndex(stories[currentStoryIndex - 1].media.length - 1);
      setProgress(0);
    }
  };

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = viewerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const threshold = rect.width / 3;

    if (x < threshold) {
      handlePrevious();
    } else if (x > threshold * 2) {
      handleNext();
    } else {
      // Middle tap - pause/play
      setIsPaused(prev => !prev);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;

    // Vertical swipe to close
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 100) {
      if (deltaY > 0) {
        onClose();
      }
      return;
    }

    // Horizontal swipe for story navigation
    if (Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        // Swipe right - previous story
        if (currentStoryIndex > 0) {
          setCurrentStoryIndex(prev => prev - 1);
          setCurrentMediaIndex(0);
          setProgress(0);
        }
      } else {
        // Swipe left - next story
        if (currentStoryIndex < stories.length - 1) {
          setCurrentStoryIndex(prev => prev + 1);
          setCurrentMediaIndex(0);
          setProgress(0);
        } else {
          onClose();
        }
      }
    }
  };

  const handleReaction = (emoji: string) => {
    storyService.reactToStory(currentStory.id, currentUserId, emoji);
    setShowReactions(false);
  };

  const handleDeleteStory = () => {
    if (window.confirm('هل أنت متأكد من حذف هذه القصة؟')) {
      storyService.deleteStory(currentStory.id, currentUserId);
      onClose();
    }
  };

  if (!currentStory || !currentMedia) {
    return null;
  }

  const userReaction = currentStory.reactions.find(r => r.userId === currentUserId);

  return (
    <div
      ref={viewerRef}
      className="fixed inset-0 bg-black z-50 flex flex-col"
      onClick={handleTap}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-20">
        {currentStory.media.map((_, index) => (
          <div key={index} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all"
              style={{
                width: index < currentMediaIndex ? '100%' : index === currentMediaIndex ? `${progress}%` : '0%'
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-4 pt-6 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold">
            {(userProfiles[currentStory.authorId] || 'M')[0].toUpperCase()}
          </div>
          <div>
            <p className="text-white font-semibold text-sm">
              {userProfiles[currentStory.authorId] || 'مسافر'}
            </p>
            <div className="flex items-center gap-1 text-white/80 text-xs">
              <LocationMarkerIcon className="w-3 h-3" />
              <span>{currentStory.location.city}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isPaused && (
            <div className="text-white text-xs bg-black/50 px-2 py-1 rounded">
              متوقف
            </div>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="text-white hover:bg-white/20 p-2 rounded-full transition"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Media content */}
      <div className="flex-grow flex items-center justify-center">
        {currentMedia.type === 'image' ? (
          <img
            src={currentMedia.data}
            alt="Story"
            className="max-w-full max-h-full object-contain"
            draggable={false}
          />
        ) : (
          <video
            src={currentMedia.data}
            className="max-w-full max-h-full object-contain"
            autoPlay
            muted
            playsInline
            onEnded={handleNext}
          />
        )}
      </div>

      {/* Caption */}
      {currentStory.caption && (
        <div className="absolute bottom-20 left-4 right-4 z-20">
          <p className="text-white text-sm bg-black/50 px-3 py-2 rounded-lg backdrop-blur-sm">
            {currentStory.caption}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between z-20">
        {isOwnStory ? (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowViewers(true);
              }}
              className="flex items-center gap-2 text-white bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="text-sm">{currentStory.viewers.length}</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteStory();
              }}
              className="text-white bg-red-500/80 px-4 py-2 rounded-full backdrop-blur-sm hover:bg-red-600"
            >
              حذف
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              {currentStory.reactions.length > 0 && (
                <div className="flex items-center gap-1 text-white bg-black/50 px-3 py-2 rounded-full backdrop-blur-sm">
                  {Array.from(new Set(currentStory.reactions.map(r => r.emoji))).slice(0, 3).map((emoji, i) => (
                    <span key={i} className="text-sm">{emoji}</span>
                  ))}
                  <span className="text-xs ml-1">{currentStory.reactions.length}</span>
                </div>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowReactions(true);
              }}
              className="text-white bg-black/50 p-3 rounded-full backdrop-blur-sm hover:bg-black/70"
            >
              {userReaction ? (
                <span className="text-xl">{userReaction.emoji}</span>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </button>
          </>
        )}
      </div>

      {/* Reactions modal */}
      {showReactions && (
        <div
          className="absolute inset-0 bg-black/50 flex items-end justify-center z-30 animate-fade-in"
          onClick={(e) => {
            e.stopPropagation();
            setShowReactions(false);
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-t-3xl p-6 w-full max-w-md animate-slide-up">
            <h3 className="text-center text-lg font-bold mb-4">اختر رد فعل</h3>
            <div className="flex justify-around">
              {REACTION_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReaction(emoji);
                  }}
                  className="text-4xl hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Viewers modal */}
      {showViewers && (
        <div
          className="absolute inset-0 bg-black/50 flex items-end justify-center z-30 animate-fade-in"
          onClick={(e) => {
            e.stopPropagation();
            setShowViewers(false);
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-t-3xl p-6 w-full max-w-md max-h-96 overflow-y-auto animate-slide-up">
            <h3 className="text-center text-lg font-bold mb-4">
              المشاهدون ({currentStory.viewers.length})
            </h3>
            <div className="space-y-3">
              {currentStory.viewers.map(viewerId => (
                <div key={viewerId} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold">
                    {(userProfiles[viewerId] || 'M')[0].toUpperCase()}
                  </div>
                  <span className="font-medium">{userProfiles[viewerId] || `مستخدم ${viewerId.substring(0, 4)}`}</span>
                </div>
              ))}
              {currentStory.viewers.length === 0 && (
                <p className="text-center text-gray-500 py-4">لم يشاهد أحد هذه القصة بعد</p>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default StoryViewer;

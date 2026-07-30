const fs = require('fs');

const eventCardMediaAndToolbar = `      {/* Admin Floating Control Toolbar */}
      {user?.isAdmin && (
        <div className="absolute top-14 left-4 right-4 z-30 flex flex-wrap gap-2 justify-end pointer-events-none">
          <div className="pointer-events-auto flex flex-wrap gap-2 bg-neutral-950/40 p-1.5 rounded-2xl backdrop-blur-md border border-white/10 shadow-xl">
            {/* Position Display */}
            <div 
              className="flex h-9 px-3 items-center justify-center rounded-xl bg-neutral-950/80 border border-amber-500/50 text-[11px] font-black text-amber-400 font-mono shadow-md select-all"
              title={lang === 'ar' ? 'الترتيب في الصفحة والموضع' : 'Page order & position'}
            >
              #{index !== undefined ? index + 1 : ''}
              {event.position !== undefined && event.position !== 999999 && event.position !== 0 && (
                <span className="text-[10px] text-neutral-400 font-bold ml-1">
                  ({event.position})
                </span>
              )}
              {index === undefined && (event.position === undefined || event.position === 999999 || event.position === 0) && '-'}
            </div>
            {/* Creator Profile Button */}
            {event.creatorId && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setAdminSelectedUserId(event.creatorId!);
                  setActiveTab('admin');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-md transition-all border border-purple-500/30 hover:scale-105 active:scale-95 cursor-pointer"
                title={lang === 'ar' ? 'عرض ملف منشئ الإعلان' : 'View Ad Creator Profile'}
              >
                <User className="h-4.5 w-4.5 stroke-[2.5]" />
              </button>
            )}
            {/* Pause / Resume button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                togglePauseEvent(event.id);
              }}
              className={\`flex h-9 w-9 items-center justify-center rounded-xl shadow-md transition-all border hover:scale-105 active:scale-95 cursor-pointer \${
                event.isPaused 
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/30' 
                  : 'bg-amber-500 hover:bg-amber-400 text-neutral-950 border-amber-400/30'
              }\`}
              title={event.isPaused 
                ? (lang === 'ar' ? 'إعادة تشغيل الإعلان' : 'Resume Ad') 
                : (lang === 'ar' ? 'إيقاف مؤقت للإعلان' : 'Pause Ad')
              }
            >
              {event.isPaused ? <Play className="h-4.5 w-4.5 fill-current" /> : <Pause className="h-4.5 w-4.5 fill-current" />}
            </button>
            {/* Edit button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setEditingEvent(event);
                setActiveTab('edit_ad_admin');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-all border border-blue-500/30 hover:scale-105 active:scale-95 cursor-pointer"
              title={lang === 'ar' ? 'تعديل الإعلان' : 'Edit Ad'}
            >
              <Edit className="h-4.5 w-4.5 stroke-[2.5]" />
            </button>
            {/* Delete button (triggers local confirm) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setShowDeleteConfirm(true);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-md transition-all border border-red-500/30 hover:scale-105 active:scale-95 cursor-pointer"
              title={lang === 'ar' ? 'حذف الإعلان نهائياً' : 'Delete Ad Permanently'}
            >
              <Trash2 className="h-4.5 w-4.5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}

      {/* Banner Media Section (Video or Image) */}
      <div className={\`relative w-full overflow-hidden bg-neutral-950 transition-all duration-500 \${aspectRatioClass}\`}>
        {/* Paused Overlay with 'X' mark */}
        {event.isPaused && (
          <div className="absolute inset-0 z-20 bg-neutral-950/80 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600/20 text-red-500 border border-red-500/40 shadow-xl">
              <span className="text-2xl font-black font-sans leading-none">X</span>
            </div>
            <span className="text-xs font-extrabold text-red-400 uppercase tracking-wider px-2.5 py-1 bg-red-950/60 border border-red-800/40 rounded-lg">
              {lang === 'ar' ? 'موقوف مؤقتاً' : 'Temporarily Paused'}
            </span>
          </div>
        )}
        {isGoogleDriveUrl(event.mediaUrl) ? (
          <iframe
            src={getGoogleDrivePreviewUrl(event.mediaUrl) || event.mediaUrl}
            className="h-full w-full border-0 bg-neutral-950"
            allow="autoplay; encrypted-media; picture-in-picture"
            referrerPolicy="no-referrer"
          />
        ) : getSafePlayableVideoUrl(event.mediaUrl) ? (
          <video
            ref={videoRef}
            src={getSafePlayableVideoUrl(event.mediaUrl)}
            poster={event.thumbnailUrl || undefined}
            playsInline
            muted={isMuted}
            loop
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onLoadedMetadata={(e) => {
              const video = e.currentTarget;
              if (video.videoHeight > video.videoWidth) {
                setAspectRatioClass('aspect-[9/16] max-h-[500px] sm:max-h-[550px]');
              } else {
                setAspectRatioClass('aspect-[16/10]');
              }
            }}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <img
            src={event.mediaUrl}
            alt={lang === 'ar' ? event.titleAr : event.titleEn}
            onLoad={(e) => {
              const img = e.currentTarget;
              if (img.naturalHeight > img.naturalWidth) {
                setAspectRatioClass('aspect-[9/16] max-h-[500px] sm:max-h-[550px]');
              } else {
                setAspectRatioClass('aspect-[16/10]');
              }
            }}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 card-gradient pointer-events-none" />
      </div>`;

const promoMediaAndToolbar = `      {/* Admin Floating Control Toolbar */}
      {user?.isAdmin && (
        <div className="absolute top-14 left-4 right-4 z-30 flex flex-wrap gap-2 justify-end pointer-events-none">
          <div className="pointer-events-auto flex flex-wrap gap-2 bg-neutral-950/40 p-1.5 rounded-2xl backdrop-blur-md border border-white/10 shadow-xl">
            {/* Position Display */}
            <div 
              className="flex h-9 px-3 items-center justify-center rounded-xl bg-neutral-950/80 border border-amber-500/50 text-[11px] font-black text-amber-400 font-mono shadow-md select-all"
              title={lang === 'ar' ? 'الموضع والترتيب' : 'Placement position'}
            >
              #{promoEvent.position && promoEvent.position !== 999999 ? promoEvent.position : 1}
            </div>

            {/* Creator Profile Button */}
            {promoEvent.creatorId && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setAdminSelectedUserId(promoEvent.creatorId!);
                  setActiveTab('admin');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-md transition-all border border-purple-500/30 hover:scale-105 active:scale-95 cursor-pointer"
                title={lang === 'ar' ? 'عرض ملف منشئ الإعلان' : 'View Ad Creator Profile'}
              >
                <User className="h-4.5 w-4.5 stroke-[2.5]" />
              </button>
            )}

            {/* Pause / Resume button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                togglePauseEvent(promoEvent.id);
              }}
              className={\`flex h-9 w-9 items-center justify-center rounded-xl shadow-md transition-all border hover:scale-105 active:scale-95 cursor-pointer \${
                promoEvent.isPaused 
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/30' 
                  : 'bg-amber-500 hover:bg-amber-400 text-neutral-950 border-amber-400/30'
              }\`}
              title={promoEvent.isPaused 
                ? (lang === 'ar' ? 'إعادة تشغيل الإعلان' : 'Resume Ad') 
                : (lang === 'ar' ? 'إيقاف مؤقت للإعلان' : 'Pause Ad')
              }
            >
              {promoEvent.isPaused ? <Play className="h-4.5 w-4.5 fill-current" /> : <Pause className="h-4.5 w-4.5 fill-current" />}
            </button>

            {/* Edit button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setEditingEvent(promoEvent);
                setActiveTab('edit_ad_admin');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-all border border-blue-500/30 hover:scale-105 active:scale-95 cursor-pointer"
              title={lang === 'ar' ? 'تعديل الإعلان' : 'Edit Ad'}
            >
              <Edit className="h-4.5 w-4.5 stroke-[2.5]" />
            </button>

            {/* Delete button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setShowDeleteConfirm(true);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-md transition-all border border-red-500/30 hover:scale-105 active:scale-95 cursor-pointer"
              title={lang === 'ar' ? 'حذف الإعلان' : 'Delete Ad'}
            >
              <Trash2 className="h-4.5 w-4.5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}

      {/* Media Player Container (Video/Image) */}
      <div className={\`relative w-full overflow-hidden bg-neutral-950 transition-all duration-500 \${aspectRatioClass}\`}>
        {/* Paused Overlay with 'X' mark */}
        {promoEvent.isPaused && (
          <div className="absolute inset-0 z-20 bg-neutral-950/80 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600/20 text-red-500 border border-red-500/40 shadow-xl">
              <span className="text-2xl font-black font-sans leading-none">X</span>
            </div>
            <span className="text-xs font-extrabold text-red-400 uppercase tracking-wider px-2.5 py-1 bg-red-950/60 border border-red-800/40 rounded-lg">
              {lang === 'ar' ? 'موقوف مؤقتاً' : 'Temporarily Paused'}
            </span>
          </div>
        )}
        {isGoogleDriveUrl(promoEvent.mediaUrl) ? (
          <iframe
            src={getGoogleDrivePreviewUrl(promoEvent.mediaUrl) || promoEvent.mediaUrl}
            className="h-full w-full border-0 bg-neutral-950"
            allow="autoplay; encrypted-media; picture-in-picture"
            referrerPolicy="no-referrer"
          />
        ) : getSafePlayableVideoUrl(promoEvent.mediaUrl) ? (
          <video
            ref={videoRef}
            src={getSafePlayableVideoUrl(promoEvent.mediaUrl)}
            poster={promoEvent.thumbnailUrl || undefined}
            playsInline
            muted={isMuted}
            loop
            autoPlay
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onLoadedMetadata={(e) => {
              const video = e.currentTarget;
              if (video.videoHeight > video.videoWidth) {
                setAspectRatioClass('aspect-[9/16] max-h-[500px] sm:max-h-[600px]');
              } else {
                setAspectRatioClass('aspect-[16/10] sm:aspect-video');
              }
            }}
            className="h-full w-full object-cover"
          />
        ) : (
          <img
            src={promoEvent.mediaUrl}
            alt={lang === 'ar' ? promoEvent.titleAr : promoEvent.titleEn}
            onLoad={(e) => {
              const img = e.currentTarget;
              if (img.naturalHeight > img.naturalWidth) {
                setAspectRatioClass('aspect-[9/16] max-h-[500px] sm:max-h-[600px]');
              } else {
                setAspectRatioClass('aspect-[16/10] sm:aspect-video');
              }
            }}
            className="h-full w-full object-cover"
          />
        )}
        {/* Play/Pause Button overlay */}
        {getSafePlayableVideoUrl(promoEvent.mediaUrl) && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (videoRef.current) {
                if (isPlaying) {
                  videoRef.current.pause();
                } else {
                  videoRef.current.play().catch(console.error);
                }
              }
            }}
            className="absolute inset-0 z-10 flex items-center justify-center bg-black/10 opacity-0 hover:opacity-100 transition-opacity cursor-pointer group/play"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-950/80 text-white backdrop-blur-md border border-white/10 group-hover/play:scale-110 transition-transform">
              {isPlaying ? <Pause className="h-8 w-8 fill-current" /> : <Play className="h-8 w-8 fill-current ml-1" />}
            </div>
          </button>
        )}
        {/* Mute/Unmute Button overlay */}
        {getSafePlayableVideoUrl(promoEvent.mediaUrl) && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (videoRef.current) {
                videoRef.current.muted = !videoRef.current.muted;
                setIsMuted(videoRef.current.muted);
              }
            }}
            className="absolute bottom-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-950/80 text-white backdrop-blur-md border border-white/10 hover:scale-110 transition-transform"
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
        )}
        {/* Fullscreen Button overlay */}
        {getSafePlayableVideoUrl(promoEvent.mediaUrl) && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsFullscreenVideoOpen(true);
            }}
            className="absolute bottom-4 right-16 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-950/80 text-white backdrop-blur-md border border-white/10 hover:scale-110 transition-transform"
            title={lang === 'ar' ? 'تكبير الفيديو' : 'Fullscreen Video'}
          >
            <Maximize2 className="h-4.5 w-4.5" />
          </button>
        )}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent opacity-80" />
      </div>`;

// Apply to EventCard
let eventCardContent = fs.readFileSync('src/components/events/EventCard.tsx', 'utf8');
const eventCardTarget = `        <div className="mb-4">`;
eventCardContent = eventCardContent.replace(eventCardTarget, eventCardMediaAndToolbar + '\n' + eventCardTarget);
fs.writeFileSync('src/components/events/EventCard.tsx', eventCardContent);

// Apply to WeeklyPromoBanner
let promoContent = fs.readFileSync('src/components/events/WeeklyPromoBanner.tsx', 'utf8');
const promoTarget = `        <div className="mb-3.5">`;
promoContent = promoContent.replace(promoTarget, promoMediaAndToolbar + '\n' + promoTarget);
fs.writeFileSync('src/components/events/WeeklyPromoBanner.tsx', promoContent);

console.log('done recovering media and horizontal toolbar');

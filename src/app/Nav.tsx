'use client';

import { clsx } from 'clsx/lite';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import AppGrid from '../components/AppGrid';
import AppViewSwitcher, { SwitcherSelection } from '@/app/AppViewSwitcher';
import {
  PATH_ROOT,
  isPathAdmin,
  isPathFeed,
  isPathGrid,
  isPathProtected,
  isPathSignIn,
} from '@/app/paths';
import AnimateItems from '../components/AnimateItems';
import {
  GRID_HOMEPAGE_ENABLED,
  NAV_CAPTION,
} from './config';
import { useRef, useState, useEffect } from 'react';
import useStickyNav from './useStickyNav';
import { FaPlay, FaPause, FaStepBackward, FaStepForward, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

// Define the interface for a track
interface Track {
  title: string;
  src: string;
}

const initialPlaylist: Track[] = [
  { title: 'Ifeellibys', src: 'https://msos0t2ncxflgtb5.public.blob.vercel-storage.com/music/Ifeellibys-CPfHiYeumxJVkLQ2c9yLbqgx3quzZs.mp3' },
  { title: 'Ifeellibys 2', src: 'https://msos0t2ncxflgtb5.public.blob.vercel-storage.com/music/Ifeellibys%202-IwYzWDjjWtNzyvz0TtHVmoxB7Okpz6.mp3' },
  { title: 'Ifeellibys 3', src: 'https://msos0t2ncxflgtb5.public.blob.vercel-storage.com/music/Ifeellibys%203-vGsvQr4pwxOv69ZaHMWsaY4h1QBNOw.mp3' },
  { title: 'Ifeellibys 4', src: 'https://msos0t2ncxflgtb5.public.blob.vercel-storage.com/music/Ifeellibys%204-wnUswzQdc4qpyZLgThw3xk94WhXER8.mp3' },
  { title: 'Ifeellibys 5', src: 'https://msos0t2ncxflgtb5.public.blob.vercel-storage.com/music/Ifeellibys%205-6jhJZxT9gkJGGfoNkJA743CO2rj0wJ.mp3' }
];

const NAV_HEIGHT_CLASS = NAV_CAPTION
  ? 'min-h-[4rem] sm:min-h-[5rem]'
  : 'min-h-[4rem]';

export default function Nav({
  navTitleOrDomain,
}: {
  navTitleOrDomain: string;
}) {
  const ref = useRef<HTMLElement>(null);

  const pathname = usePathname();
  const showNav = !isPathSignIn(pathname);

  const {
    classNameStickyContainer,
    classNameStickyNav,
  } = useStickyNav(ref);

  // Custom Music Player State
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playlist, setPlaylist] = useState<Track[]>(initialPlaylist);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isMounted, setIsMounted] = useState(false); // State to track client mount

  useEffect(() => {
    setIsMounted(true); // Set to true once component is mounted on client
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Effect for initial load and when currentTrackIndex changes
  useEffect(() => {
    if (audioRef.current && playlist.length > 0 && playlist[currentTrackIndex]) {
      const track = playlist[currentTrackIndex];
      // Only update src and load if it's different to prevent unnecessary reloads
      if (audioRef.current.src !== track.src) {
        audioRef.current.src = track.src;
        audioRef.current.load(); // Important for the browser to pick up the new src
      }

      if (isPlaying) {
        audioRef.current.play().catch(error => {
          console.error("Error playing track:", error);
          // setIsPlaying(false); // Optionally set to false if play fails
        });
      }
    }
    // Adding playlist as a dependency in case it changes dynamically in the future.
  }, [currentTrackIndex, playlist, isPlaying]);

  // Attempt initial autoplay (once on mount if playlist is available)
  useEffect(() => {
    if (audioRef.current && playlist.length > 0 && currentTrackIndex === 0 && !isPlaying) {
      // Ensure src is set for the very first track before attempting to play
      if (audioRef.current.src !== playlist[0].src) {
          audioRef.current.src = playlist[0].src;
          audioRef.current.load();
      }
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(error => {
        console.warn("Initial autoplay was prevented. User interaction might be needed or enable muted autoplay.", error);
        // Optionally, try muted autoplay:
        // if (audioRef.current) {
        //   audioRef.current.muted = true;
        //   setIsMuted(true);
        //   audioRef.current.play().then(() => setIsPlaying(true)).catch(e => console.error("Muted autoplay failed", e));
        // }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlist]); // Runs when playlist is first populated (or changes, though unlikely for initialPlaylist)

  const togglePlayPause = () => {
    if (audioRef.current && playlist.length > 0) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        // Ensure src is set before playing, especially if it's the first play action
        if (audioRef.current.src !== playlist[currentTrackIndex].src) {
            audioRef.current.src = playlist[currentTrackIndex].src;
            audioRef.current.load();
        }
        audioRef.current.play().catch(error => console.error("Error playing audio:", error));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleNextTrack = () => {
    if (playlist.length === 0) return;
    setCurrentTrackIndex((prevIndex) => (prevIndex + 1) % playlist.length);
  };

  const handlePreviousTrack = () => {
    if (playlist.length === 0) return;
    setCurrentTrackIndex((prevIndex) => (prevIndex - 1 + playlist.length) % playlist.length);
  };

  const renderLink = (
    text: string,
    linkOrAction: string | (() => void),
  ) =>
    typeof linkOrAction === 'string'
      ? <Link href={linkOrAction}>{text}</Link>
      : <button onClick={linkOrAction}>{text}</button>;

  const switcherSelectionForPath = (): SwitcherSelection | undefined => {
    if (pathname === PATH_ROOT) {
      return GRID_HOMEPAGE_ENABLED ? 'grid' : 'feed';
    } else if (isPathGrid(pathname)) {
      return 'grid';
    } else if (isPathFeed(pathname)) {
      return 'feed';
    } else if (isPathProtected(pathname)) {
      return 'admin';
    }
  };

  return (
    <AppGrid
      className={classNameStickyContainer}
      classNameMain='pointer-events-auto'
      contentMain={
        <AnimateItems
          animateOnFirstLoadOnly
          type={!isPathAdmin(pathname) ? 'bottom' : 'none'}
          distanceOffset={10}
          items={showNav
            ? [<nav
              key="nav"
              ref={ref}
              className={clsx(
                'w-full flex items-center bg-main',
                NAV_HEIGHT_CLASS,
                // Enlarge nav to ensure it fully masks underlying content
                'md:w-[calc(100%+8px)] md:translate-x-[-4px] md:px-[4px]',
                classNameStickyNav,
              )}>
              <AppViewSwitcher
                currentSelection={switcherSelectionForPath()}
              />
              {/* Custom Music Player START */}
              {isMounted && playlist.length > 0 && (
                <div className="custom-music-player flex items-center mx-2 text-cyan-400">
                  <audio
                    ref={audioRef}
                    onEnded={handleNextTrack}
                  />
                  <button onClick={handlePreviousTrack} className="bg-transparent border-none p-1 focus:outline-none hover:text-cyan-300 transition-colors duration-150 ease-in-out group">
                    <FaStepBackward size={18} className="group-hover:drop-shadow-[0_0_8px_rgba(56,189,248,0.85)] transition-all duration-150 ease-in-out" />
                  </button>
                  <button onClick={togglePlayPause} className="bg-transparent border-none p-1 mx-1 focus:outline-none hover:text-cyan-300 transition-colors duration-150 ease-in-out group">
                    {isPlaying ? 
                      <FaPause size={18} className="group-hover:drop-shadow-[0_0_8px_rgba(56,189,248,0.85)] transition-all duration-150 ease-in-out" /> : 
                      <FaPlay size={18} className="group-hover:drop-shadow-[0_0_8px_rgba(56,189,248,0.85)] transition-all duration-150 ease-in-out" />}
                  </button>
                  <button onClick={handleNextTrack} className="bg-transparent border-none p-1 focus:outline-none hover:text-cyan-300 transition-colors duration-150 ease-in-out group">
                    <FaStepForward size={18} className="group-hover:drop-shadow-[0_0_8px_rgba(56,189,248,0.85)] transition-all duration-150 ease-in-out" />
                  </button>
                  <div 
                    className="min-w-[100px] max-w-[200px] text-xs mx-2 hidden sm:block overflow-hidden text-ellipsis whitespace-nowrap hover:overflow-visible hover:whitespace-normal hover:bg-black/20 hover:p-1 hover:rounded transition-all duration-150"
                    title={playlist[currentTrackIndex]?.title}
                  >
                    {playlist[currentTrackIndex]?.title || 'No Track'}
                  </div>
                  <button onClick={toggleMute} className="bg-transparent border-none p-1 ml-1 focus:outline-none hover:text-cyan-300 transition-colors duration-150 ease-in-out group">
                    {isMuted ? 
                      <FaVolumeMute size={18} className="group-hover:drop-shadow-[0_0_8px_rgba(56,189,248,0.85)] transition-all duration-150 ease-in-out" /> : 
                      <FaVolumeUp size={18} className="group-hover:drop-shadow-[0_0_8px_rgba(56,189,248,0.85)] transition-all duration-150 ease-in-out" />}
                  </button>
                </div>
              )}
              {/* Custom Music Player END */}
              <div className={clsx(
                'grow text-right min-w-0',
                'hidden xs:block',
                'translate-y-[-1px]',
              )}>
                <div className="truncate overflow-hidden select-none">
                  {renderLink(navTitleOrDomain, PATH_ROOT)}
                </div>
                {NAV_CAPTION &&
                  <div className={clsx(
                    'hidden sm:block truncate overflow-hidden',
                    'leading-tight text-dim',
                    'lowercase'
                  )}>
                    {NAV_CAPTION}
                  </div>}
              </div>
            </nav>]
            : []}
        />
      }
      sideHiddenOnMobile
    />
  );
};

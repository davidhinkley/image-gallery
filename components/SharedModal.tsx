import {
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  ArrowUturnLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useSwipeable } from "react-swipeable";
import downloadPhoto from "../utils/downloadPhoto";
import { range } from "../utils/range";
import type { ImageProps, SharedModalProps } from "../utils/types";
import BlueSky from "./Icons/BlueSky";

export default function SharedModal({
  index,
  images,
  changePhotoId,
  closeModal,
  navigation,
  currentPhoto,
}: SharedModalProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');

  // Get the filtered images for the thumbnail carousel
  const filteredImages = images?.filter((img: ImageProps) =>
    range(images && index - 15, index + 15).includes(img.id),
  ) || [];

  // Set up swipe handlers for mobile navigation
  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (images && index < images.length - 1) {
        changePhotoId(index + 1);
      }
    },
    onSwipedRight: () => {
      if (index > 0) {
        changePhotoId(index - 1);
      }
    },
    trackMouse: true,
    preventScrollOnSwipe: true,
  });

  // Determine which image to display
  // First try to find the image with the matching ID
  const currentImage = images
    ? (images.find(img => img.id === index) || images[index] || currentPhoto)
    : currentPhoto;

  // Set the image URL when the component mounts or when currentImage changes
  useEffect(() => {
    if (currentImage && currentImage.path) {
      console.log("Current image path:", currentImage.path);

      // Make sure we're using the absolute URL with the domain
      // For local images that start with "/images/", we need to ensure they're properly resolved
      let fullPath = currentImage.path;

      if (!fullPath.startsWith('http')) {
        // For local images, ensure the path starts with a slash
        if (!fullPath.startsWith('/')) {
          fullPath = '/' + fullPath;
        }

        // Add the origin for client-side rendering
        if (typeof window !== 'undefined') {
          fullPath = window.location.origin + fullPath;
        }
      }

      console.log("Full image path:", fullPath);

      setImageUrl(fullPath);
      // Initially show loading state
      setLoaded(false);
      setError(false);

      // Preload the image to check if it loads correctly
      if (typeof window !== 'undefined') {
        const imgElement = new window.Image();
        imgElement.src = fullPath;
        imgElement.onload = () => {
          console.log("Image loaded successfully:", fullPath);
          setLoaded(true);
        };
        imgElement.onerror = (e) => {
          console.error(`Failed to preload image: ${fullPath}`, e);
          setError(true);
          setLoaded(true); // Set loaded to true so error message is displayed
        };
      }
    }
  }, [currentImage]);

  // Handle image load error
  const handleImageError = () => {
    console.error(`Failed to load image: ${imageUrl}`);
    setError(true);
    setLoaded(true); // Still mark as loaded so UI controls appear
  };

  // Generate share URL for social media
  const getShareUrl = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/p/${index}`;
  };

  // Generate BlueSky post text
  const getBlueSkyText = () => {
    return `Check out this beautiful image from my gallery!%0A%0A${getShareUrl()}`;
  };

  return (
    <div
      className="relative z-50 flex aspect-[3/2] w-full max-w-7xl items-center wide:h-full xl:taller-than-854:h-auto"
      {...handlers}
      aria-live="polite"
    >
      {/* Main image */}
      <div className="w-full overflow-hidden">
        <div className="relative flex aspect-[3/2] items-center justify-center">
          <div
            key={index}
            className="absolute"
          >
                {error ? (
                  <div className="flex h-full w-full items-center justify-center bg-black text-white">
                    <div className="text-center p-4">
                      <p className="text-xl mb-2">Failed to load image</p>
                      <p className="text-sm text-gray-400">The image could not be loaded. Please check if the file exists.</p>
                      <p className="text-xs mt-2 text-gray-500">Path: {currentImage?.path || 'No path available'}</p>
                      <div className="mt-4">
                        <button
                          onClick={() => {
                            // Try to reload the image
                            setError(false);
                            setLoaded(false);

                            // Force a re-render with a slight delay
                            setTimeout(() => {
                              if (currentImage && currentImage.path) {
                                const fullPath = currentImage.path.startsWith('http')
                                  ? currentImage.path
                                  : `${typeof window !== 'undefined' ? window.location.origin : ''}${currentImage.path.startsWith('/') ? '' : '/'}${currentImage.path}`;

                                console.log("Retrying with path:", fullPath);

                                // Create a new image element to test loading
                                const testImg = new Image();
                                testImg.src = fullPath;
                                testImg.onload = () => {
                                  console.log("Image loaded on retry");
                                  setLoaded(true);
                                  setError(false);
                                };
                                testImg.onerror = () => {
                                  console.error("Image failed to load on retry");
                                  setError(true);
                                  setLoaded(true);
                                };
                              }
                            }, 500);
                          }}
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md text-white transition"
                        >
                          Retry Loading
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative h-full w-full bg-black">
                    {/* Loading indicator */}
                    {!loaded && (
                      <div className="absolute inset-0 z-5 flex items-center justify-center">
                        <div className="text-white text-center">
                          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                          <p className="mt-2">Loading image...</p>
                        </div>
                      </div>
                    )}

                    {/* Main image - centered with black background */}
                    <div className="absolute inset-0 z-10 flex items-center justify-center">
                      {currentImage?.path ? (
                        // Use a direct img tag with improved error handling and display
                        <img
                            src={currentImage.path}
                            alt={currentImage?.filename ? `Image: ${currentImage.filename}` : `Gallery image ${index}`}
                            className={`max-h-[80vh] max-w-full object-contain transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                            onLoad={() => {
                              console.log("Image loaded successfully:", currentImage.path);
                              setLoaded(true);
                              setError(false);
                            }}
                            onError={(e) => {
                              console.error("Image failed to load:", currentImage.path, e);

                              // Try with a different approach - direct URL without leading slash
                              const imgElement = e.target as HTMLImageElement;
                              const directPath = currentImage.path.replace(/^\//, '');
                              console.log("Trying with direct path:", directPath);
                              imgElement.src = directPath;

                              // If that fails too, try with the full URL including origin
                              imgElement.onerror = () => {
                                if (typeof window !== 'undefined') {
                                  const fullPath = window.location.origin + (currentImage.path.startsWith('/') ? currentImage.path : '/' + currentImage.path);
                                  console.log("Trying with full URL:", fullPath);
                                  imgElement.src = fullPath;

                                  // If that also fails, mark as error
                                  imgElement.onerror = () => {
                                    setError(true);
                                    setLoaded(true);
                                  };
                                } else {
                                  setError(true);
                                  setLoaded(true);
                                }
                              };
                            }}
                            style={{
                              maxHeight: "calc(100vh - 120px)",
                              maxWidth: "calc(100vw - 60px)",
                              display: loaded && !error ? "block" : "none"
                            }}
                          />
                      ) : (
                        <div className="text-white text-center">
                          <p>No image path available</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
          </div>
        </div>

        {/* Buttons + bottom nav bar */}
        <div className="absolute inset-0 mx-auto flex max-w-7xl items-center justify-center">
          {/* Buttons - always show controls */}
          <div className="relative aspect-[3/2] max-h-full w-full">
            {navigation && (
              <>
                {index > 0 && (
                  <button
                    className="absolute left-3 top-[calc(50%-16px)] rounded-full bg-black/50 p-3 text-white/75 backdrop-blur-lg transition hover:bg-black/75 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                    style={{ transform: "translate3d(0, 0, 0)" }}
                    onClick={() => changePhotoId(index - 1)}
                    aria-label="Previous image"
                  >
                    <ChevronLeftIcon className="h-6 w-6" />
                  </button>
                )}
                {images && index + 1 < images?.length && filteredImages.length > 0 && (
                  <button
                    className="absolute right-3 top-[calc(50%-16px)] rounded-full bg-black/50 p-3 text-white/75 backdrop-blur-lg transition hover:bg-black/75 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                    style={{ transform: "translate3d(0, 0, 0)" }}
                    onClick={() => changePhotoId(index + 1)}
                    aria-label="Next image"
                  >
                    <ChevronRightIcon className="h-6 w-6" />
                  </button>
                )}
              </>
            )}
              <div className="absolute top-0 right-0 flex items-center gap-2 p-3 text-white z-50">
                {navigation ? (
                  <a
                    href={currentImage?.path || ''}
                    className="rounded-full bg-black/50 p-2 text-white/75 backdrop-blur-lg transition hover:bg-black/75 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                    target="_blank"
                    title="Open fullsize version"
                    rel="noreferrer"
                    aria-label="Open full size image in new tab"
                  >
                    <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                  </a>
                ) : (
                  <a
                    href={`https://bsky.app/intent/compose?text=${getBlueSkyText()}`}
                    className="rounded-full bg-black/50 p-2 text-white/75 backdrop-blur-lg transition hover:bg-black/75 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                    target="_blank"
                    title="Share on BlueSky"
                    rel="noreferrer"
                    aria-label="Share on BlueSky"
                  >
                    <BlueSky className="h-5 w-5" />
                  </a>
                )}
                <button
                  onClick={() =>
                    downloadPhoto(
                      currentImage?.path || '',
                      currentImage?.filename || `image-${index}.${currentImage?.format || 'jpg'}`
                    )
                  }
                  className="rounded-full bg-black/50 p-2 text-white/75 backdrop-blur-lg transition hover:bg-black/75 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                  title="Download fullsize version"
                  aria-label="Download image"
                  disabled={!currentImage?.path}
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="absolute top-0 left-0 flex items-center gap-2 p-3 text-white z-50">
                <button
                  onClick={() => closeModal()}
                  className="rounded-full bg-black/50 p-2 text-white/75 backdrop-blur-lg transition hover:bg-black/75 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                  aria-label="Close modal"
                >
                  {navigation ? (
                    <XMarkIcon className="h-5 w-5" />
                  ) : (
                    <ArrowUturnLeftIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {/* Removed filename display */}
            </div>
          {/* Bottom Nav bar - always visible */}
          {navigation && filteredImages.length > 0 && (
            <div className="fixed inset-x-0 bottom-0 z-40 overflow-hidden bg-black">
              <div 
                className="mx-auto mt-6 mb-6 flex aspect-[3/2] h-14"
              >
                  {filteredImages.map(({ path, format, id, filename }) => (
                    <button
                      onClick={() => changePhotoId(id)}
                      key={id}
                      className={`relative inline-block mx-1 h-12 w-16 flex-shrink-0 overflow-hidden rounded ${
                        id === index
                          ? "z-20 rounded-md shadow shadow-black/50 ring-2 ring-white"
                          : "z-10 rounded-md opacity-50 hover:opacity-75"
                      } ${id === 0 ? "rounded-l-md" : ""} ${
                        id === images?.length - 1 ? "rounded-r-md" : ""
                      } transform-gpu focus:outline-none`}
                      aria-label={filename ? `View image: ${filename}` : `View image ${id + 1}`}
                      aria-current={id === index ? "true" : "false"}
                    >
                      <div className="relative h-full w-full bg-gray-900">
                        {/* No background image for thumbnails */}

                        <Image
                          alt={`Thumbnail ${id}`}
                          width={180}
                          height={120}
                          className={`${
                            id === index
                              ? "brightness-110 hover:brightness-110"
                              : "brightness-50 contrast-125 hover:brightness-75"
                          } relative z-10 h-full transform transition`}
                          src={path || ''}
                          quality={100}
                          unoptimized={true}
                          onError={(e) => {
                            // Handle thumbnail load error
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
  );
}

import Image from "next/image";
import { useRouter } from "next/router";
import useKeypress from "react-use-keypress";
import type { ImageProps } from "../utils/types";
import { useLastViewedPhoto } from "../utils/useLastViewedPhoto";
import SharedModal from "./SharedModal";
import { useState, useEffect } from "react";

export default function Carousel({
  index,
  currentPhoto,
  images,
}: {
  index: number;
  currentPhoto: ImageProps;
  images?: ImageProps[];
}) {
  const router = useRouter();
  const [, setLastViewedPhoto] = useLastViewedPhoto();
  const [direction, setDirection] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  function closeModal() {
    setLastViewedPhoto(currentPhoto.id);
    router.push("/", undefined, { shallow: true });
  }

  function changePhotoId(newVal: number) {
    if (images && images.length > 0) {
      // If we have images array, navigate to the new image
      if (newVal > index) {
        setDirection(1);
      } else {
        setDirection(-1);
      }

      // Find the image with the matching ID
      const targetImage = images.find(img => img.id === newVal);

      // If we found the image, use its ID, otherwise use the array index
      const targetId = targetImage ? targetImage.id : newVal;

      // Log for debugging
      console.log(`Changing to photo ID: ${targetId} (requested: ${newVal})`);

      // Update the URL to reflect the new photo ID
      router.push(
        {
          pathname: router.pathname,
          query: { ...router.query, photoId: targetId },
        },
        `/p/${targetId}`,
        { shallow: true }
      );
    }

    return newVal;
  }

  // Handle keyboard navigation
  useKeypress("Escape", () => {
    closeModal();
  });

  useKeypress("ArrowRight", () => {
    if (images && index + 1 < images.length) {
      changePhotoId(index + 1);
    }
  });

  useKeypress("ArrowLeft", () => {
    if (images && index > 0) {
      changePhotoId(index - 1);
    }
  });

  // Reset loaded state when currentPhoto changes
  useEffect(() => {
    setLoaded(false);
    setError(false);

    // Log the current photo details for debugging
    console.log("Current photo:", currentPhoto);
    if (currentPhoto) {
      console.log("Path:", currentPhoto.path);
      console.log("Filename:", currentPhoto.filename);
      console.log("Width:", currentPhoto.width);
      console.log("Height:", currentPhoto.height);

      // Preload the image to check if it loads correctly
      if (typeof window !== 'undefined') {
        const preloadImg = new Image();
        preloadImg.src = currentPhoto.path;

        // Set a timeout to check if the image is taking too long to load
        const timeoutId = setTimeout(() => {
          if (!loaded && !error) {
            console.warn("Image taking too long to load, might be too large:", currentPhoto.path);
            // We don't set error here, just log a warning
          }
        }, 5000); // 5 seconds timeout

        return () => {
          clearTimeout(timeoutId);
        };
      }
    }
  }, [currentPhoto, loaded, error]);

  // Direct image display approach
  return (
    <div className="fixed inset-0 flex items-center justify-center">
      {/* Background overlay */}
      <div className="absolute inset-0 z-30 bg-black" onClick={closeModal}></div>

      {/* Direct image display */}
      <div className="relative z-40 flex items-center justify-center max-w-7xl w-full h-full">
        {/* Navigation buttons */}
        {images && images.length > 1 && (
          <>
            {index > 0 && (
              <button
                className="absolute left-4 z-50 rounded-full bg-black/50 p-3 text-white/75"
                onClick={() => changePhotoId(index - 1)}
              >
                ← Prev
              </button>
            )}
            {index < images.length - 1 && (
              <button
                className="absolute right-4 z-50 rounded-full bg-black/50 p-3 text-white/75"
                onClick={() => changePhotoId(index + 1)}
              >
                Next →
              </button>
            )}
          </>
        )}

        {/* Close button */}
        <button
          className="absolute top-4 left-4 z-50 rounded-full bg-black/50 p-3 text-white/75"
          onClick={closeModal}
        >
          ✕ Close
        </button>

        {/* Image */}
        <div className="flex items-center justify-center h-full w-full pb-20">
          {!loaded && !error && (
            <div className="text-white text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
              <p className="mt-2">Loading image...</p>
            </div>
          )}

          {error && (
            <div className="text-white text-center p-4">
              <p className="text-xl mb-2">Failed to load image</p>
              <p className="text-sm text-gray-400">The image could not be loaded.</p>
              <button
                onClick={() => {
                  setError(false);
                  setLoaded(false);
                }}
                className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md text-white transition"
              >
                Retry
              </button>
            </div>
          )}

          {currentPhoto && (
            <>
              {/* Use a direct img tag for better performance with large images */}
              <img
                src={currentPhoto.path}
                alt={currentPhoto?.filename || `Image ${index + 1}`}
                className={`object-contain mx-auto transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                style={{
                  maxHeight: "calc(100vh - 120px)", // Full viewport height minus space for thumbnails and padding
                  maxWidth: "calc(100vw - 120px)", // Full viewport width minus space for navigation buttons
                  width: "auto",
                  height: "auto",
                  display: loaded && !error ? "block" : "none",
                  // Add these properties to help with large image loading
                  loading: "eager", // Force eager loading
                  decoding: "async" // Use async decoding for better performance
                }}
                onLoad={(e) => {
                  // Log image details for debugging
                  const img = e.target as HTMLImageElement;
                  console.log("Image loaded successfully:", currentPhoto.path);
                  console.log("Natural dimensions:", img.naturalWidth, "x", img.naturalHeight);
                  console.log("Display dimensions:", img.width, "x", img.height);
                  setLoaded(true);
                  setError(false);
                }}
                onError={(e) => {
                  console.error("Failed to load image:", currentPhoto.path);
                  const imgElement = e.target as HTMLImageElement;

                  // Try with the filename if path failed
                  if (currentPhoto.filename) {
                    const altPath = `/images/${currentPhoto.filename}`;
                    console.log("Trying with alternative path:", altPath);
                    imgElement.src = altPath;

                    // Set a new onError handler for the alternative path
                    imgElement.onerror = () => {
                      // Try with a direct path (no leading slash)
                      const directPath = currentPhoto.path.replace(/^\//, '');
                      console.log("Trying with direct path:", directPath);
                      imgElement.src = directPath;

                      // If that fails too, try with the full URL including origin
                      imgElement.onerror = () => {
                        if (typeof window !== 'undefined') {
                          const fullPath = window.location.origin + (currentPhoto.path.startsWith('/') ? currentPhoto.path : '/' + currentPhoto.path);
                          console.log("Trying with full URL:", fullPath);
                          imgElement.src = fullPath;

                          // If that also fails, mark as error
                          imgElement.onerror = () => {
                            console.error("All path attempts failed for:", currentPhoto.path);
                            setError(true);
                            setLoaded(true); // Set to true so error message is displayed
                          };
                        } else {
                          setError(true);
                          setLoaded(true);
                        }
                      };
                    };
                  } else {
                    setError(true);
                    setLoaded(true); // Set to true so error message is displayed
                  }
                }}
              />

              {/* Debug info - only visible in development */}
              {process.env.NODE_ENV === 'development' && !loaded && !error && (
                <div className="absolute bottom-24 left-4 text-xs text-white/50 bg-black/50 p-2 rounded">
                  Loading: {currentPhoto.path}<br />
                  Size: {currentPhoto.width} x {currentPhoto.height}<br />
                  Format: {currentPhoto.format}
                </div>
              )}
            </>
          )}
        </div>

        {/* Thumbnail carousel - add this to show thumbnails at the bottom */}
        {images && images.length > 1 && (
          <div className="fixed inset-x-0 bottom-0 z-40 overflow-hidden bg-black/70">
            <div className="mx-auto py-3 flex h-16 overflow-x-auto justify-center">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => changePhotoId(i)}
                  className={`relative mx-1 h-14 w-20 flex-shrink-0 overflow-hidden rounded ${
                    i === index
                      ? "ring-2 ring-white"
                      : "opacity-50 hover:opacity-75"
                  }`}
                  aria-label={`View image ${i + 1}`}
                >
                  <img
                    src={img.path}
                    alt={`Thumbnail ${i + 1}`}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      // Try with the filename if path failed
                      if (img.filename) {
                        target.src = `/images/${img.filename}`;
                        // If that fails too, hide the image
                        target.onerror = () => {
                          target.style.display = 'none';
                        };
                      } else {
                        target.style.display = 'none';
                      }
                    }}
                  />
                  {i === index && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
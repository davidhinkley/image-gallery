import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import Modal from "../components/Modal";
import { getLocalImages } from "../utils/localImages";
import getLocalBase64ImageUrl from "../utils/generateLocalBlurPlaceholder";
import type { ImageProps } from "../utils/types";
import { useLastViewedPhoto } from "../utils/useLastViewedPhoto";

interface HomeProps {
  images: ImageProps[];
}

const Home: NextPage<HomeProps> = ({ images }) => {
  const router = useRouter();
  const { photoId } = router.query;
  const [lastViewedPhoto, setLastViewedPhoto] = useLastViewedPhoto();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showFixedLogo, setShowFixedLogo] = useState<boolean>(false);

  const lastViewedPhotoRef = useRef<HTMLAnchorElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // This effect keeps track of the last viewed photo in the modal to keep the index page in sync when the user navigates back
    if (lastViewedPhoto && !photoId) {
      lastViewedPhotoRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      setLastViewedPhoto(null);
    }

    // Set loading to false after initial render
    setIsLoading(false);
  }, [lastViewedPhoto, photoId]);

  useEffect(() => {
    // Add scroll event listener to show/hide fixed logo
    const handleScroll = () => {
      if (logoRef.current) {
        const logoPosition = logoRef.current.getBoundingClientRect().bottom;
        setShowFixedLogo(logoPosition < 0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle case where there are no images
  const hasImages = images && images.length > 0;

  return (
    <>
      <Head>
        <title>Local Image Gallery with Next.js</title>
        <meta name="description" content="A beautiful image gallery built with Next.js" />
        <meta property="og:image" content="/images/og-image.jpg" />
        <meta name="bsky:image" content="/images/og-image.jpg" />
        <meta property="og:title" content="Local Image Gallery with Next.js" />
        <meta property="og:description" content="A beautiful image gallery built with Next.js" />
        <meta name="bsky:card" content="summary_large_image" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Fixed position logo that appears when scrolling */}
      {showFixedLogo && (
        <div className="fixed bottom-4 right-4 z-50 opacity-50">
          <Image
            src="/image_gallery-dark.png"
            alt="Image Gallery"
            width={80}
            height={60}
            className="rounded-lg"
            priority
            unoptimized={true}
          />
        </div>
      )}

      <main className="mx-auto max-w-[1960px] px-4 pt-4 pb-4">
        {photoId && hasImages && (
          <Modal
            images={images}
            onClose={() => {
              setLastViewedPhoto(photoId);
            }}
          />
        )}

        {/* Image Gallery */}
        <div className="columns-1 gap-4 sm:columns-2 xl:columns-3 2xl:columns-4">
          {/* Logo and Title - First item in gallery */}
          <div ref={logoRef} className="mb-5 p-4 pt-12 pb-12 flex flex-col items-center justify-center text-center bg-transparent">
            <Image
              src="/image_gallery-dark.png"
              alt="Image Gallery"
              width={338}
              height={250}
              className="max-w-full rounded-lg"
              priority
              unoptimized={true}
            />
            <p className="mt-4 text-xl italic text-white w-full max-w-[338px] text-center leading-tight">
              Built with Next.js
            </p>
          </div>
          {hasImages ? (
            images.map(({ id, path, format, blurDataUrl, filename, width, height }) => (
              <Link
                key={id}
                href={`/?photoId=${id}`}
                as={`/p/${id}`}
                ref={id === Number(lastViewedPhoto) ? lastViewedPhotoRef : null}
                shallow
                className="after:content group relative mb-5 block w-full cursor-zoom-in after:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:shadow-highlight"
                aria-label={filename ? `View ${filename}` : `View image ${id + 1}`}
              >
                <div className="relative aspect-[3/2] w-full overflow-hidden rounded-lg">
                  {/* Background version of the image - no blur */}
                  <div
                    className="absolute inset-0 z-0 scale-105 opacity-30"
                    style={{
                      backgroundImage: `url(${path})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />

                  {/* Main image */}
                  <div className="absolute inset-0 z-10 flex items-center justify-center">
                    <Image
                      alt={filename ? `Image: ${filename}` : `Gallery image ${id + 1}`}
                      className="max-h-full max-w-full object-contain transform transition will-change-auto group-hover:brightness-110"
                      style={{ transform: "translate3d(0, 0, 0)" }}
                      src={path}
                      width={width ? parseInt(width) : 720}
                      height={height ? parseInt(height) : 480}
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, (max-width: 1536px) 33vw, 25vw"
                      quality={90} // Reduced quality to improve loading performance
                      unoptimized={false} // Let Next.js optimize the images
                      priority={id < 4} // Prioritize loading the first few images
                      onError={(e) => {
                        console.error("Failed to load thumbnail image:", path);
                        const target = e.target as HTMLImageElement;

                        // Try with a direct path (no leading slash)
                        const directPath = path.replace(/^\//, '');
                        console.log("Trying thumbnail with direct path:", directPath);
                        target.src = directPath;

                        // If that fails too, show error placeholder
                        target.onerror = () => {
                          console.error("All thumbnail path attempts failed for:", path);
                          target.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                          target.alt = 'Failed to load image';

                          // Create a container for the error message
                          const container = target.parentElement;
                          if (container) {
                            // Apply styles to the container
                            container.classList.add('bg-gray-800', 'rounded-lg', 'flex', 'items-center', 'justify-center');

                            // Create and append error text
                            const errorText = document.createElement('div');
                            errorText.textContent = 'Failed to load image';
                            errorText.className = 'text-white text-center p-4';

                            // Clear container and add error message
                            container.innerHTML = '';
                            container.appendChild(errorText);
                          }
                        };
                      }}
                    />
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full flex h-[400px] items-center justify-center rounded-lg bg-white/10 p-6 text-center text-white">
              <div>
                <h2 className="mb-4 text-xl font-bold">No Images Found</h2>
                <p>
                  Add images to the <code className="rounded bg-black/20 px-2 py-1">/public/images</code> directory to see them here.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="p-6 text-center text-white/80 sm:p-12">
        <p className="text-xl">
          &copy; 2025 Local Image Gallery
        </p>
      </footer>
    </>
  );
};

export default Home;

export async function getStaticProps() {
  try {
    // Get all images from the local directory
    const images = await getLocalImages();

    if (!images || images.length === 0) {
      console.log('No images found in the directory');
      return {
          props: {
          images: [],
          },
            revalidate: 60, // Revalidate more frequently if no images found
      };
    }

    // We're not using blur placeholders anymore, so we'll skip generating them
    // This will help with large images that were causing issues
    for (let i = 0; i < images.length; i++) {
      // Set a transparent placeholder instead
      images[i].blurDataUrl = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    }

    return {
      props: {
        images,
      },
      // Revalidate every hour to pick up new images
      revalidate: 3600,
    };
  } catch (error) {
    console.error('Error in getStaticProps:', error);
    return {
      props: {
        images: [],
      },
      revalidate: 60,
    };
  }
}
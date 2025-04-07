import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import Carousel from "../../components/Carousel";
import { getCachedLocalImages } from "../../utils/localImages";
import getLocalBase64ImageUrl from "../../utils/generateLocalBlurPlaceholder";
import type { ImageProps } from "../../utils/types";

interface PhotoPageProps {
  currentPhoto: ImageProps;
  images: ImageProps[];
}

const PhotoPage: NextPage<PhotoPageProps> = ({ currentPhoto, images }) => {
  const router = useRouter();
  const { photoId } = router.query;
  const index = Number(photoId);

  // Use the local image path for meta tags
  const currentPhotoUrl = currentPhoto.path || '';
  const title = `Image ${index + 1} - Local Image Gallery`;
  const description = `Viewing image ${index + 1} of ${images.length} in the gallery`;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={currentPhotoUrl} />
        <meta name="bsky:card" content="summary_large_image" />
        <meta name="bsky:title" content={title} />
        <meta name="bsky:description" content={description} />
        <meta name="bsky:image" content={currentPhotoUrl} />
      </Head>
      <main className="mx-auto max-w-[1960px] p-4">
        <Carousel
          currentPhoto={currentPhoto}
          index={index}
          images={images}
        />
      </main>
    </>
  );
};

export default PhotoPage;

export const getStaticProps: GetStaticProps = async (context) => {
  try {
    // Get all images from the local directory
    const images = await getCachedLocalImages();

    // Get the photo ID from the URL
    const photoId = context.params?.photoId;
    if (!photoId || Array.isArray(photoId)) {
      return { notFound: true };
    }

    // Find the current photo by ID
    const currentPhoto = images.find(
      (img) => img.id === Number(photoId)
    );

    if (!currentPhoto) {
      return { notFound: true };
    }

    // We're not using blur placeholders anymore, so we'll skip generating them
    // This will help with large images that were causing issues

    // Set transparent placeholder for current photo
    currentPhoto.blurDataUrl = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    // Set transparent placeholders for all images
    images.forEach(img => {
      img.blurDataUrl = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    });

    return {
      props: {
        currentPhoto,
        images,
      },
      // Revalidate every hour to pick up new images
      revalidate: 3600,
    };
  } catch (error) {
    console.error('Error in getStaticProps:', error);
    return { notFound: true };
  }
};

export async function getStaticPaths() {
  try {
    // Get all images from the local directory
    const images = await getCachedLocalImages();

    // Create paths for each image
    const paths = images.map((image) => ({
      params: { photoId: image.id.toString() },
    }));

    return {
      paths,
      fallback: 'blocking', // Generate new pages if they don't exist yet
    };
  } catch (error) {
    console.error('Error in getStaticPaths:', error);
    return {
      paths: [],
      fallback: 'blocking',
    };
  }
}
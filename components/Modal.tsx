import { Dialog } from "@headlessui/react";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import useKeypress from "react-use-keypress";
import type { ImageProps } from "../utils/types";
import SharedModal from "./SharedModal";

export default function Modal({
  images,
  onClose,
}: {
  images: ImageProps[];
  onClose: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { photoId } = router.query;
  const index = Number(photoId);
  const [direction, setDirection] = useState(0);
  const [curIndex, setCurIndex] = useState(index);

  // Validate the index and find the correct image
  useEffect(() => {
    // If the photoId is invalid, redirect to the first image
    if (isNaN(index) || index < 0 || index >= images.length) {
      console.error('Invalid photo ID:', photoId);
      router.replace(
        {
          query: { photoId: 0 },
        },
        `/p/0`,
        { shallow: true }
      );
      return;
    }

    // Verify that the image at this index has the correct ID
    const imageAtIndex = images[index];
    if (imageAtIndex && imageAtIndex.id !== index) {
      console.warn(`Image index mismatch: Expected ID ${index} but found ID ${imageAtIndex.id}`);

      // Find the image with the matching ID
      const correctIndex = images.findIndex(img => img.id === index);
      if (correctIndex !== -1 && correctIndex !== index) {
        console.log(`Correcting index: Using image at position ${correctIndex} instead of ${index}`);
        setCurIndex(correctIndex);
      }
    }
  }, [photoId, index, images, router]);

  function handleClose() {
    router.push("/", undefined, { shallow: true });
    onClose();
  }

  function changePhotoId(newVal: number) {
    // Validate the new index
    if (newVal < 0 || newVal >= images.length) {
      console.error('Invalid photo ID:', newVal);
      return;
    }

    // Set the direction for animation
    if (newVal > curIndex) {
      setDirection(1);
    } else {
      setDirection(-1);
    }

    // Update the current index
    setCurIndex(newVal);

    // Update the URL
    router.push(
      {
        query: { photoId: newVal },
      },
      `/p/${newVal}`,
      { shallow: true }
    );
  }

  // Handle keyboard navigation
  useKeypress("ArrowRight", () => {
    if (curIndex + 1 < images.length) {
      changePhotoId(curIndex + 1);
    }
  });

  useKeypress("ArrowLeft", () => {
    if (curIndex > 0) {
      changePhotoId(curIndex - 1);
    }
  });

  useKeypress("Escape", () => {
    handleClose();
  });

  return (
    <Dialog
      static
      open={true}
      onClose={handleClose}
      initialFocus={overlayRef}
      className="fixed inset-0 z-10 flex items-center justify-center"
    >
      <Dialog.Overlay
        ref={overlayRef}
        key="backdrop"
        className="fixed inset-0 z-30 bg-black"
        aria-hidden="true"
      />

      <Dialog.Title className="sr-only">
        Image Gallery - Photo {curIndex + 1} of {images.length}
      </Dialog.Title>

      <Dialog.Description className="sr-only">
        Use arrow keys to navigate between images. Press Escape to close the gallery.
      </Dialog.Description>

      <SharedModal
        index={curIndex}
        direction={direction}
        images={images}
        changePhotoId={changePhotoId}
        closeModal={handleClose}
        navigation={true}
      />
    </Dialog>
  );
}
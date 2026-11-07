"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { dragHasFiles, pickDroppedImage, type ImageDropNotice } from "@/lib/utils/image-drop";

const NOTICE_MS = 4000;

interface UseImageDropOptions {
  /** Off while submitting or when uploads are off: drops are then only kept from the browser */
  enabled: boolean;
  maxSize: number;
  onFile: (file: File) => void;
}

/**
 * Attach an image by dropping it on a zone. While mounted it also keeps file
 * drops anywhere else on the page from making the browser open the file,
 * which would throw away what is being written.
 */
export function useImageDrop({ enabled, maxSize, onFile }: UseImageDropOptions) {
  const [isDragging, setIsDragging] = useState(false);
  const [notice, setNotice] = useState<ImageDropNotice | null>(null);
  // dragenter/dragleave also fire for every child crossed
  const depthRef = useRef(0);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onFileRef = useRef(onFile);
  useEffect(() => {
    onFileRef.current = onFile;
  }, [onFile]);

  const showNotice = useCallback((next: ImageDropNotice | null) => {
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    setNotice(next);
    noticeTimerRef.current = next ? setTimeout(() => setNotice(null), NOTICE_MS) : null;
  }, []);

  useEffect(
    () => () => {
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    },
    []
  );

  // Outside the zone (or with it off): refuse the drop instead of opening the file
  useEffect(() => {
    const guard = (e: DragEvent) => {
      if (e.defaultPrevented || !dragHasFiles(e.dataTransfer)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "none";
    };
    const reset = () => {
      depthRef.current = 0;
      setIsDragging(false);
    };
    window.addEventListener("dragover", guard);
    window.addEventListener("drop", guard);
    window.addEventListener("drop", reset);
    window.addEventListener("dragend", reset);
    return () => {
      window.removeEventListener("dragover", guard);
      window.removeEventListener("drop", guard);
      window.removeEventListener("drop", reset);
      window.removeEventListener("dragend", reset);
    };
  }, []);

  const onDragEnter = useCallback(
    (e: React.DragEvent) => {
      if (!enabled || !dragHasFiles(e.dataTransfer)) return;
      e.preventDefault();
      depthRef.current += 1;
      setIsDragging(true);
    },
    [enabled]
  );

  const onDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!enabled || !dragHasFiles(e.dataTransfer)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    },
    [enabled]
  );

  const onDragLeave = useCallback(
    (e: React.DragEvent) => {
      if (!enabled || !dragHasFiles(e.dataTransfer)) return;
      depthRef.current = Math.max(0, depthRef.current - 1);
      if (depthRef.current === 0) setIsDragging(false);
    },
    [enabled]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      if (!enabled || !dragHasFiles(e.dataTransfer)) return;
      e.preventDefault();
      depthRef.current = 0;
      setIsDragging(false);
      const { file, notice: next } = pickDroppedImage(Array.from(e.dataTransfer.files), maxSize);
      if (file) onFileRef.current(file);
      showNotice(next);
    },
    [enabled, maxSize, showNotice]
  );

  return {
    dropZoneProps: { onDragEnter, onDragOver, onDragLeave, onDrop },
    // Turned off mid-drag (e.g. submitting): hide the overlay; the window
    // drop/dragend handlers reset the count once the drag ends
    isDragging: enabled && isDragging,
    notice,
  };
}

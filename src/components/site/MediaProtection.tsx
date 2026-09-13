'use client';

// Deters casual saving of product photos and videos: blocks right-click /
// long-press save menus and image dragging on public pages. This is a
// deterrent, not true protection — browsers must download media to display
// it — but it stops the easy copy paths.

import { useEffect } from 'react';

export default function MediaProtection() {
  useEffect(() => {
    function onContextMenu(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'IMG' || target.tagName === 'VIDEO')) {
        e.preventDefault();
      }
    }
    function onDragStart(e: DragEvent) {
      const target = e.target as HTMLElement | null;
      if (target && target.tagName === 'IMG') e.preventDefault();
    }
    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('dragstart', onDragStart);
    return () => {
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('dragstart', onDragStart);
    };
  }, []);
  return null;
}

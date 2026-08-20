import { useRef, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import gsap from 'gsap';
import { Observer } from 'gsap/all';
import { clamp01 } from '../utils/mathUtils';

gsap.registerPlugin(Observer);

/**
 * useWorldProgress
 *
 * Generalizes the source engine's wheel/touch -> target -> lerp(current, target)
 * pattern (see useScrollCamera / useInfiniteCamera) into a single normalized
 * 0..1 progress value instead of a raw camera Z coordinate. This progress
 * value is what drives the House entry choreography: camera path, door
 * opening, lighting and content reveal all read the same `progress.current`.
 *
 * Scrolling forward increases progress toward 1 (deeper into the House).
 * Scrolling backward decreases it back toward 0 (back toward the world) and,
 * once past 0, calls onOverscrollExit so the caller can hand control back to
 * the world overview - guaranteeing the sequence is a single reversible
 * timeline rather than separate "enter" and "exit" animations.
 */
const useWorldProgress = ({ enabled, onOverscrollExit, speed = 0.0016, smoothing = 0.07 }) => {
  const target = useRef(0);
  const current = useRef(0);
  const overscroll = useRef(0);
  const locked = useRef(false);
  const tweenRef = useRef(null);

  useEffect(() => {
    if (!enabled) {
      tweenRef.current?.kill();
      locked.current = false;
      target.current = 0;
      current.current = 0;
      overscroll.current = 0;
      return;
    }

    const applyDelta = (deltaY) => {
      if (locked.current) {
        tweenRef.current?.kill();
        locked.current = false;
        target.current = current.current;
      }

      const next = target.current - deltaY * speed;
      if (next <= 0) {
        overscroll.current += Math.max(0, -next);
        target.current = 0;
        if (overscroll.current > 0.55) {
          overscroll.current = 0;
          onOverscrollExit?.();
        }
      } else {
        overscroll.current = 0;
        target.current = clamp01(next);
      }
    };

    const observer = Observer.create({
      target: window,
      type: 'wheel,touch,pointer',
      onWheel: (e) => applyDelta(e.deltaY),
      onDrag: (e) => {
        if (e.event.touches && e.event.touches.length) {
          applyDelta(-e.deltaY * 10);
        }
      },
    });

    return () => observer.kill();
  }, [enabled, speed, onOverscrollExit]);

  useFrame(() => {
    if (!enabled) return;
    current.current += (target.current - current.current) * smoothing;
  });

  const animateTo = useCallback((value, duration = 1.2, onComplete) => {
    tweenRef.current?.kill();
    locked.current = true;
    const proxy = { v: current.current };
    tweenRef.current = gsap.to(proxy, {
      v: value,
      duration,
      ease: 'power2.inOut',
      onUpdate: () => {
        current.current = proxy.v;
        target.current = proxy.v;
      },
      onComplete: () => {
        locked.current = false;
        onComplete?.();
      },
    });
  }, []);

  return { progress: current, animateTo };
};

export default useWorldProgress;

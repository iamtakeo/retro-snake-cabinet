import { useState, useEffect } from 'react';

export function useTouchDevice() {
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);

  useEffect(() => {
    const checkTouch = () => {
      return (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia('(pointer: coarse)').matches
      );
    };
    setIsTouchDevice(checkTouch());

    const handleTouch = () => {
      setIsTouchDevice(true);
      window.removeEventListener('touchstart', handleTouch);
    };
    window.addEventListener('touchstart', handleTouch);
    return () => {
      window.removeEventListener('touchstart', handleTouch);
    };
  }, []);

  return isTouchDevice;
}

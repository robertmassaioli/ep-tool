import { useEffect, useRef } from 'react';
import { isPresent } from 'ts-is-present';

export function useEffectAsync (
  callback, // : () => Promise<void>,
  dep// : Readonly<A | undefined>
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!isPresent(dep)) {
      callbackRef.current();
    }
  }, [dep]);
}

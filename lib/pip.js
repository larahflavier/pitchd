'use client';
// Lets any screen make Pip react without passing props around.
//   const pip = usePip();
//   pip.react('correct' | 'wrong' | 'combo' | 'combo5' | 'complete');
//   pip.cancel();   // for example when the user taps Next
// A Pip that should respond is drawn as <Mascot reactive />.
import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

// how long each reaction lasts, in ms. Quiz reactions stay under 700ms.
const LENGTH = { correct: 450, wrong: 600, combo: 600, combo5: 700, complete: 2600 };

const PipContext = createContext({ reaction: null, react() {}, cancel() {} });

export function PipProvider({ children }) {
  const [reaction, setReaction] = useState(null); // { type, id }
  const timer = useRef(null);
  const count = useRef(0);

  const cancel = useCallback(() => {
    clearTimeout(timer.current);
    setReaction(null);
  }, []);

  const react = useCallback((type) => {
    clearTimeout(timer.current);
    count.current += 1;
    setReaction({ type, id: count.current });
    timer.current = setTimeout(() => setReaction(null), LENGTH[type] || 500);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  const value = useMemo(() => ({ reaction, react, cancel }), [reaction, react, cancel]);
  return createElement(PipContext.Provider, { value }, children);
}

export function usePip() {
  const { react, cancel } = useContext(PipContext);
  return { react, cancel };
}

// used by the mascot itself
export function usePipReaction(enabled) {
  const { reaction } = useContext(PipContext);
  return enabled ? reaction : null;
}

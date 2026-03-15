import { useState, useEffect } from "react";
import { startAudioPreload, subscribeAudioPreload } from "../audioPreload";

export function useAudioPreload() {
  const [state, setState] = useState({ ready: false, progress: 0 });

  useEffect(() => {
    const unsub = subscribeAudioPreload(setState);
    startAudioPreload();
    return unsub;
  }, []);

  return state;
}

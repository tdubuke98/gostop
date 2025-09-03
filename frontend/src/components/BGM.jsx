import React, { useState, useEffect } from "react";
import Sound from "react-sound";

export default function BGM( {url, playing} ) {
  // this tech might be browser specific since there are different auto play rules for different browsers chat says
  const [volume, setVolume] = useState(0); // Start muted
  const [playStatus, setPlayStatus] = useState(Sound.status.PAUSED)

  useEffect(() => {
    const unmute = () => {
      setVolume(100); // Full volume
      setPlayStatus(Sound.status.PLAYING)
    };

    // Wait for first user interaction
    document.addEventListener("click", unmute, {once: true});

    return () => {
        document.removeEventListener("click", unmute);
      };
  }, []);
  
  useEffect(() => {
    if (playing) {
      setVolume(100); // Unmute if playing
    } else {
      setVolume(0); // Mute if not playing
    }
  }, [playing]);

  return (
      <Sound
        url={url}
        playStatus={playStatus}
        playFromPosition={0}
        autoLoad
        loop
        volume={volume} // Control volume here
      />
  );
}


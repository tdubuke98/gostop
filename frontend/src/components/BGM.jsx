import React, { useEffect, useState } from "react";
import ReactHowler from "react-howler";
import { useSettings } from "../context/SettingsContext";

export default function BGM({ url }) {
  const { muted } = useSettings();
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    setPlaying(true);
  }, []);

  return (
    <ReactHowler
      src={url}
      playing={playing}
      loop={true}
      volume={muted ? 0 : 1} // volume: 0.0–1.0
    />
  );
}

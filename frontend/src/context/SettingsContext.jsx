import React, { useContext, createContext, useState, useEffect } from "react";

export const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [muted, setMuted] = useState(false);
    
  return (
    <SettingsContext.Provider value={{ muted, setMuted }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);

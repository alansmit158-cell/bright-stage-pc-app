import React, { createContext, useState, useContext } from 'react';
import { translations } from '../utils/translations';
import axios from 'axios';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    // Force French as the only language
    const language = 'fr';

    const t = (key) => {
        return translations[language]?.[key] || key;
    };

    const API_URL = `http://${window.location.hostname}:5000/api`;

    const translateDynamic = async (text) => {
        // No translation needed for French as it's the base/only language now 
        // or we could keep it for dynamic server content if needed, but the user wants "only French"
        return text;
    };

    const changeLanguage = () => {
        // Disabled
    };

    return (
        <LanguageContext.Provider value={{ t, language, changeLanguage, translateDynamic }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);

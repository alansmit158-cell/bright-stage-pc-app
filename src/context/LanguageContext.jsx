import React, { createContext, useState, useContext } from 'react';
import { translations } from '../utils/translations';
import axios from 'axios';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState('fr');

    const t = (key) => {
        return translations[language]?.[key] || key;
    };

    const API_URL = `http://${window.location.hostname}:5000/api`;

    const translateDynamic = async (text) => {
        if (language === 'en') return text;

        try {
            const res = await axios.post(`${API_URL}/translate`, {
                text: text,
                targetLang: language
            });
            return res.data.translatedText;
        } catch (e) {
            console.error("Translation failed", e);
            return text;
        }
    };

    const changeLanguage = (lang) => {
        if (translations[lang]) {
            setLanguage(lang);
        }
    };

    return (
        <LanguageContext.Provider value={{ t, language, changeLanguage, translateDynamic }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);

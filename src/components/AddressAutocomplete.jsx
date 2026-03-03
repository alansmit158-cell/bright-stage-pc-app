import React, { useState, useEffect, useRef } from 'react';

const AddressAutocomplete = ({ value, onChange, placeholder, style }) => {
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [inputValue, setInputValue] = useState(value || '');
    const [isLoading, setIsLoading] = useState(false);
    const debounceTimer = useRef(null);
    const wrapperRef = useRef(null);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Update input value when prop changes
    useEffect(() => {
        setInputValue(value || '');
    }, [value]);

    const searchAddress = async (query) => {
        if (!query || query.length < 3) {
            setSuggestions([]);
            return;
        }

        setIsLoading(true);
        try {
            // Using OpenStreetMap Nominatim API (free, no key required)
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?` +
                `format=json&` +
                `q=${encodeURIComponent(query)}&` +
                `addressdetails=1&` +
                `limit=5&` +
                `countrycodes=tn,fr,us`, // Tunisia, France, USA
                {
                    headers: {
                        'Accept-Language': 'en'
                    }
                }
            );

            const data = await response.json();
            setSuggestions(data);
            setShowSuggestions(true);
        } catch (error) {
            console.error('Address search error:', error);
            setSuggestions([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const newValue = e.target.value;
        setInputValue(newValue);

        // Allow manual typing without triggering onChange immediately
        if (onChange) {
            onChange({ street: newValue });
        }

        // Debounce the API call
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(() => {
            searchAddress(newValue);
        }, 500); // Wait 500ms after user stops typing
    };

    const handleSelectSuggestion = (suggestion) => {
        const address = suggestion.address || {};

        // Extract address components
        const street = [
            address.house_number,
            address.road || address.street || address.pedestrian
        ].filter(Boolean).join(' ');

        const city = address.city || address.town || address.village || address.municipality || '';
        const postalCode = address.postcode || '';
        const country = address.country || '';

        // Update input display
        setInputValue(suggestion.display_name);
        setShowSuggestions(false);
        setSuggestions([]);

        // Call onChange with structured data
        if (onChange) {
            onChange({
                fullAddress: suggestion.display_name,
                street: street || suggestion.display_name.split(',')[0],
                city: city,
                postalCode: postalCode,
                country: country,
                lat: suggestion.lat,
                lng: suggestion.lon
            });
        }
    };

    return (
        <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
            <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true);
                }}
                placeholder={placeholder || "Start typing address..."}
                style={style}
            />

            {isLoading && (
                <div style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#aaa',
                    fontSize: 12
                }}>
                    Searching...
                </div>
            )}

            {showSuggestions && suggestions.length > 0 && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: '#2a2a2a',
                    border: '1px solid #555',
                    borderRadius: 4,
                    marginTop: 4,
                    maxHeight: 300,
                    overflowY: 'auto',
                    zIndex: 1000,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                }}>
                    {suggestions.map((suggestion, index) => (
                        <div
                            key={index}
                            onClick={() => handleSelectSuggestion(suggestion)}
                            style={{
                                padding: '10px 12px',
                                cursor: 'pointer',
                                borderBottom: index < suggestions.length - 1 ? '1px solid #444' : 'none',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#3a3a3a'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <div style={{ fontSize: 14, color: 'white', marginBottom: 4 }}>
                                📍 {suggestion.display_name.split(',').slice(0, 2).join(',')}
                            </div>
                            <div style={{ fontSize: 11, color: '#888' }}>
                                {suggestion.display_name}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AddressAutocomplete;

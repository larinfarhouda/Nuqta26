'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';
import { Search, MapPin } from 'lucide-react';
import { UseFormSetValue } from 'react-hook-form';

const libraries: ("places" | "marker")[] = ["places", "marker"];
const mapContainerStyle = { width: '100%', height: '100%' };

interface LocationPickerProps {
    setValue: UseFormSetValue<any>;
    initialLat?: number;
    initialLng?: number;
    className?: string;
}

// Custom component to handle AdvancedMarkerElement
const AdvancedMarker = ({ map, position, onDragEnd }: { map: google.maps.Map | null, position: google.maps.LatLngLiteral, onDragEnd: (lat: number, lng: number) => void }) => {
    const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

    useEffect(() => {
        if (!map) return;

        let marker: google.maps.marker.AdvancedMarkerElement | null = null;
        let listener: google.maps.MapsEventListener | null = null;

        const initMarker = async () => {
            try {
                // Dynamically import the marker library
                const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;

                marker = new AdvancedMarkerElement({
                    map,
                    position,
                    gmpDraggable: true,
                    title: "Drag to adjust location"
                });
                markerRef.current = marker;

                listener = marker.addListener('dragend', () => {
                    const pos = marker!.position;
                    if (pos) {
                        let lat: number, lng: number;
                        if (typeof (pos as any).lat === 'function') {
                            lat = (pos as google.maps.LatLng).lat();
                            lng = (pos as google.maps.LatLng).lng();
                        } else {
                            lat = (pos as google.maps.LatLngLiteral).lat;
                            lng = (pos as google.maps.LatLngLiteral).lng;
                        }
                        onDragEnd(lat, lng);
                    }
                });
            } catch (error) {
                console.error("Error loading AdvancedMarkerElement:", error);
            }
        };

        initMarker();

        return () => {
            if (marker) marker.map = null;
            if (listener) google.maps.event.removeListener(listener);
            markerRef.current = null;
        };
    }, [map]);

    useEffect(() => {
        if (markerRef.current) {
            markerRef.current.position = position;
        }
    }, [position]);

    return null;
};

const PlacesAutocomplete = ({ onSelect, handleCurrentLocation }: { onSelect: (lat: number, lng: number, address: string, placeDetails: any) => void, handleCurrentLocation: () => void }) => {
    const {
        ready,
        value,
        suggestions: { status, data },
        setValue,
        clearSuggestions,
    } = usePlacesAutocomplete({
        requestOptions: {},
        debounce: 300,
        initOnMount: true,
    });

    // We can expose setValue to let parent set address if reverse geocoded
    // But for now, just input handling. 
    // Wait, if map click reverse geocodes, we might want to update this input?
    // The previous implementation didn't strictly bind input to map click address, 
    // it just showed a separate label.
    // Let's keep it simple: this is for searching.

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value);
    };

    const handleSelect = async (address: string) => {
        setValue(address, false);
        clearSuggestions();

        try {
            const results = await getGeocode({ address });
            const { lat, lng } = await getLatLng(results[0]);
            onSelect(lat, lng, address, results[0]);
        } catch (error) {
            console.error("Error: ", error);
        }
    };

    return (
        <div className="absolute top-4 left-4 right-4 z-10 flex gap-2">
            <div className="relative shadow-lg rounded-xl flex-1">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    value={value}
                    onChange={handleInput}
                    disabled={!ready}
                    type="text"
                    placeholder="Search specific location..."
                    className="w-full h-10 pr-10 pl-4 bg-white rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900"
                    onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                />
                {status === "OK" && (
                    <ul className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 max-h-60 overflow-y-auto z-50">
                        {data.map(({ place_id, description }) => (
                            <li
                                key={place_id}
                                onClick={() => handleSelect(description)}
                                className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm border-b border-gray-50 last:border-none text-gray-900"
                            >
                                {description}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <button
                type="button"
                onClick={handleCurrentLocation}
                className="bg-white p-2 rounded-xl shadow-lg border border-gray-100 text-gray-600 hover:text-primary hover:bg-gray-50 transition-colors"
                title="Use Current Location"
            >
                <MapPin className="w-5 h-5" />
            </button>
        </div>
    );
};

export default function LocationPicker({ setValue, initialLat, initialLng, className = "h-[300px]" }: LocationPickerProps) {
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
        libraries,
    });

    const defaultCenter = { lat: 41.0082, lng: 28.9784 }; // Istanbul
    const [mapCenter, setMapCenter] = useState(defaultCenter);
    const [markerPos, setMarkerPos] = useState<google.maps.LatLngLiteral | null>(null);
    const [addressLabel, setAddressLabel] = useState<string>('');

    const mapRef = useRef<google.maps.Map | null>(null);
    const geocoderRef = useRef<google.maps.Geocoder | null>(null);

    useEffect(() => {
        if (initialLat && initialLng) {
            const pos = { lat: initialLat, lng: initialLng };
            setMapCenter(pos);
            setMarkerPos(pos);
        }
    }, [initialLat, initialLng]);

    const extractAddressComponents = (results: google.maps.GeocoderResult[]) => {
        if (!results[0]) return;
        const addressComponents = results[0].address_components;
        const formattedAddress = results[0].formatted_address;

        setAddressLabel(formattedAddress);

        let district = '';
        let city = '';
        let country = '';

        addressComponents.forEach(comp => {
            if (comp.types.includes('country')) country = comp.long_name;
            if (comp.types.includes('administrative_area_level_1')) city = comp.long_name;
            if (comp.types.includes('administrative_area_level_2')) district = comp.long_name;
        });

        // Fallbacks
        if (!city) {
            const locality = addressComponents.find(c => c.types.includes('locality'));
            if (locality) city = locality.long_name;
        }

        if (!district) {
            const sublocality = addressComponents.find(c => c.types.includes('sublocality') || c.types.includes('sublocality_level_1'));
            if (sublocality) district = sublocality.long_name;
            else {
                const neighborhood = addressComponents.find(c => c.types.includes('neighborhood'));
                if (neighborhood) district = neighborhood.long_name;
            }
        }

        setValue('district', district, { shouldValidate: true });
        setValue('city', city, { shouldValidate: true });
        setValue('country', country, { shouldValidate: true });
    };

    const handleGeocoding = (lat: number, lng: number) => {
        if (!geocoderRef.current) geocoderRef.current = new google.maps.Geocoder();
        geocoderRef.current.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results) extractAddressComponents(results);
        });
    };

    const onMapLoad = useCallback((map: google.maps.Map) => { mapRef.current = map; }, []);

    const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            setMarkerPos({ lat, lng });
            handleGeocoding(lat, lng);
        }
    }, [setValue]);

    const handleCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    const pos = { lat, lng };

                    setMapCenter(pos);
                    setMarkerPos(pos);
                    handleGeocoding(lat, lng);
                },
                () => {
                    alert("Error: The Geolocation service failed.");
                }
            );
        } else {
            alert("Error: Your browser doesn't support geolocation.");
        }
    };

    const onPlaceSelect = (lat: number, lng: number, address: string, placeDetails: any) => {
        setMapCenter({ lat, lng });
        setMarkerPos({ lat, lng });
        setAddressLabel(address);

        // usePlacesAutocomplete's placeDetails is compatible with extractAddressComponents if passed as array
        extractAddressComponents([placeDetails]);
    };

    const onMarkerDragEnd = (lat: number, lng: number) => {
        setMarkerPos({ lat, lng });
        handleGeocoding(lat, lng);
    };

    if (loadError) return <div>خطأ في تحميل الخرائط</div>;

    return (
        <div className="space-y-4">
            {addressLabel && (
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                    <span className="truncate font-medium">{addressLabel}</span>
                </div>
            )}

            {!isLoaded ? (
                <div className={`${className} w-full bg-gray-100 animate-pulse rounded-2xl flex items-center justify-center text-gray-400 font-bold`}>
                    {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? <span className="text-red-500 text-center px-4">API Key Missing</span> : "جاري تحميل الخريطة..."}
                </div>
            ) : (
                <div className="relative group rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                    <PlacesAutocomplete onSelect={onPlaceSelect} handleCurrentLocation={handleCurrentLocation} />
                    <div className={className}>
                        <GoogleMap
                            mapContainerStyle={mapContainerStyle}
                            center={mapCenter}
                            zoom={13}
                            onLoad={onMapLoad}
                            onClick={onMapClick}
                            options={{
                                disableDefaultUI: true,
                                zoomControl: true,
                                mapId: process.env.NEXT_PUBLIC_GOOGLE_MAP_ID || "DEMO_MAP_ID"
                            }}
                        >
                            {markerPos && mapRef.current && (
                                <AdvancedMarker
                                    map={mapRef.current}
                                    position={markerPos}
                                    onDragEnd={onMarkerDragEnd}
                                />
                            )}
                        </GoogleMap>
                    </div>
                </div>
            )}
            <p className="text-xs text-gray-400 text-center">Click on the map to pin your location precisely.</p>
        </div>
    );
}

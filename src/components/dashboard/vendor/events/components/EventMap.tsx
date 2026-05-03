'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';
import { Search, MapPin } from 'lucide-react';
import { UseFormSetValue, UseFormWatch } from 'react-hook-form';

const libraries: ("places" | "marker")[] = ["places", "marker"];
const mapContainerStyle = { width: '100%', height: '100%' };

interface EventMapProps {
    setValue: UseFormSetValue<any>;
    watch: UseFormWatch<any>;
    vendorData?: any;
    event?: any;
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
    }, [map]); // Init on map available

    // Update position when prop changes (unless dragging)
    useEffect(() => {
        if (markerRef.current) {
            markerRef.current.position = position;
        }
    }, [position]);

    return null;
};

// ... PlacesAutocomplete component (kept same) ...

const PlacesAutocomplete = ({ onSelect }: { onSelect: (lat: number, lng: number, address: string, placeDetails: any) => void }) => {
    const {
        ready,
        value,
        suggestions: { status, data },
        setValue,
        clearSuggestions,
    } = usePlacesAutocomplete({
        requestOptions: {
            /* Define search scope here if needed */
        },
        debounce: 300,
        initOnMount: true,
    });

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

    // Need to trigger init manually when script is loaded if initOnMount is false? 
    // Actually if google maps is loaded globally, it should pick it up. 
    // Let's rely on parent loading it.
    useEffect(() => {
        if (typeof window !== "undefined" && window.google) {
            // Re-render or force update? usage of hook mainly depends on window.google
        }
    }, []);

    return (
        <div className="absolute top-4 left-4 right-4 z-10 shadow-xl">
            <div className="relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    value={value}
                    onChange={handleInput}
                    disabled={!ready}
                    type="text"
                    placeholder="ابحث عن مكان..."
                    className="w-full h-12 pr-12 pl-4 bg-white rounded-xl text-sm font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900"
                    onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                />
                {status === "OK" && (
                    <ul className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 max-h-60 overflow-y-auto z-50">
                        {data.map(({ place_id, description }) => (
                            <li
                                key={place_id}
                                onClick={() => handleSelect(description)}
                                className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm font-medium border-b border-gray-50 last:border-none text-gray-900"
                            >
                                {description}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default function EventMap({ setValue, watch, vendorData, event }: EventMapProps) {
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
        libraries,
    });

    const defaultCenter = { lat: 41.0082, lng: 28.9784 }; // Istanbul
    const [mapCenter, setMapCenter] = useState(defaultCenter);
    const [markerPos, setMarkerPos] = useState(defaultCenter);

    const mapRef = useRef<google.maps.Map | null>(null);
    const geocoderRef = useRef<google.maps.Geocoder | null>(null);

    const watchedDistrict = watch('district');
    const watchedCity = watch('city');
    const watchedLocationDetails = watch('location_details') || '';

    // ... (UseEffect and extractAddressComponents and handleGeocoding kept same) ...

    // Initialize Map
    useEffect(() => {
        if (!event && vendorData?.location_lat && vendorData?.location_long) {
            const pos = { lat: vendorData.location_lat, lng: vendorData.location_long };
            setMapCenter(pos);
            setMarkerPos(pos);
            setValue('location_lat', pos.lat);
            setValue('location_long', pos.lng);
        } else if (event?.location_lat) {
            const pos = { lat: event.location_lat, lng: event.location_long };
            setMapCenter(pos);
            setMarkerPos(pos);
            setValue('location_lat', pos.lat);
            setValue('location_long', pos.lng);
            if (event.location_name) setValue('location_name', event.location_name);
            if (event.district) setValue('district', event.district);
            if (event.city) setValue('city', event.city);
            if (event.country) setValue('country', event.country);
        } else {
            // Check if initialData (e.g. Instagram import) has set coordinates via defaultValues
            const watchedLat = watch('location_lat');
            const watchedLng = watch('location_long');
            if (watchedLat && watchedLng) {
                const pos = { lat: watchedLat, lng: watchedLng };
                setMapCenter(pos);
                setMarkerPos(pos);
            }
        }
    }, [vendorData, event, setValue]);

    const extractAddressComponents = (results: google.maps.GeocoderResult[]) => {
        if (!results[0]) return;
        const addressComponents = results[0].address_components;
        const formattedAddress = results[0].formatted_address;

        setValue('location_name', formattedAddress, { shouldValidate: true });

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
            setValue('location_lat', lat, { shouldValidate: true });
            setValue('location_long', lng, { shouldValidate: true });
            handleGeocoding(lat, lng);
        }
    }, [setValue]);

    const onPlaceSelect = (lat: number, lng: number, address: string, placeDetails: any) => {
        setMapCenter({ lat, lng });
        setMarkerPos({ lat, lng });
        setValue('location_lat', lat, { shouldValidate: true });
        setValue('location_long', lng, { shouldValidate: true });
        setValue('location_name', address, { shouldValidate: true });
        extractAddressComponents([placeDetails]);
    };

    const onMarkerDragEnd = (lat: number, lng: number) => {
        setMarkerPos({ lat, lng });
        setValue('location_lat', lat, { shouldValidate: true });
        setValue('location_long', lng, { shouldValidate: true });
        handleGeocoding(lat, lng);
    };

    if (loadError) return <div>Error loading maps</div>;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-gray-700">الموقع الجغرافي</label>
                {(watchedDistrict || watchedCity) && (
                    <div className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {watchedDistrict && `${watchedDistrict}، `}{watchedCity && watchedCity}
                    </div>
                )}
            </div>

            {!isLoaded ? (
                <div className="h-[250px] sm:h-[300px] w-full bg-gray-100 animate-pulse rounded-3xl flex items-center justify-center text-gray-400 font-bold">
                    {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? <span className="text-red-500 text-center px-4">تنبيه: مفتاح Google Maps API غير موجود.</span> : "جاري تحميل الخريطة..."}
                </div>
            ) : (
                <div className="relative group">
                    <PlacesAutocomplete onSelect={onPlaceSelect} />
                    <div className="rounded-3xl overflow-hidden border-2 border-gray-100 shadow-sm h-[250px] sm:h-[300px]">
                        <GoogleMap
                            mapContainerStyle={mapContainerStyle}
                            center={mapCenter}
                            zoom={14}
                            onLoad={onMapLoad}
                            onClick={onMapClick}
                            options={{
                                disableDefaultUI: true,
                                zoomControl: true,
                                mapId: process.env.NEXT_PUBLIC_GOOGLE_MAP_ID || "DEMO_MAP_ID", // Required for AdvancedMarker
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

            {/* Location Details - Additional address info */}
            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">
                    تفاصيل إضافية عن الموقع <span className="text-xs font-normal text-gray-400">(اختياري)</span>
                </label>
                <textarea
                    value={watchedLocationDetails}
                    onChange={(e) => {
                        if (e.target.value.length <= 200) {
                            setValue('location_details', e.target.value);
                        }
                    }}
                    className="input-field min-h-[70px] text-gray-900 leading-relaxed resize-none p-4 text-sm"
                    placeholder="مثال: الطابق الثالث، بجانب مسجد الفاتح، المدخل الجانبي"
                    rows={2}
                    maxLength={200}
                />
                <div className="flex justify-end">
                    <span className={`text-[10px] font-bold ${watchedLocationDetails.length > 180 ? 'text-amber-500' : 'text-gray-300'}`}>
                        {watchedLocationDetails.length}/200
                    </span>
                </div>
            </div>
        </div>
    );
}


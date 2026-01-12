'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleMap, useLoadScript, Marker, Autocomplete } from '@react-google-maps/api';
import { Search, MapPin } from 'lucide-react';
import { UseFormSetValue, UseFormWatch } from 'react-hook-form';

const libraries: ("places")[] = ["places"];
const mapContainerStyle = { width: '100%', height: '100%' };

interface EventMapProps {
    setValue: UseFormSetValue<any>;
    watch: UseFormWatch<any>;
    vendorData?: any;
    event?: any;
}

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
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

    const watchedDistrict = watch('district');
    const watchedCity = watch('city');

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

    const onPlaceSelect = () => {
        if (autocompleteRef.current) {
            const place = autocompleteRef.current.getPlace();
            if (!place || !place.geometry || !place.geometry.location) return;

            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            setMapCenter({ lat, lng });
            setMarkerPos({ lat, lng });
            setValue('location_lat', lat, { shouldValidate: true });
            setValue('location_long', lng, { shouldValidate: true });
            setValue('location_name', place.name || place.formatted_address, { shouldValidate: true });

            if (place.address_components) {
                // Reuse existing extraction logic implicitly via structure or duplicate minimal parts if needed.
                // For cleaner code, we can just call extractAddressComponents if we had a GeocoderResult, 
                // but PlaceResult has slightly different interface. 
                // Let's just implement the extraction here or unify interfaces.
                // For now, implementing extraction directly:
                let district = '';
                let city = '';
                let country = '';

                place.address_components.forEach(comp => {
                    if (comp.types.includes('country')) country = comp.long_name;
                    if (comp.types.includes('administrative_area_level_1')) city = comp.long_name;
                    if (comp.types.includes('administrative_area_level_2')) district = comp.long_name;
                });

                if (!city) {
                    const locality = place.address_components.find(c => c.types.includes('locality'));
                    if (locality) city = locality.long_name;
                }

                if (!district) {
                    const sublocality = place.address_components.find(c => c.types.includes('sublocality') || c.types.includes('sublocality_level_1'));
                    if (sublocality) district = sublocality.long_name;
                    else {
                        const neighborhood = place.address_components.find(c => c.types.includes('neighborhood'));
                        if (neighborhood) district = neighborhood.long_name;
                    }
                }

                setValue('district', district, { shouldValidate: true });
                setValue('city', city, { shouldValidate: true });
                setValue('country', country, { shouldValidate: true });
            } else {
                handleGeocoding(lat, lng);
            }
        }
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

            {/* Hidden inputs managed by this component via setValue */}
            {/* Note: Registers must be present in parent form or just values. React Hook Form manages them if registered. 
                Since we use setValue, we assume they are registered in parent or we can register them here via useEffect?
                Actually, it's better if parent registers them as hidden inputs or we inject <input type="hidden" /> here if passing register prop.
                But `setValue` works even if input is not rendered if `shouldValidate: true` is set and fields are in defaultValues.
                To be safe, let's strictly rely on setValue updating the form state 
            */}

            {!isLoaded ? (
                <div className="h-[250px] sm:h-[300px] w-full bg-gray-100 animate-pulse rounded-3xl flex items-center justify-center text-gray-400 font-bold">
                    {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? <span className="text-red-500 text-center px-4">تنبيه: مفتاح Google Maps API غير موجود.</span> : "جاري تحميل الخريطة..."}
                </div>
            ) : (
                <div className="relative group">
                    <Autocomplete onLoad={(a) => autocompleteRef.current = a} onPlaceChanged={onPlaceSelect}>
                        <div className="absolute top-4 left-4 right-4 z-10 shadow-xl">
                            <div className="relative">
                                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input type="text" placeholder="ابحث عن مكان..." className="w-full h-12 pr-12 pl-4 bg-white rounded-xl text-sm font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50" onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }} />
                            </div>
                        </div>
                    </Autocomplete>
                    <div className="rounded-3xl overflow-hidden border-2 border-gray-100 shadow-sm h-[250px] sm:h-[300px]">
                        <GoogleMap mapContainerStyle={mapContainerStyle} center={mapCenter} zoom={14} onLoad={onMapLoad} onClick={onMapClick} options={{ disableDefaultUI: true, zoomControl: true, styles: [{ featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }] }}>
                            <Marker position={markerPos} draggable={true} onDragEnd={(e) => { if (e.latLng) { const lat = e.latLng.lat(); const lng = e.latLng.lng(); setMarkerPos({ lat, lng }); setValue('location_lat', lat, { shouldValidate: true }); setValue('location_long', lng, { shouldValidate: true }); handleGeocoding(lat, lng); } }} />
                        </GoogleMap>
                    </div>
                </div>
            )}
        </div>
    );
}

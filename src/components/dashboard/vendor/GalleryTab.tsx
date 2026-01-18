'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Loader2, Plus, Trash2, ImageIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function GalleryTab({ vendorId, showAlert }: any) {
    const supabase = createClient();
    const t = useTranslations('Dashboard.vendor.gallery');
    const [gallery, setGallery] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (vendorId) {
            const load = async () => {
                const { data } = await supabase.from('vendor_gallery').select('*').eq('vendor_id', vendorId).order('created_at', { ascending: false });
                if (data) setGallery(data);
            };
            load();
        }
    }, [vendorId]);


    const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        setUploading(true);
        const file = e.target.files[0];
        const fileName = `${vendorId}/gallery-${Date.now()}.jpg`;

        try {
            const { error: uploadError } = await supabase.storage.from('vendor-public').upload(fileName, file, { cacheControl: '3600' });
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('vendor-public').getPublicUrl(fileName);
            const { data: newImage, error: dbError } = await supabase.from('vendor_gallery')
                .insert({ vendor_id: vendorId, image_url: publicUrl })
                .select().single();

            if (dbError) throw dbError;
            if (newImage) {
                setGallery(prev => [newImage, ...prev]);
                showAlert(t("add_success"), 'success');
            }
        } catch (err: any) {
            showAlert(`${t("error_prefix")}${err.message}`, 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string, url: string) => {
        if (!confirm(t("delete_confirm"))) return;

        try {
            // Try to delete from storage but ignore if fails (cleanup)
            const path = url.split('/vendor-public/')[1];
            if (path) await supabase.storage.from('vendor-public').remove([path]);
        } catch { }

        const { error } = await supabase.from('vendor_gallery').delete().eq('id', id);
        if (!error) {
            setGallery(prev => prev.filter(img => img.id !== id));
            showAlert(t("delete_success"), 'success');
        } else {
            showAlert(error.message, 'error');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">{t("my_works")}</h3>
                <div className="relative">
                    <input type="file" onChange={handleGalleryUpload} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" disabled={uploading} />
                    <button className={`bg-black text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-800'}`}>
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        {uploading ? t("profile.uploading") : t("add_image")}
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {gallery.map(img => (
                    <div key={img.id} className="aspect-square rounded-2xl overflow-hidden relative group shadow-sm">
                        <img src={img.image_url} className="w-full h-full object-cover" />
                        <button
                            onClick={() => handleDelete(img.id, img.image_url)}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full lg:opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                {gallery.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-400 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                        <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                        <p className="text-sm font-bold text-gray-500">{t("no_images")}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

import { ImageIcon } from 'lucide-react';
import React from 'react';

interface ImageUploaderProps {
    previewUrl: string | null;
    onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ImageUploader({ previewUrl, onImageChange }: ImageUploaderProps) {
    return (
        <div className="space-y-3">
            <label className="text-sm font-bold text-gray-700 block">صورة الفعالية</label>
            <div className={`relative h-48 rounded-3xl border-2 border-dashed border-gray-200 overflow-hidden group hover:border-primary/50 transition-colors ${!previewUrl ? 'bg-gray-50' : ''}`}>
                <input type="file" accept="image/*" onChange={onImageChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                {previewUrl ? (
                    <>
                        <img src={previewUrl} className="w-full h-full object-cover" alt="Event preview" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-white font-bold flex items-center gap-2"><ImageIcon className="w-5 h-5" /> تغيير الصورة</p>
                        </div>
                    </>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                        <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
                        <p className="text-sm font-bold">اضغط لرفع صورة</p>
                        <p className="text-xs">PNG, JPG حتى 5MB</p>
                    </div>
                )}
            </div>
        </div>
    );
}

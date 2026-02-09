'use client';

import React from 'react';
import { X } from 'lucide-react';
import { ReferenceImageDropZone, UploadedImage } from './ReferenceImageDropZone';

interface ReferenceImage {
    id: string;
    image_url: string;
    image_type: string;
}

interface EditableReferenceImagesProps {
    type: 'face' | 'body' | 'boobs' | 'pussy';
    label: string;
    description: string;
    existingImages: ReferenceImage[];
    newFiles: UploadedImage[];
    onAddFiles: (files: UploadedImage[]) => void;
    onRemoveExisting: (imageId: string) => void;
    onRemoveNew: (fileIndex: number) => void;
    isPornMode?: boolean;
    maxImages?: number;
}

export function EditableReferenceImages({
    type,
    label,
    description,
    existingImages,
    newFiles,
    onAddFiles,
    onRemoveExisting,
    onRemoveNew,
    isPornMode = false,
    maxImages = 5
}: EditableReferenceImagesProps) {
    const totalImages = existingImages.length + newFiles.length;
    const remainingSlots = maxImages - totalImages;

    return (
        <div className="space-y-3">
            <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                    {label}
                </label>
                <p className="text-xs text-zinc-500">{description}</p>
            </div>

            {/* Existing images from DB */}
            {existingImages.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                    {existingImages.map(img => (
                        <div key={img.id} className="relative group aspect-square">
                            <img
                                src={img.image_url}
                                alt=""
                                className="w-full h-full object-cover rounded-lg border border-zinc-700"
                            />
                            <button
                                type="button"
                                onClick={() => onRemoveExisting(img.id)}
                                className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                title="Remove image"
                            >
                                <X className="w-3 h-3" />
                            </button>
                            <span className="absolute bottom-1 left-1 bg-zinc-900/80 text-zinc-300 text-xs px-2 py-0.5 rounded">
                                Saved
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* New files to upload */}
            {newFiles.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                    {newFiles.map((file, idx) => (
                        <div key={idx} className="relative group aspect-square">
                            <img
                                src={file.url}
                                alt=""
                                className="w-full h-full object-cover rounded-lg border border-violet-500"
                            />
                            <button
                                type="button"
                                onClick={() => onRemoveNew(idx)}
                                className="absolute top-1 right-1 bg-orange-500 hover:bg-orange-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                title="Remove new image"
                            >
                                <X className="w-3 h-3" />
                            </button>
                            <span className="absolute bottom-1 left-1 bg-violet-600 text-white text-xs px-2 py-0.5 rounded font-medium">
                                NEW
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Add new button */}
            {remainingSlots > 0 && (
                <ReferenceImageDropZone
                    imageType={type}
                    label=""
                    description=""
                    images={[]}
                    onImagesChange={onAddFiles}
                    maxImages={remainingSlots}
                    isPornMode={isPornMode}
                />
            )}

            {/* Count indicator */}
            <div className="text-xs text-zinc-500">
                {totalImages} / {maxImages} images
                {remainingSlots > 0 && ` (${remainingSlots} more allowed)`}
            </div>
        </div>
    );
}

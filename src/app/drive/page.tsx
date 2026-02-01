'use client';

import React, { useEffect, useState } from 'react';
import { getDriveFiles } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function DrivePage() {
    const [currentPath, setCurrentPath] = useState('');
    const [folders, setFolders] = useState<any[]>([]);
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadFiles = async (path: string) => {
        setLoading(true);
        try {
            const items = await getDriveFiles(path);

            // Separate folders and files
            // Supabase storage returns folders with id=null usually, but best to check for mimetype or lack thereof
            const newFolders = items?.filter(item => !item.metadata) || [];
            const newFiles = items?.filter(item => item.metadata) || [];

            setFolders(newFolders);
            setFiles(newFiles);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load drive files');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFiles(currentPath);
    }, [currentPath]);

    const handleNavigate = (folderName: string) => {
        const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
        setCurrentPath(newPath);
    };

    const handleBack = () => {
        const parts = currentPath.split('/');
        parts.pop();
        setCurrentPath(parts.join('/'));
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
            <header className="mb-6 flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <span className="bg-blue-600 text-white rounded-lg p-1">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                        </svg>
                    </span>
                    My Drive
                </h1>
                {currentPath && (
                    <Button variant="outline" size="sm" onClick={handleBack}>
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                    </Button>
                )}
            </header>

            {/* Breadcrumb */}
            <div className="text-sm text-gray-500 mb-4 px-1">
                Path: <span className="font-mono">{currentPath || 'Root'}</span>
            </div>

            {loading ? (
                <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Folders */}
                    {folders.length > 0 && (
                        <div className="grid grid-cols-2 gap-3">
                            {folders.map(folder => (
                                <div
                                    key={folder.name}
                                    onClick={() => handleNavigate(folder.name)}
                                    className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                                >
                                    <svg className="w-10 h-10 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                                    </svg>
                                    <span className="text-sm font-medium text-center truncate w-full">{folder.name}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Files */}
                    {files.length > 0 && (
                        <div className="grid grid-cols-2 gap-3">
                            {files.map(file => (
                                <div key={file.name} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700">
                                    <div className="aspect-square bg-gray-100 relative">
                                        <img
                                            src={`https://${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '')}/storage/v1/object/public/user-drive/${currentPath}/${file.name}`}
                                            alt={file.name}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                    </div>
                                    <div className="p-2">
                                        <p className="text-xs text-gray-500 truncate">{file.name}</p>
                                        <div className="flex justify-end mt-1">
                                            <a
                                                href={`https://${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '')}/storage/v1/object/public/user-drive/${currentPath}/${file.name}`}
                                                download
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-blue-500 hover:text-blue-600"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {folders.length === 0 && files.length === 0 && (
                        <div className="text-center py-10 text-gray-400">
                            Empty folder
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

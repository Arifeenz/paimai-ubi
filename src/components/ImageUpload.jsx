'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ImagePlus, X, AlertCircle, Camera } from 'lucide-react';

export default function ImageUpload({
    onImagesChange,
    maxImages = 3,
    maxSizeMB = 10
}) {
    const [selectedImages, setSelectedImages] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const MAX_SIZE_BYTES = maxSizeMB * 1024 * 1024;

    // Validate single file
    const validateFile = (file) => {
        if (!ALLOWED_TYPES.includes(file.type)) {
            return 'รองรับเฉพาะไฟล์ JPG, PNG และ WebP เท่านั้น';
        }
        if (file.size > MAX_SIZE_BYTES) {
            return `ขนาดไฟล์ต้องไม่เกิน ${maxSizeMB}MB`;
        }
        return null;
    };

    // Process and add files
    const processFiles = useCallback((files) => {
        setError('');
        const fileArray = Array.from(files);

        console.log('🔍 [ImageUpload] processFiles called with:', {
            fileCount: fileArray.length,
            currentImageCount: selectedImages.length,
            maxImages
        });

        // Check max images limit
        if (selectedImages.length + fileArray.length > maxImages) {
            setError(`เพิ่มได้สูงสุด ${maxImages} รูปเท่านั้น`);
            console.warn('⚠️ [ImageUpload] Max images limit reached');
            return;
        }

        // Validate each file
        const validFiles = [];
        for (const file of fileArray) {
            console.log('🔍 [ImageUpload] Validating file:', {
                name: file.name,
                type: file.type,
                size: `${(file.size / 1024 / 1024).toFixed(2)}MB`
            });

            const validationError = validateFile(file);
            if (validationError) {
                setError(validationError);
                console.error('❌ [ImageUpload] Validation failed:', validationError);
                return;
            }
            validFiles.push(file);
        }

        console.log('✅ [ImageUpload] All files validated successfully');

        // Create previews using Blob URL (more compatible than Data URL)
        const updatedImages = [...selectedImages, ...validFiles];
        const newPreviews = validFiles.map(file => {
            const blobUrl = URL.createObjectURL(file);
            console.log(`✅ [ImageUpload] Created Blob URL for: ${file.name}`, {
                blobUrl: blobUrl.substring(0, 50),
                fileSize: file.size,
                fileType: file.type
            });
            return blobUrl;
        });

        const updatedPreviews = [...previews, ...newPreviews];

        console.log('🎨 [ImageUpload] Setting previews state:', {
            previousCount: previews.length,
            newCount: updatedPreviews.length,
            previewType: 'Blob URL'
        });

        setSelectedImages(updatedImages);
        setPreviews(updatedPreviews);

        // Notify parent
        if (onImagesChange) {
            onImagesChange(updatedImages);
            console.log('📤 [ImageUpload] Parent notified with updated images');
        }
    }, [selectedImages, previews, maxImages, onImagesChange]);

    // Handle file input change
    const handleFileSelect = (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            processFiles(files);
        }
        // Reset input to allow selecting same file again
        e.target.value = '';
    };

    // Handle drag events
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            processFiles(files);
        }
    };

    // Handle remove image
    const handleRemove = (index) => {
        console.log('🗑️ [ImageUpload] Removing image at index:', index);

        const removedImage = selectedImages[index];
        console.log('🗑️ [ImageUpload] Removed image details:', {
            name: removedImage?.name,
            size: removedImage ? `${(removedImage.size / 1024 / 1024).toFixed(2)}MB` : 'unknown'
        });

        // Revoke Blob URL to free memory
        URL.revokeObjectURL(previews[index]);
        console.log('🧹 [ImageUpload] Revoked Blob URL');

        const updatedImages = selectedImages.filter((_, i) => i !== index);
        const updatedPreviews = previews.filter((_, i) => i !== index);

        setSelectedImages(updatedImages);
        setPreviews(updatedPreviews);
        setError('');

        console.log('✅ [ImageUpload] Image removed successfully. Remaining images:', updatedImages.length);

        // Notify parent
        if (onImagesChange) {
            onImagesChange(updatedImages);
        }
    };

    // Cleanup Blob URLs on unmount
    useEffect(() => {
        return () => {
            console.log('🧹 [ImageUpload] Component unmounting, revoking all Blob URLs...');
            previews.forEach(url => URL.revokeObjectURL(url));
        };
    }, [previews]);

    return (
        <div className="w-full space-y-4">
            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2 animate-in slide-in-from-top-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-800">
                        <p className="font-medium">{error}</p>
                    </div>
                </div>
            )}

            {/* Upload Area */}
            <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                    group border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center 
                    transition-all cursor-pointer
                    ${isDragging
                        ? 'border-green-500 bg-green-50 scale-[1.02]'
                        : 'border-gray-200 hover:border-green-500 hover:bg-green-50'
                    }
                    ${selectedImages.length >= maxImages ? 'opacity-50 cursor-not-allowed' : ''}
                `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={selectedImages.length >= maxImages}
                    capture="environment" // Hint for mobile to prefer camera
                />

                <div className="flex flex-col items-center gap-3">
                    {/* Icon */}
                    <div className="w-16 h-16 bg-gray-50 group-hover:bg-white rounded-full flex items-center justify-center transition-colors shadow-sm">
                        {isDragging ? (
                            <ImagePlus className="w-8 h-8 text-green-600 animate-bounce" />
                        ) : (
                            <div className="relative">
                                <ImagePlus className="w-8 h-8 text-gray-400 group-hover:text-green-600 transition-colors" />
                                <Camera className="w-4 h-4 text-gray-400 group-hover:text-green-600 absolute -bottom-1 -right-1 sm:hidden" />
                            </div>
                        )}
                    </div>

                    {/* Text */}
                    <div>
                        <p className="text-gray-900 font-bold mb-1">
                            <span className="hidden sm:inline">ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือก</span>
                            <span className="sm:hidden">แตะเพื่อถ่ายรูปหรือเลือกจากแกลเลอรี่</span>
                        </p>
                        <p className="text-sm text-gray-500">
                            รองรับ PNG, JPG, WebP (สูงสุด {maxSizeMB}MB)
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            เพิ่มได้สูงสุด {maxImages} รูป • เหลืออีก {maxImages - selectedImages.length} รูป
                        </p>
                    </div>
                </div>
            </div>

            {/* Image Previews */}
            {previews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {previews.map((preview, index) => {
                        console.log(`🖼️ [ImageUpload] Rendering preview ${index + 1}:`, {
                            hasPreview: !!preview,
                            previewPrefix: preview?.substring(0, 50),
                            previewLength: preview?.length,
                            isDataUrl: preview?.startsWith('data:')
                        });

                        return (
                            <div
                                key={index}
                                className="relative group rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 aspect-square animate-in zoom-in-95 duration-300 shadow-md"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                {/* Image with Blob URL - should work perfectly! */}
                                <img
                                    src={preview}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-full object-cover"
                                    onLoad={(e) => {
                                        console.log(`✅ [ImageUpload] Image ${index + 1} rendered successfully`, {
                                            naturalWidth: e.target.naturalWidth,
                                            naturalHeight: e.target.naturalHeight,
                                            previewUrl: preview.substring(0, 50),
                                            computedWidth: e.target.width,
                                            computedHeight: e.target.height,
                                            complete: e.target.complete
                                        });
                                    }}
                                    onError={(e) => {
                                        console.error(`❌ [ImageUpload] Image ${index + 1} failed to render`, {
                                            src: preview.substring(0, 50) + '...',
                                            error: e
                                        });
                                    }}
                                />

                                {/* Overlay on hover */}
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center gap-2">
                                    {/* Open in new tab button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            console.log('🔓 Opening image in new tab via Blob URL');
                                            window.open(preview, '_blank');
                                        }}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 shadow-lg transform hover:scale-110 active:scale-95"
                                        aria-label="เปิดรูปในแท็บใหม่"
                                        title="เปิดรูปในแท็บใหม่"
                                    >
                                        <ImagePlus className="w-5 h-5" />
                                    </button>

                                    {/* Remove button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemove(index);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transform hover:scale-110 active:scale-95"
                                        aria-label="ลบรูปภาพ"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Image number badge */}
                                <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs font-bold px-2 py-1 rounded-full">
                                    {index + 1}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

import { UTApi } from 'uploadthing/server';

// Initialize UTApi for server-side file operations
const utapi = new UTApi();

/**
 * Delete files from UploadThing by their file keys
 * @param fileKeys - Array of file keys to delete
 * @returns Object with success status and any errors
 */
export const deleteFiles = async (fileKeys: string[]): Promise<{
    success: boolean;
    deletedCount: number;
    errors: string[];
}> => {
    if (!fileKeys || fileKeys.length === 0) {
        return { success: true, deletedCount: 0, errors: [] };
    }

    const errors: string[] = [];
    let deletedCount = 0;

    try {
        // UploadThing's deleteFiles accepts an array of file keys
        const result = await utapi.deleteFiles(fileKeys);

        if (result.success) {
            deletedCount = fileKeys.length;
            console.log(`✅ Deleted ${deletedCount} file(s) from UploadThing`);
        } else {
            errors.push('Failed to delete files from UploadThing');
            console.error('❌ Failed to delete files from UploadThing');
        }
    } catch (error: any) {
        errors.push(error.message || 'Unknown error deleting files');
        console.error('❌ Error deleting files from UploadThing:', error.message);
    }

    return {
        success: errors.length === 0,
        deletedCount,
        errors,
    };
};

/**
 * Delete a single file from UploadThing by its file key
 * @param fileKey - The file key to delete
 * @returns Boolean indicating success
 */
export const deleteFile = async (fileKey: string): Promise<boolean> => {
    const result = await deleteFiles([fileKey]);
    return result.success;
};

/**
 * Extract file key from an UploadThing URL
 * UploadThing URLs typically look like: https://utfs.io/f/{fileKey}
 * @param url - The UploadThing file URL
 * @returns The file key or null if not extractable
 */
export const extractFileKeyFromUrl = (url: string): string | null => {
    if (!url) return null;

    try {
        const urlObj = new URL(url);
        // UploadThing URLs: https://utfs.io/f/{fileKey}
        if (urlObj.pathname.startsWith('/f/')) {
            return urlObj.pathname.slice(3); // Remove '/f/'
        }
        // Alternative format: https://{appId}.ufs.sh/f/{fileKey}
        if (urlObj.pathname.includes('/f/')) {
            const parts = urlObj.pathname.split('/f/');
            return parts[1] || null;
        }
    } catch {
        // Not a valid URL
    }

    return null;
};

export default {
    deleteFiles,
    deleteFile,
    extractFileKeyFromUrl,
};

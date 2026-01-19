import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
    // Document uploader - for onboarding documents
    documentUploader: f({
        image: { maxFileSize: "4MB", maxFileCount: 1 },
        pdf: { maxFileSize: "8MB", maxFileCount: 1 },
    })
        .middleware(async () => {
            // This code runs on your server before upload
            // You could add auth check here if needed
            return { uploadedAt: new Date().toISOString() };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            // This code runs on your server after upload
            console.log("Upload complete:", file.name);
            console.log("File URL:", file.ufsUrl);

            // Return data to the client
            return {
                url: file.ufsUrl,
                name: file.name,
                size: file.size,
                key: file.key,
            };
        }),

    // Avatar uploader - for profile pictures  
    avatarUploader: f({
        image: { maxFileSize: "2MB", maxFileCount: 1 },
    })
        .middleware(async () => {
            return { uploadedAt: new Date().toISOString() };
        })
        .onUploadComplete(async ({ file }) => {
            return {
                url: file.ufsUrl,
                key: file.key,
            };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;


'use client';

import { getStorage, ref, uploadBytesResumable, getDownloadURL, type UploadTaskSnapshot } from "firebase/storage";
import { initializeFirebase } from "./index";

/**
 * Uploads a file to Firebase Storage and provides progress updates.
 * @param file The file to upload.
 * @param onProgress A callback function to receive upload progress (0-100).
 * @param userId The ID of the user uploading the file, for namespacing.
 * @returns A promise that resolves with the public download URL of the file.
 */
export const uploadFile = (
  file: File,
  onProgress: (progress: number) => void,
  userId: string,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Correctly initialize storage inside the function to ensure it's available client-side
    const { storage } = initializeFirebase();

    if (!storage) {
        return reject(new Error("Firebase Storage no está inicializado."));
    }

    const filePath = `documents/${userId}/${Date.now()}-${file.name}`;
    const storageRef = ref(storage, filePath);

    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed',
      (snapshot: UploadTaskSnapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
      },
      (error) => {
        console.error("Fallo en la subida:", error);
        // Specifically check for storage permission errors which are common
        if (error.code === 'storage/unauthorized') {
            reject(new Error("No tienes permisos para subir archivos. Revisa las reglas de Storage."));
        } else {
            reject(error);
        }
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          resolve(downloadURL);
        }).catch(reject);
      }
    );
  });
};

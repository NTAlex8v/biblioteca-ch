
'use client';

import { getStorage, ref, uploadBytesResumable, getDownloadURL, type UploadTaskSnapshot } from "firebase/storage";
import { initializeFirebase } from "./index";

const { storage } = initializeFirebase();

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
        reject(error);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          resolve(downloadURL);
        }).catch(reject);
      }
    );
  });
};

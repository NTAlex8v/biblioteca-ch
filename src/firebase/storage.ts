'use client';

import { getStorage, ref, uploadBytesResumable, getDownloadURL, type UploadTaskSnapshot, Storage } from "firebase/storage";
import { initializeFirebase } from "./index";

export const uploadFile = (
  file: File,
  onProgress: (progress: number) => void,
  userId: string,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // We get the storage instance from the centralized initializeFirebase function
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
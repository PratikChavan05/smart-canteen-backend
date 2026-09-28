package com.pratik.canteen.storage.service;

import org.springframework.web.multipart.MultipartFile;

/**
 * Service interface for file storage operations.
 */
public interface StorageService {

    /**
     * Upload a file to storage.
     *
     * @param file   the file to upload
     * @param folder the storage folder/prefix
     * @return the public URL of the uploaded file
     */
    String uploadFile(MultipartFile file, String folder);

    /**
     * Delete a file from storage.
     *
     * @param fileUrl the URL of the file to delete
     */
    void deleteFile(String fileUrl);
}

package com.pratik.canteen.storage.service;

import com.pratik.canteen.exception.InvalidOperationException;
import com.pratik.canteen.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * Stores images on S3 when possible, with local-disk fallback.
 * Public browser URLs always go through /api/storage/media/** so private
 * S3 buckets still display correctly.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class S3StorageServiceImpl implements StorageService {

    private final S3Client s3Client;

    @Value("${aws.s3.bucket-name:smart-canteen-images}")
    private String bucketName;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    private static final List<String> ALLOWED_CONTENT_TYPES = List.of(
            "image/jpeg", "image/png", "image/webp", "image/gif"
    );

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;

    @Override
    public String uploadFile(MultipartFile file, String folder) {
        validateFile(file);

        String safeFolder = sanitizeFolder(folder);
        String extension = resolveExtension(file);
        String key = safeFolder + "/" + UUID.randomUUID() + extension;

        // Always keep a local copy so images render even if the bucket is private
        saveLocally(file, key);

        try {
            PutObjectRequest putRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType(file.getContentType())
                    .build();

            s3Client.putObject(putRequest, RequestBody.fromBytes(file.getBytes()));
            log.info("File uploaded to S3 key={}", key);
        } catch (Exception e) {
            log.warn("S3 upload failed ({}), using local copy only: {}", e.getMessage(), e.getClass().getSimpleName());
        }

        // App-relative URL — works with private S3 via media proxy + local fallback
        return "/api/storage/media/" + key;
    }

    @Override
    public void deleteFile(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank()) return;

        try {
            String key = extractKey(fileUrl);
            if (key == null) return;

            Path local = resolveLocalPath(key);
            Files.deleteIfExists(local);

            try {
                s3Client.deleteObject(DeleteObjectRequest.builder()
                        .bucket(bucketName)
                        .key(key)
                        .build());
            } catch (Exception e) {
                log.warn("S3 delete skipped for {}: {}", key, e.getMessage());
            }
        } catch (Exception e) {
            log.warn("Failed to delete file {}: {}", fileUrl, e.getMessage());
        }
    }

    /**
     * Load an image for public serving (local first, then S3).
     */
    public LoadedMedia loadMedia(String key) {
        String safeKey = normalizeKey(key);

        Path local = resolveLocalPath(safeKey);
        if (Files.exists(local)) {
            try {
                InputStream in = Files.newInputStream(local);
                return new LoadedMedia(new InputStreamResource(in), guessContentType(safeKey), Files.size(local));
            } catch (IOException e) {
                log.warn("Failed reading local media {}: {}", safeKey, e.getMessage());
            }
        }

        try {
            ResponseInputStream<GetObjectResponse> s3Object = s3Client.getObject(
                    GetObjectRequest.builder().bucket(bucketName).key(safeKey).build());
            String contentType = s3Object.response().contentType();
            if (contentType == null || contentType.isBlank()) {
                contentType = guessContentType(safeKey);
            }
            long length = s3Object.response().contentLength() != null
                    ? s3Object.response().contentLength()
                    : -1;
            return new LoadedMedia(new InputStreamResource(s3Object), contentType, length);
        } catch (NoSuchKeyException e) {
            throw new ResourceNotFoundException("Image not found");
        } catch (Exception e) {
            log.warn("S3 media fetch failed for {}: {}", safeKey, e.getMessage());
            throw new ResourceNotFoundException("Image not found");
        }
    }

    public record LoadedMedia(Resource resource, String contentType, long contentLength) {}

    private void saveLocally(MultipartFile file, String key) {
        try {
            Path destination = resolveLocalPath(key);
            Files.createDirectories(destination.getParent());
            Files.write(destination, file.getBytes());
            log.info("Local copy saved: {}", destination);
        } catch (IOException e) {
            throw new InvalidOperationException("Failed to save uploaded file: " + e.getMessage());
        }
    }

    private Path resolveLocalPath(String key) {
        Path root = Paths.get(uploadDir).toAbsolutePath().normalize();
        Path destination = root.resolve(key).normalize();
        if (!destination.startsWith(root)) {
            throw new InvalidOperationException("Invalid upload path");
        }
        return destination;
    }

    private String extractKey(String fileUrl) {
        if (fileUrl.contains("/api/storage/media/")) {
            return normalizeKey(fileUrl.substring(fileUrl.indexOf("/api/storage/media/") + "/api/storage/media/".length()));
        }
        if (fileUrl.contains("/uploads/")) {
            return normalizeKey(fileUrl.substring(fileUrl.indexOf("/uploads/") + "/uploads/".length()));
        }
        if (fileUrl.contains(".amazonaws.com/")) {
            return normalizeKey(fileUrl.substring(fileUrl.indexOf(".amazonaws.com/") + ".amazonaws.com/".length()));
        }
        if (!fileUrl.startsWith("http")) {
            return normalizeKey(fileUrl.startsWith("/") ? fileUrl.substring(1) : fileUrl);
        }
        return null;
    }

    private String normalizeKey(String key) {
        if (key == null || key.isBlank()) {
            throw new InvalidOperationException("Invalid media key");
        }
        String cleaned = key.replace("\\", "/");
        while (cleaned.startsWith("/")) {
            cleaned = cleaned.substring(1);
        }
        if (cleaned.contains("..")) {
            throw new InvalidOperationException("Invalid media key");
        }
        return cleaned;
    }

    private String sanitizeFolder(String folder) {
        if (folder == null || folder.isBlank()) {
            return "menu-items";
        }
        String cleaned = folder.replaceAll("[^a-zA-Z0-9_-]", "");
        return cleaned.isBlank() ? "menu-items" : cleaned;
    }

    private String resolveExtension(MultipartFile file) {
        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename != null && originalFilename.contains(".")
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : ".jpg";
        extension = extension.replaceAll("[^a-zA-Z0-9.]", "");
        return extension.isBlank() ? ".jpg" : extension.toLowerCase(Locale.ROOT);
    }

    private String guessContentType(String key) {
        String lower = key.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".png")) return MediaType.IMAGE_PNG_VALUE;
        if (lower.endsWith(".gif")) return MediaType.IMAGE_GIF_VALUE;
        if (lower.endsWith(".webp")) return "image/webp";
        return MediaType.IMAGE_JPEG_VALUE;
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidOperationException("File is empty");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new InvalidOperationException("File size exceeds maximum limit of 5MB");
        }
        if (!ALLOWED_CONTENT_TYPES.contains(file.getContentType())) {
            throw new InvalidOperationException("File type not allowed. Accepted: JPEG, PNG, WebP, GIF");
        }
    }
}

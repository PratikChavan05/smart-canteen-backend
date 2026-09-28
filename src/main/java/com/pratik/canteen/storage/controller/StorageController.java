package com.pratik.canteen.storage.controller;

import com.pratik.canteen.common.response.ApiResponse;
import com.pratik.canteen.storage.service.S3StorageServiceImpl;
import com.pratik.canteen.storage.service.StorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.HandlerMapping;

import java.util.Map;

/**
 * File upload (staff) and public media serving for menu images.
 */
@RestController
@RequestMapping("/api/storage")
@RequiredArgsConstructor
@Tag(name = "Storage", description = "File upload and management endpoints")
public class StorageController {

    private final StorageService storageService;
    private final S3StorageServiceImpl s3StorageService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    @Operation(summary = "Upload an image file (Manager/Admin)")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", defaultValue = "menu-items") String folder) {

        String url = storageService.uploadFile(file, folder);
        return ResponseEntity.ok(ApiResponse.success(
                Map.of("url", url), "File uploaded successfully"));
    }

    @GetMapping("/media/**")
    @Operation(summary = "Publicly serve an uploaded image (local or S3)")
    public ResponseEntity<Resource> getMedia(HttpServletRequest request) {
        String fullPath = (String) request.getAttribute(HandlerMapping.PATH_WITHIN_HANDLER_MAPPING_ATTRIBUTE);
        String bestMatch = (String) request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);
        String key = fullPath;
        if (fullPath != null && bestMatch != null && bestMatch.endsWith("/**")) {
            String prefix = bestMatch.substring(0, bestMatch.length() - 3);
            if (fullPath.startsWith(prefix)) {
                key = fullPath.substring(prefix.length());
            }
        }
        if (key != null && key.startsWith("/")) {
            key = key.substring(1);
        }

        S3StorageServiceImpl.LoadedMedia media = s3StorageService.loadMedia(key);
        ResponseEntity.BodyBuilder builder = ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                .contentType(MediaType.parseMediaType(media.contentType()));
        if (media.contentLength() >= 0) {
            builder.contentLength(media.contentLength());
        }
        return builder.body(media.resource());
    }

    @DeleteMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    @Operation(summary = "Delete a file from storage (Manager/Admin)")
    public ResponseEntity<ApiResponse<Void>> deleteFile(@RequestParam("url") String fileUrl) {
        storageService.deleteFile(fileUrl);
        return ResponseEntity.ok(ApiResponse.success(null, "File deleted successfully"));
    }
}

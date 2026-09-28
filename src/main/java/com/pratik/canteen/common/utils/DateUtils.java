package com.pratik.canteen.common.utils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Utility class for common date formatting operations.
 */
public final class DateUtils {

    private DateUtils() {
        // Prevent instantiation
    }

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * Format a LocalDate to "yyyy-MM-dd" string.
     */
    public static String formatDate(LocalDate date) {
        return date != null ? date.format(DATE_FORMATTER) : null;
    }

    /**
     * Format a LocalDateTime to "yyyy-MM-dd HH:mm:ss" string.
     */
    public static String formatDateTime(LocalDateTime dateTime) {
        return dateTime != null ? dateTime.format(DATETIME_FORMATTER) : null;
    }

    /**
     * Parse a "yyyy-MM-dd" string to LocalDate.
     */
    public static LocalDate parseDate(String dateStr) {
        return dateStr != null ? LocalDate.parse(dateStr, DATE_FORMATTER) : null;
    }

    /**
     * Get the start of day (00:00:00) for a given date.
     */
    public static LocalDateTime startOfDay(LocalDate date) {
        return date.atStartOfDay();
    }

    /**
     * Get the end of day (23:59:59.999999999) for a given date.
     */
    public static LocalDateTime endOfDay(LocalDate date) {
        return date.atTime(23, 59, 59, 999999999);
    }
}

#pragma once

#include <Arduino.h>

// Offline-first transaction record.
// Keep this structure small because records are stored in ESP32 NVS.
struct OfflineTransaction {
    uint32_t localId;
    char customerName[32];
    char service[96];
    float payment;
    uint16_t durationMinutes;
    char status[16];
    char paymentMethod[16];
    char createdAt[24];
};

// Initialize the local persistent transaction queue.
void offlineQueueInit();

// Add a completed transaction to the persistent queue.
// Returns false if the queue is full.
bool offlineQueueAdd(
    const char* customerName,
    const char* service,
    float payment,
    uint16_t durationMinutes,
    const char* status,
    const char* paymentMethod,
    const char* createdAt
);

// Number of transactions waiting for cloud sync.
uint16_t offlineQueueCount();

// Read a queued record by queue index.
bool offlineQueueGet(uint16_t index, OfflineTransaction& record);

// Remove a record only after Supabase confirms the upload.
bool offlineQueueRemove(uint16_t index);

// Mark/inspect the next record without deleting it.
// The queue is persistent across reboot.
bool offlineQueueHasPending();

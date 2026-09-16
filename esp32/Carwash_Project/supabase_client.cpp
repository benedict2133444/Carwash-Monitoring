#include "supabase_client.h"
#include "carwash_logic.h"
#include "secrets.h"

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>

// ======================================================
// SUPABASE / WIFI BACKGROUND SERVICE
// ======================================================
// This file is deliberately isolated from the Arduino
// real-time loop. supabase_task() is a blocking worker,
// but it runs on the background CloudTask only.
//
// Local UART control does NOT depend on Wi-Fi.
// ======================================================

static const char* SUPABASE_URL =
    "https://uakazzooibnwlamdqsi.supabase.co";

static const char* SUPABASE_KEY =
    "sb_publishable_UtiypfyK-6ahnwGF8qfcAA_64udsQd8";

static const char* WIFI_SSID = CARWASH_WIFI_SSID;
static const char* WIFI_PASSWORD = CARWASH_WIFI_PASSWORD;

static const uint32_t WIFI_RETRY_INTERVAL = 30000UL;
static const uint32_t WIFI_CONNECT_TIMEOUT = 10000UL;
static const uint32_t SUPABASE_UPDATE_INTERVAL = 15000UL;
static const uint32_t SUPABASE_HTTP_TIMEOUT = 1800UL;

static bool wifiConnected = false;
static bool wifiConnecting = false;
static bool wifiRetryPending = false;

static uint32_t wifiAttemptStarted = 0;
static uint32_t lastWiFiAttempt = 0;
static uint32_t lastSupabaseUpdate = 0;
static volatile bool supabaseUpdateRequested = true;

// Called by carwash_logic.cpp. This function NEVER performs network I/O.
// It only sets a flag that the background CloudTask will service.
void requestSupabaseUpdate()
{
    supabaseUpdateRequested = true;
}

void supabase_init()
{
    wifiConnected = false;
    wifiConnecting = false;
    wifiRetryPending = false;
    wifiAttemptStarted = 0;
    lastWiFiAttempt = millis();
    lastSupabaseUpdate = 0;

    Serial.println("Supabase service initialized.");
    Serial.println("Wi-Fi/Supabase will run only in CloudTask.");
}

static void stopWiFiAttempt()
{
    // Stop the active STA association before a future WiFi.begin().
    // This avoids the previously observed:
    // "sta is connecting, cannot set config"
    WiFi.disconnect(false, false);
    wifiConnecting = false;
    wifiRetryPending = true;
    lastWiFiAttempt = millis();
}

static void maintainWiFiBackground()
{
    const uint32_t now = millis();
    const wl_status_t status = WiFi.status();

    if(status == WL_CONNECTED)
    {
        if(!wifiConnected)
        {
            wifiConnected = true;
            wifiConnecting = false;
            wifiRetryPending = false;

            Serial.println();
            Serial.println("WIFI ONLINE - SECONDARY");
            Serial.print("IP: ");
            Serial.println(WiFi.localIP());
            Serial.print("Channel: ");
            Serial.println(WiFi.channel());
            Serial.println("LOCAL UART CONTROL IS INDEPENDENT.");
        }

        return;
    }

    if(wifiConnected)
    {
        wifiConnected = false;
        Serial.println();
        Serial.println("WIFI OFFLINE");
        Serial.println("LOCAL UART CONTROL CONTINUES.");
    }

    // Never call WiFi.begin() while a connection attempt is active.
    if(wifiConnecting)
    {
        if(now - wifiAttemptStarted < WIFI_CONNECT_TIMEOUT)
            return;

        Serial.println("Wi-Fi attempt timed out; stopping STA attempt.");
        stopWiFiAttempt();
        return;
    }

    // After disconnect(), wait until the driver really reports
    // WL_DISCONNECTED before starting another association.
    if(wifiRetryPending)
    {
        if(status != WL_DISCONNECTED)
            return;

        if(now - lastWiFiAttempt < WIFI_RETRY_INTERVAL)
            return;

        wifiRetryPending = false;
    }
    else
    {
        if(now - lastWiFiAttempt < WIFI_RETRY_INTERVAL)
            return;
    }

    // This is the ONLY place in the project that calls WiFi.begin().
    wifiConnecting = true;
    wifiAttemptStarted = now;
    lastWiFiAttempt = now;

    Serial.println();
    Serial.println("SECONDARY WIFI ATTEMPT");

    WiFi.mode(WIFI_STA);
    WiFi.setSleep(false);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
}

static void sendSupabaseStatus()
{
    if(!wifiConnected || WiFi.status() != WL_CONNECTED)
        return;

    // Snapshot the local state quickly. No network operation occurs here
    // until after the snapshot is complete.
    const char* waterStatus = getWaterStatus();
    const char* soapStatus = getSoapStatus();
    const char* blowerStatus = getBlowerStatus();
    const char* faucetStatus = getFaucetStatus();

    const uint32_t waterRemaining = getWaterRemainingSeconds();
    const uint32_t soapRemaining = getSoapRemainingSeconds();
    const uint32_t blowerRemaining = getBlowerRemainingSeconds();
    const uint32_t faucetRemaining = getFaucetRemainingSeconds();

    char payload[768];

    snprintf(
        payload,
        sizeof(payload),
        "{\"water_status\":\"%s\","
        "\"soap_status\":\"%s\","
        "\"blower_status\":\"%s\","
        "\"faucet_status\":\"%s\","
        "\"water_remaining\":%lu,"
        "\"soap_remaining\":%lu,"
        "\"blower_remaining\":%lu,"
        "\"faucet_remaining\":%lu,"
        "\"is_online\":true}",
        waterStatus,
        soapStatus,
        blowerStatus,
        faucetStatus,
        (unsigned long)waterRemaining,
        (unsigned long)soapRemaining,
        (unsigned long)blowerRemaining,
        (unsigned long)faucetRemaining
    );

    HTTPClient http;

    const String url =
        String(SUPABASE_URL) + "/rest/v1/machine_status?id=eq.1";

    if(!http.begin(url))
    {
        Serial.println("Supabase HTTP begin failed.");
        return;
    }

    http.setTimeout(SUPABASE_HTTP_TIMEOUT);
    http.addHeader("apikey", SUPABASE_KEY);
    http.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Prefer", "return=minimal");

    const int httpCode = http.sendRequest("PATCH", payload);

    if(httpCode > 0)
    {
        Serial.print("Supabase status HTTP: ");
        Serial.println(httpCode);
    }
    else
    {
        Serial.print("Supabase HTTP error: ");
        Serial.println(http.errorToString(httpCode));
    }

    http.end();
}

void supabase_task()
{
    // Entire function is a background worker.
    // It must NEVER be called from loop().

    WiFi.mode(WIFI_STA);
    WiFi.setSleep(false);

    // CloudTask itself starts after the 15-second local-only grace period.
    // First Wi-Fi attempt is allowed immediately after that grace period.
    lastWiFiAttempt = millis() - WIFI_RETRY_INTERVAL;

    for(;;)
    {
        maintainWiFiBackground();

        const uint32_t now = millis();

        bool updateDue = false;

        // A carwash state change can request an immediate cloud update,
        // but ONLY this background task performs HTTP.
        if(wifiConnected && supabaseUpdateRequested)
        {
            supabaseUpdateRequested = false;
            updateDue = true;
        }
        else if(
            wifiConnected &&
            now - lastSupabaseUpdate >= SUPABASE_UPDATE_INTERVAL
        )
        {
            updateDue = true;
        }

        if(updateDue)
        {
            lastSupabaseUpdate = now;
            sendSupabaseStatus();
        }

        // Yield frequently so the Wi-Fi task remains healthy without
        // affecting the local UART control loop on the other core.
        vTaskDelay(pdMS_TO_TICKS(20));
    }
}

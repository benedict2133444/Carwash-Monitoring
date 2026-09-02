#include "supabase_client.h"
#include "secrets.h"

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>

#include "carwash_logic.h"
#include "espnow.h"

// ======================================================
// SUPABASE
// ======================================================

const char* SUPABASE_URL = CARWASH_SUPABASE_URL;
const char* SUPABASE_KEY = CARWASH_SUPABASE_KEY;

// ======================================================
// UPDATE CONTROL
// ======================================================

volatile bool supabaseUpdateRequested = false;

unsigned long lastSupabaseUpdate = 0;

const unsigned long SUPABASE_MIN_INTERVAL = 1000;


// ======================================================
// REQUEST UPDATE
// ======================================================

void requestSupabaseUpdate()
{
    supabaseUpdateRequested = true;

    Serial.println(
        "SUPABASE UPDATE REQUESTED"
    );
}


// ======================================================
// SEND MACHINE STATUS
// ======================================================

void sendMachineStatus()
{
    Serial.println();
    Serial.println("==============================");
    Serial.println("SUPABASE SEND START");
    Serial.println("==============================");

    // --------------------------------------------------
    // WIFI CHECK
    // --------------------------------------------------

    Serial.print("Wi-Fi status: ");
    Serial.println(WiFi.status());

    if(WiFi.status() != WL_CONNECTED)
    {
        Serial.println(
            "Supabase: Wi-Fi NOT connected"
        );

        return;
    }

    Serial.println(
        "Supabase: Wi-Fi connected"
    );


    // --------------------------------------------------
    // CREATE JSON
    // --------------------------------------------------

    String json = "{";

    json += "\"id\":1,";

    json += "\"water_status\":\"";
    json += getWaterStatus();
    json += "\",";

    json += "\"soap_status\":\"";
    json += getSoapStatus();
    json += "\",";

    json += "\"blower_status\":\"";
    json += getBlowerStatus();
    json += "\",";

    json += "\"faucet_status\":\"";
    json += getFaucetStatus();
    json += "\",";

    json += "\"water_remaining\":";
    json += String(getWaterRemainingSeconds());
    json += ",";

    json += "\"soap_remaining\":";
    json += String(getSoapRemainingSeconds());
    json += ",";

    json += "\"blower_remaining\":";
    json += String(getBlowerRemainingSeconds());
    json += ",";

    json += "\"faucet_remaining\":";
    json += String(getFaucetRemainingSeconds());
    json += ",";

    json += "\"is_online\":";
    json += (isControllerOnline() ? "true" : "false");

    json += "}";


    Serial.println("JSON:");
    Serial.println(json);


    // --------------------------------------------------
    // HTTPS
    // --------------------------------------------------

    Serial.println(
        "Creating secure client..."
    );

    WiFiClientSecure client;

    client.setInsecure();

    HTTPClient http;

    String endpoint =
        String(SUPABASE_URL) +
        "/rest/v1/machine_status";

    Serial.println("Endpoint:");
    Serial.println(endpoint);


    Serial.println(
        "Starting HTTP connection..."
    );

    if(!http.begin(client, endpoint))
    {
        Serial.println(
            "Supabase: HTTP BEGIN FAILED"
        );

        return;
    }

    Serial.println(
        "HTTP connection started"
    );


    // --------------------------------------------------
    // HEADERS
    // --------------------------------------------------

    http.addHeader(
        "apikey",
        SUPABASE_KEY
    );

    http.addHeader(
        "Authorization",
        String("Bearer ") + SUPABASE_KEY
    );

    http.addHeader(
        "Content-Type",
        "application/json"
    );

    http.addHeader(
        "Prefer",
        "resolution=merge-duplicates"
    );


    Serial.println(
        "Sending POST to Supabase..."
    );


    // --------------------------------------------------
    // POST
    // --------------------------------------------------

    int httpCode = http.POST(json);


    Serial.print(
        "Supabase HTTP status: "
    );

    Serial.println(httpCode);


    if(httpCode >= 200 && httpCode < 300)
    {
        Serial.println(
            "SUPABASE UPDATE SUCCESS"
        );
    }
    else
    {
        Serial.println(
            "SUPABASE UPDATE FAILED"
        );

        String response = http.getString();

        Serial.println(
            "Supabase response:"
        );

        Serial.println(response);
    }


    http.end();

    Serial.println(
        "SUPABASE SEND END"
    );

    Serial.println("==============================");
}


// ======================================================
// INITIALIZATION
// ======================================================

void supabase_init()
{
    Serial.println();
    Serial.println("==============================");
    Serial.println("SUPABASE CLIENT");
    Serial.println("==============================");

    supabaseUpdateRequested = false;

    lastSupabaseUpdate = 0;

    Serial.println(
        "Supabase event updates enabled"
    );
}


// ======================================================
// SUPABASE TASK
// ======================================================

void supabase_task()
{
    unsigned long now = millis();

    if(!supabaseUpdateRequested)
        return;

    // Wait until the minimum interval has passed.
    if(now - lastSupabaseUpdate < SUPABASE_MIN_INTERVAL)
        return;

    // Only print once we are actually going to send.
    Serial.println("SUPABASE TASK: UPDATE FLAG DETECTED");

    supabaseUpdateRequested = false;
    lastSupabaseUpdate = now;

    Serial.println("SUPABASE TASK: CALLING sendMachineStatus()");

    sendMachineStatus();
}
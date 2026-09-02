#include "display.h"
#include "lvgl_port.h"
#include "touch.h"
#include "carwash_logic.h"
#include "espnow.h"
#include "supabase_client.h"
#include "secrets.h"

#include <WiFi.h>
#include <esp_now.h>

const char* WIFI_SSID = CARWASH_WIFI_SSID;
const char* WIFI_PASSWORD = CARWASH_WIFI_PASSWORD;

#define ESPNOW_CHANNEL 11

void setup()
{
    Serial.begin(115200);
    delay(1000); 

// ==================================================
// WIFI
// ==================================================

WiFi.mode(WIFI_STA);
WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

Serial.print("Connecting to Wi-Fi");

unsigned long wifiStart = millis();

while (
    WiFi.status() != WL_CONNECTED &&
    millis() - wifiStart < 15000
)
{
    delay(500);
    Serial.print(".");
}

Serial.println();

if (WiFi.status() == WL_CONNECTED)
{
    Serial.println("Wi-Fi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());

    Serial.print("Wi-Fi channel: ");
    Serial.println(WiFi.channel());
}
else
{
    Serial.println("Wi-Fi connection FAILED");
    Serial.println("Continuing without Wi-Fi...");
}
    // ==================================================
    // ESP-NOW
    // ==================================================
    espnow_init();

    Serial.println("1");

    display_init();

    Serial.println("2");

    lvgl_port_init();

    Serial.println("3");

    carwash_logic_init();
    supabase_init();

    Serial.println("4");
}

void loop()
{
    lv_tick_inc(2);
    lvgl_port_task();
    carwash_logic_task();
    espnow_task();
    supabase_task();

    delay(2);
}

#include <Arduino.h>

#include "display.h"
#include "lvgl_port.h"
#include "touch.h"
#include "carwash_logic.h"
#include "supabase_client.h"
#include "secrets.h"

// ======================================================
// LCD CARWASH CONTROLLER
// ======================================================
// LOCAL REAL-TIME CONTROL = UART
// CLOUD SERVICES = BACKGROUND TASK
//
// LCD UART:
//   GPIO17 TX -> Controller GPIO22 RX
//   GPIO18 RX <- Controller GPIO23 TX
//   GND       -> GND
//
// IMPORTANT:
// The Arduino loop below contains NO Wi-Fi calls and
// NO HTTP calls. This keeps relay commands responsive.
// ======================================================

void uart_comm_init();
void uart_comm_task();

static TaskHandle_t cloudTaskHandle = nullptr;

static void cloudTask(void *parameter)
{
    (void)parameter;

    // Give the display/touch/UART path a clean startup window.
    // Cloud services are deliberately delayed and isolated.
    vTaskDelay(pdMS_TO_TICKS(15000));

    // Wi-Fi + Supabase live here, on the other CPU core.
    // Nothing in this task is allowed to drive the relays.
    supabase_task();

    vTaskDelete(nullptr);
}

void setup()
{
    Serial.begin(115200);
    delay(500);

    Serial.println();
    Serial.println("========================================");
    Serial.println("CARWASH LCD CONTROLLER STARTING");
    Serial.println("========================================");
    Serial.println("LOCAL CONTROL : UART PRIMARY");
    Serial.println("CLOUD         : BACKGROUND TASK");
    Serial.println("ESP-NOW       : DISABLED");
    Serial.println("========================================");

    // --------------------------------------------------
    // LOCAL HARDWARE FIRST
    // --------------------------------------------------
    display_init();
    lvgl_port_init();
    uart_comm_init();
    carwash_logic_init();

    // Supabase init only prepares its state.
    // Actual Wi-Fi/HTTP work starts in cloudTask().
    supabase_init();

    // --------------------------------------------------
    // CLOUD TASK
    // --------------------------------------------------
    // ESP32-S3 is dual-core. Pin cloud work to core 0 so
    // Arduino/LVGL/UART local control remains on core 1.
    BaseType_t taskResult = xTaskCreatePinnedToCore(
        cloudTask,
        "CloudTask",
        8192,
        nullptr,
        1,
        &cloudTaskHandle,
        0
    );

    if(taskResult != pdPASS)
    {
        Serial.println("ERROR: CloudTask could not be created.");
        Serial.println("LOCAL UART CONTROL REMAINS ACTIVE.");
    }
    else
    {
        Serial.println("CloudTask started on core 0.");
    }

    Serial.println();
    Serial.println("========================================");
    Serial.println("SYSTEM READY");
    Serial.println("========================================");
    Serial.println("UART: PRIMARY / REAL-TIME");
    Serial.println("Wi-Fi: SECONDARY / CORE 0");
    Serial.println("Supabase: SECONDARY / CORE 0");
    Serial.println("========================================");
}

void loop()
{
    // ==================================================
    // REAL-TIME LOCAL PATH ONLY
    // ==================================================
    // Do not add Wi-Fi.begin(), WiFi.disconnect(),
    // HTTPClient, delay-heavy network code, or Supabase
    // HTTP operations here.

    static uint32_t lastLvglTick = millis();
    const uint32_t now = millis();
    const uint32_t elapsed = now - lastLvglTick;

    if(elapsed > 0)
    {
        lv_tick_inc(elapsed);
        lastLvglTick = now;
    }

    // Keep the order tight: UI -> carwash logic -> UART.
    lvgl_port_task();
    carwash_logic_task();
    uart_comm_task();

    // No Wi-Fi maintenance here.
    // No supabase_task() here.
    delay(1);
}

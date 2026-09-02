#include "ui.h"
#include <lvgl.h>

#include "espnow.h"
#include "commands.h"
#include "carwash_logic.h"

#include <WiFi.h>
#include <esp_now.h>
#include <esp_wifi.h>


// ======================================================
// ESP-NOW CHANNEL
// MUST MATCH CONTROLLER
// ======================================================

#define ESPNOW_CHANNEL 11


// ======================================================
// CONTROLLER ESP32 MAC
// ======================================================

uint8_t controllerMAC[] =
{
    0x20,
    0xE7,
    0xC8,
    0xAC,
    0xF2,
    0xFC
};


// ======================================================
// MESSAGE STRUCTURE
// MUST MATCH CONTROLLER
// ======================================================

typedef struct
{
    char command[32];
} Message;


// ======================================================
// MESSAGE STORAGE
// ======================================================

Message msg;

Message incoming;


// ======================================================
// CONNECTION STATUS
// ======================================================

volatile unsigned long lastControllerHeartbeat = 0;

volatile bool heartbeatReceived = false;

bool controllerOnline = false;

const unsigned long CONTROLLER_TIMEOUT = 3000;


// ======================================================
// PHYSICAL BUTTON EVENTS
// ======================================================

volatile bool physicalWaterRequest  = false;
volatile bool physicalSoapRequest   = false;
volatile bool physicalBlowerRequest = false;
volatile bool physicalFaucetRequest = false;
volatile bool physicalPauseRequest  = false;


// ======================================================
// CUSTOMER SELECTION
// Defined in ui_events.cpp
// ======================================================

extern bool waterSelected;
extern bool soapSelected;
extern bool blowerSelected;
extern bool faucetSelected;


// ======================================================
// SEND CALLBACK
// ======================================================

void OnDataSent(
    const wifi_tx_info_t *info,
    esp_now_send_status_t status
)
{
    // Intentionally empty.

    // Do NOT update LVGL here.
    // Do NOT print here.
    //
    // ESP-NOW callbacks run outside the
    // normal LVGL application flow.
}


// ======================================================
// RECEIVE CALLBACK
//
// IMPORTANT:
// NO LVGL HERE.
// NO Serial printing here.
// ONLY COPY DATA AND SET FLAGS.
// ======================================================

void OnDataRecv(
    const esp_now_recv_info_t *info,
    const uint8_t *data,
    int len
)
{
    if(data == nullptr)
    {
        return;
    }

    if(len < (int)sizeof(Message))
    {
        return;
    }


    // ==================================================
    // COPY PACKET
    // ==================================================

    Message received;

    memcpy(
        &received,
        data,
        sizeof(Message)
    );

    received.command[
        sizeof(received.command) - 1
    ] = '\0';


    // ==================================================
    // HEARTBEAT
    // ==================================================

    if(
        strcmp(
            received.command,
            "ONLINE"
        ) == 0
    )
    {
        lastControllerHeartbeat =
            millis();

        heartbeatReceived = true;

        return;
    }


    // ==================================================
    // PHYSICAL WATER
    // ==================================================

    if(
        strcmp(
            received.command,
            "PHYSICAL_WATER"
        ) == 0
    )
    {
        physicalWaterRequest = true;

        return;
    }


    // ==================================================
    // PHYSICAL SOAP
    // ==================================================

    if(
        strcmp(
            received.command,
            "PHYSICAL_SOAP"
        ) == 0
    )
    {
        physicalSoapRequest = true;

        return;
    }


    // ==================================================
    // PHYSICAL BLOWER
    // ==================================================

    if(
        strcmp(
            received.command,
            "PHYSICAL_BLOWER"
        ) == 0
    )
    {
        physicalBlowerRequest = true;

        return;
    }


    // ==================================================
    // PHYSICAL FAUCET
    // ==================================================

    if(
        strcmp(
            received.command,
            "PHYSICAL_FAUCET"
        ) == 0
    )
    {
        physicalFaucetRequest = true;

        return;
    }


    // ==================================================
    // PHYSICAL PAUSE
    // ==================================================

    if(
        strcmp(
            received.command,
            "PHYSICAL_PAUSE"
        ) == 0
    )
    {
        physicalPauseRequest = true;

        return;
    }
}


// ======================================================
// UPDATE LCD CONNECTION INDICATOR
// ======================================================

void updateControllerIndicator(
    bool online
)
{
    if(online)
    {
        lv_label_set_text(
            ui_cpanelccstate,
            "ONLINE"
        );

        lv_obj_set_style_bg_color(
            ui_cpanelcoinaccstat,
            lv_color_hex(0x0DFF00),
            LV_PART_MAIN | LV_STATE_DEFAULT
        );
    }
    else
    {
        lv_label_set_text(
            ui_cpanelccstate,
            "OFFLINE"
        );

        lv_obj_set_style_bg_color(
            ui_cpanelcoinaccstat,
            lv_color_hex(0xFF0000),
            LV_PART_MAIN | LV_STATE_DEFAULT
        );
    }
}


// ======================================================
// ESP-NOW INITIALIZATION
// ======================================================
void espnow_init()
{
    WiFi.mode(WIFI_STA);

    Serial.println("Using existing Wi-Fi connection");
    Serial.print("Wi-Fi channel: ");
    Serial.println(WiFi.channel());

    Serial.print("LCD MAC: ");
    Serial.println(WiFi.macAddress());

    Serial.print("LCD ESP-NOW Channel: ");
    Serial.println(WiFi.channel());

    if(esp_now_init() != ESP_OK)
    {
        Serial.println("ESP-NOW INIT FAILED");
        return;
    }
    // ==================================================
    // PRINT MAC
    // ==================================================

    Serial.print("LCD MAC: ");
    Serial.println(WiFi.macAddress());

    Serial.print("LCD ESP-NOW Channel: ");
    Serial.println(WiFi.channel());


    // ==================================================
    // INITIALIZE ESP-NOW
    // ==================================================

    if(esp_now_init() != ESP_OK)
    {
        Serial.println(
            "ESP-NOW INIT FAILED"
        );

        return;
    }


    // ==================================================
    // REGISTER CALLBACKS
    // ==================================================

    esp_now_register_send_cb(
        OnDataSent
    );

    esp_now_register_recv_cb(
        OnDataRecv
    );


    // ==================================================
    // ADD CONTROLLER PEER
    // ==================================================

    if(!esp_now_is_peer_exist(controllerMAC))
    {
        esp_now_peer_info_t peerInfo = {};

        memcpy(
            peerInfo.peer_addr,
            controllerMAC,
            6
        );

        peerInfo.channel = ESPNOW_CHANNEL;

        peerInfo.ifidx = WIFI_IF_STA;

        peerInfo.encrypt = false;


        esp_err_t result =
            esp_now_add_peer(&peerInfo);


        if(result != ESP_OK)
        {
            Serial.print(
                "Controller peer add failed: "
            );

            Serial.println(result);

            return;
        }

        Serial.println(
            "Controller peer added"
        );
    }
    else
    {
        Serial.println(
            "Controller peer already exists"
        );
    }


    // ==================================================
    // INITIAL STATE
    // ==================================================

    controllerOnline = false;

    heartbeatReceived = false;

    physicalWaterRequest  = false;
    physicalSoapRequest   = false;
    physicalBlowerRequest = false;
    physicalFaucetRequest = false;
    physicalPauseRequest  = false;

    lastControllerHeartbeat = 0;


    // ==================================================
    // READY
    // ==================================================

    Serial.println();
    Serial.println("==============================");
    Serial.println("LCD ESP-NOW READY");
    Serial.println("==============================");

    Serial.print("Channel: ");
    Serial.println(WiFi.channel());

    Serial.println(
        "Waiting for controller heartbeat..."
    );
}


// ======================================================
// SEND COMMAND TO CONTROLLER
// ======================================================

void sendCommand(
    const char *cmd
)
{
    if(cmd == nullptr)
    {
        return;
    }


    // ==================================================
    // DO NOT BLOCK UI
    //
    // We still allow commands when heartbeat has not
    // arrived yet. ESP-NOW itself tells us whether the
    // packet could be queued.
    //
    // This prevents a race where the LCD starts before
    // the controller's first heartbeat.
    // ==================================================

    memset(
        &msg,
        0,
        sizeof(msg)
    );

    strncpy(
        msg.command,
        cmd,
        sizeof(msg.command) - 1
    );

    msg.command[
        sizeof(msg.command) - 1
    ] = '\0';


    // ==================================================
    // SEND
    // ==================================================

    esp_err_t result =
        esp_now_send(
            controllerMAC,
            (uint8_t *)&msg,
            sizeof(msg)
        );


    if(result != ESP_OK)
    {
        Serial.print(
            "ESP-NOW send error: "
        );

        Serial.println(
            result
        );
    }
}


// ======================================================
// PROCESS PHYSICAL BUTTONS
// ======================================================

void processPhysicalButtons()
{
    // ==================================================
    // PAUSE HAS PRIORITY
    // ==================================================

    if(physicalPauseRequest)
    {
        physicalPauseRequest = false;

        toggleWaterPause();

        return;
    }


    // ==================================================
    // WATER
    // ==================================================

    if(physicalWaterRequest)
    {
        physicalWaterRequest = false;

        if(waterSelected)
        {
            startCustomerWater();
        }

        return;
    }


    // ==================================================
    // SOAP
    // ==================================================

    if(physicalSoapRequest)
    {
        physicalSoapRequest = false;

        if(soapSelected)
        {
            startCustomerSoap();
        }

        return;
    }


    // ==================================================
    // BLOWER
    // ==================================================

    if(physicalBlowerRequest)
    {
        physicalBlowerRequest = false;

        if(blowerSelected)
        {
            startCustomerBlower();
        }

        return;
    }


    // ==================================================
    // FAUCET
    // ==================================================

    if(physicalFaucetRequest)
    {
        physicalFaucetRequest = false;

        if(faucetSelected)
        {
            startCustomerFaucet();
        }

        return;
    }
}

// ======================================================
// ESP-NOW TASK
//
// CALL THIS FROM loop()
// ======================================================

void espnow_task()
{
    unsigned long now = millis();


    // ==================================================
    // PHYSICAL EVENTS
    // ==================================================

    processPhysicalButtons();


    // ==================================================
    // HEARTBEAT
    // ==================================================

    if(heartbeatReceived)
    {
        heartbeatReceived = false;

        if(!controllerOnline)
        {
            controllerOnline = true;

            Serial.println(
                "ESP32 CONTROLLER ONLINE"
            );

            updateControllerIndicator(true);
        }
    }


    // ==================================================
    // CONTROLLER TIMEOUT
    // ==================================================

    if(
        controllerOnline &&
        (now - lastControllerHeartbeat >=
         CONTROLLER_TIMEOUT)
    )
    {
        controllerOnline = false;

        Serial.println(
            "ESP32 CONTROLLER OFFLINE"
        );

        updateControllerIndicator(false);
    }
}
//supabase 
bool isControllerOnline()
{
    return controllerOnline;
}

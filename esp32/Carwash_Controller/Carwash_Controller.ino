#include <WiFi.h>
#include <esp_now.h>
#include <esp_wifi.h>

#define ESPNOW_CHANNEL 11
// ======================================================
// ESP-NOW CHANNEL
// BOTH ESP32 BOARDS MUST USE THE SAME CHANNEL
// ======================================================



// ======================================================
// RELAY PINS
// ======================================================

#define RELAY_WATER   25
#define RELAY_SOAP    26
#define RELAY_BLOWER  32
#define RELAY_FAUCET  33


// ======================================================
// PHYSICAL BUTTONS
// ======================================================

#define BTN_PAUSE         21
#define BTN_WATER_START   18
#define BTN_SOAP_START     5
#define BTN_BLOWER_START  17
#define BTN_FAUCET_START   4


// ======================================================
// BUTTON SETTINGS
// ======================================================

const unsigned long BUTTON_DEBOUNCE = 150;


// ======================================================
// BUTTON STATES
// ======================================================

bool lastPauseState  = HIGH;
bool lastWaterState  = HIGH;
bool lastSoapState   = HIGH;
bool lastBlowerState = HIGH;
bool lastFaucetState = HIGH;

unsigned long lastPauseTime  = 0;
unsigned long lastWaterTime  = 0;
unsigned long lastSoapTime   = 0;
unsigned long lastBlowerTime = 0;
unsigned long lastFaucetTime = 0;


// ======================================================
// LCD ESP32 MAC
// ======================================================

uint8_t lcdMAC[] =
{
    0xDC,
    0xB4,
    0xD9,
    0x04,
    0x3E,
    0xB8
};


// ======================================================
// MESSAGE STRUCTURE
// MUST MATCH LCD
// ======================================================

typedef struct
{
    char command[32];
} Message;

Message incoming;


// ======================================================
// HEARTBEAT
// ======================================================

unsigned long lastHeartbeat = 0;

const unsigned long HEARTBEAT_INTERVAL = 1000;


// ======================================================
// SEND STATUS
// ======================================================

volatile bool sendSuccess = false;
volatile bool sendFailed  = false;


// ======================================================
// SEND CALLBACK
// ======================================================

void OnDataSent(
    const wifi_tx_info_t *info,
    esp_now_send_status_t status
)
{
    if(status == ESP_NOW_SEND_SUCCESS)
    {
        sendSuccess = true;
    }
    else
    {
        sendFailed = true;
    }
}


// ======================================================
// SEND PHYSICAL COMMAND TO LCD
// ======================================================

void sendPhysicalCommand(const char *command)
{
    Message message;

    memset(
        &message,
        0,
        sizeof(message)
    );

    strncpy(
        message.command,
        command,
        sizeof(message.command) - 1
    );

    esp_err_t result = esp_now_send(
        lcdMAC,
        (uint8_t *)&message,
        sizeof(message)
    );

    Serial.print("Physical -> LCD: ");
    Serial.print(command);

    if(result == ESP_OK)
    {
        Serial.println(" | QUEUED");
    }
    else
    {
        Serial.print(" | ERROR ");
        Serial.println(result);
    }
}


// ======================================================
// BUTTON PRESS DETECTION
// NON-BLOCKING
// ======================================================

// ======================================================
// BUTTON DEBOUNCE
// ======================================================



// ======================================================
// BUTTON PRESS DETECTION
//
// One physical press = ONE event.
//
// The button must:
//   1. Be released
//   2. Stay released for debounce time
//   3. Then be pressed again
//
// This prevents double-clicks caused by switch bounce.
// ======================================================

bool buttonPressed(
    uint8_t pin,
    bool &lastState,
    unsigned long &lastTime
)
{
    unsigned long now = millis();

    bool currentState = digitalRead(pin);


    // ==================================================
    // BUTTON PRESSED
    // ==================================================

    if(currentState == LOW)
    {
        // Only accept the press if the previous
        // accepted state was HIGH.

        if(lastState == HIGH)
        {
            if(now - lastTime >= BUTTON_DEBOUNCE)
            {
                lastTime = now;

                // IMPORTANT:
                // Immediately lock this button.
                lastState = LOW;

                return true;
            }
        }

        return false;
    }


    // ==================================================
    // BUTTON RELEASED
    // ==================================================

    if(currentState == HIGH)
    {
        // Only unlock after the debounce period.

        if(now - lastTime >= BUTTON_DEBOUNCE)
        {
            lastState = HIGH;
        }
    }


    return false;
}

// ======================================================
// PHYSICAL BUTTON TASK
// ======================================================

void physicalButtonTask()
{
    // ==================================================
    // PAUSE
    // ==================================================

    if(
        buttonPressed(
            BTN_PAUSE,
            lastPauseState,
            lastPauseTime
        )
    )
    {
        Serial.println(
            "PHYSICAL PAUSE PRESSED"
        );

        sendPhysicalCommand(
            "PHYSICAL_PAUSE"
        );
    }


    // ==================================================
    // WATER
    // ==================================================

    if(
        buttonPressed(
            BTN_WATER_START,
            lastWaterState,
            lastWaterTime
        )
    )
    {
        Serial.println(
            "PHYSICAL WATER PRESSED"
        );

        sendPhysicalCommand(
            "PHYSICAL_WATER"
        );
    }


    // ==================================================
    // SOAP
    // ==================================================

    if(
        buttonPressed(
            BTN_SOAP_START,
            lastSoapState,
            lastSoapTime
        )
    )
    {
        Serial.println(
            "PHYSICAL SOAP PRESSED"
        );

        sendPhysicalCommand(
            "PHYSICAL_SOAP"
        );
    }


    // ==================================================
    // BLOWER
    // ==================================================

    if(
        buttonPressed(
            BTN_BLOWER_START,
            lastBlowerState,
            lastBlowerTime
        )
    )
    {
        Serial.println(
            "PHYSICAL BLOWER PRESSED"
        );

        sendPhysicalCommand(
            "PHYSICAL_BLOWER"
        );
    }


    // ==================================================
    // FAUCET
    // ==================================================

    if(
        buttonPressed(
            BTN_FAUCET_START,
            lastFaucetState,
            lastFaucetTime
        )
    )
    {
        Serial.println(
            "PHYSICAL FAUCET PRESSED"
        );

        sendPhysicalCommand(
            "PHYSICAL_FAUCET"
        );
    }
}


// ======================================================
// RECEIVE COMMANDS FROM LCD
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

    if(
        len < (int)sizeof(Message)
    )
    {
        Serial.println(
            "Invalid packet size"
        );

        return;
    }


    memset(
        &incoming,
        0,
        sizeof(incoming)
    );

    memcpy(
        &incoming,
        data,
        sizeof(incoming)
    );

    incoming.command[
        sizeof(incoming.command) - 1
    ] = '\0';


    Serial.print(
        "Received from LCD: "
    );

    Serial.println(
        incoming.command
    );


    // ==================================================
    // WATER
    // ==================================================

    if(
        strcmp(
            incoming.command,
            "WATER_START"
        ) == 0
    )
    {
        digitalWrite(
            RELAY_WATER,
            LOW
        );

        Serial.println(
            "Water Relay ON"
        );
    }

    else if(
        strcmp(
            incoming.command,
            "WATER_STOP"
        ) == 0
    )
    {
        digitalWrite(
            RELAY_WATER,
            HIGH
        );

        Serial.println(
            "Water Relay OFF"
        );
    }


    // ==================================================
    // SOAP
    // ==================================================

    else if(
        strcmp(
            incoming.command,
            "SOAP_START"
        ) == 0
    )
    {
        digitalWrite(
            RELAY_SOAP,
            LOW
        );

        Serial.println(
            "Soap Relay ON"
        );
    }

    else if(
        strcmp(
            incoming.command,
            "SOAP_STOP"
        ) == 0
    )
    {
        digitalWrite(
            RELAY_SOAP,
            HIGH
        );

        Serial.println(
            "Soap Relay OFF"
        );
    }


    // ==================================================
    // BLOWER
    // ==================================================

    else if(
        strcmp(
            incoming.command,
            "BLOWER_START"
        ) == 0
    )
    {
        digitalWrite(
            RELAY_BLOWER,
            LOW
        );

        Serial.println(
            "Blower Relay ON"
        );
    }

    else if(
        strcmp(
            incoming.command,
            "BLOWER_STOP"
        ) == 0
    )
    {
        digitalWrite(
            RELAY_BLOWER,
            HIGH
        );

        Serial.println(
            "Blower Relay OFF"
        );
    }


    // ==================================================
    // FAUCET
    // ==================================================

    else if(
        strcmp(
            incoming.command,
            "FAUCET_START"
        ) == 0
    )
    {
        digitalWrite(
            RELAY_FAUCET,
            LOW
        );

        Serial.println(
            "Faucet Relay ON"
        );
    }

    else if(
        strcmp(
            incoming.command,
            "FAUCET_STOP"
        ) == 0
    )
    {
        digitalWrite(
            RELAY_FAUCET,
            HIGH
        );

        Serial.println(
            "Faucet Relay OFF"
        );
    }
}


// ======================================================
// SEND HEARTBEAT
// ======================================================
void sendHeartbeat()
{
    Message heartbeat;

    memset(
        &heartbeat,
        0,
        sizeof(heartbeat)
    );

    strcpy(
        heartbeat.command,
        "ONLINE"
    );

    esp_err_t result = esp_now_send(
        lcdMAC,
        (uint8_t *)&heartbeat,
        sizeof(heartbeat)
    );

    Serial.print("Heartbeat -> LCD: ");

    if(result == ESP_OK)
    {
        Serial.println("QUEUED");
    }
    else
    {
        Serial.print("ERROR ");
        Serial.println(result);
    }
}


// ======================================================
// SETUP
// ======================================================

void setup()
{
    Serial.begin(115200);

    delay(500);

    Serial.println();
    Serial.println(
        "=============================="
    );
    Serial.println(
        "CARWASH CONTROLLER STARTING"
    );
    Serial.println(
        "=============================="
    );


    // ==================================================
    // RELAYS
    // ==================================================

    pinMode(
        RELAY_WATER,
        OUTPUT
    );

    pinMode(
        RELAY_SOAP,
        OUTPUT
    );

    pinMode(
        RELAY_BLOWER,
        OUTPUT
    );

    pinMode(
        RELAY_FAUCET,
        OUTPUT
    );


    // Active LOW
    // HIGH = OFF

    digitalWrite(
        RELAY_WATER,
        HIGH
    );

    digitalWrite(
        RELAY_SOAP,
        HIGH
    );

    digitalWrite(
        RELAY_BLOWER,
        HIGH
    );

    digitalWrite(
        RELAY_FAUCET,
        HIGH
    );


    // ==================================================
    // BUTTONS
    // ==================================================

    pinMode(
        BTN_PAUSE,
        INPUT_PULLUP
    );

    pinMode(
        BTN_WATER_START,
        INPUT_PULLUP
    );

    pinMode(
        BTN_SOAP_START,
        INPUT_PULLUP
    );

    pinMode(
        BTN_BLOWER_START,
        INPUT_PULLUP
    );

    pinMode(
        BTN_FAUCET_START,
        INPUT_PULLUP
    );


    // ==================================================
    // READ INITIAL STATES
    // ==================================================

    lastPauseState =
        digitalRead(BTN_PAUSE);

    lastWaterState =
        digitalRead(BTN_WATER_START);

    lastSoapState =
        digitalRead(BTN_SOAP_START);

    lastBlowerState =
        digitalRead(BTN_BLOWER_START);

    lastFaucetState =
        digitalRead(BTN_FAUCET_START);


    // ==================================================
    // WIFI
    // ==================================================

    WiFi.mode(WIFI_STA);

    WiFi.disconnect();

    delay(100);


    // ==================================================
    // FORCE ESP-NOW CHANNEL
    // ==================================================

    esp_wifi_set_channel(
        ESPNOW_CHANNEL,
        WIFI_SECOND_CHAN_NONE
    );


    Serial.print(
        "Controller MAC: "
    );

    Serial.println(
        WiFi.macAddress()
    );

    Serial.print(
        "ESP-NOW Channel: "
    );

    Serial.println(
        ESPNOW_CHANNEL
    );


    // ==================================================
    // ESP-NOW
    // ==================================================

    if(
        esp_now_init() != ESP_OK
    )
    {
        Serial.println(
            "ESP-NOW INIT FAILED"
        );

        return;
    }


    // ==================================================
    // SEND CALLBACK
    // ==================================================

    esp_now_register_send_cb(
        OnDataSent
    );


    // ==================================================
    // RECEIVE CALLBACK
    // ==================================================

    esp_now_register_recv_cb(
        OnDataRecv
    );


    // ==================================================
    // ADD LCD PEER
    // ==================================================

    if(
        !esp_now_is_peer_exist(
            lcdMAC
        )
    )
    {
        esp_now_peer_info_t peerInfo = {};

        memcpy(
            peerInfo.peer_addr,
            lcdMAC,
            6
        );

        peerInfo.channel =
            ESPNOW_CHANNEL;

        peerInfo.encrypt = false;

        esp_err_t result =
            esp_now_add_peer(
                &peerInfo
            );

        if(result != ESP_OK)
        {
            Serial.print(
                "LCD peer add failed: "
            );

            Serial.println(
                result
            );

            return;
        }

        Serial.println(
            "LCD peer added"
        );
    }


    // ==================================================
    // READY
    // ==================================================

    Serial.println();
    Serial.println(
        "=============================="
    );
    Serial.println(
        "CONTROLLER READY"
    );
    Serial.println(
        "=============================="
    );

    Serial.println(
        "Heartbeat: 1 second"
    );

    Serial.println(
        "Buttons: NON-BLOCKING"
    );


    // ==================================================
    // WAIT FOR LCD TO BE READY
    // ==================================================

    delay(500);

    sendHeartbeat();

    lastHeartbeat = millis();
}


// ======================================================
// LOOP
// ======================================================

void loop()
{
    // ==================================================
    // PHYSICAL BUTTONS
    // ==================================================

    physicalButtonTask();


    // ==================================================
    // HEARTBEAT
    // ==================================================

    unsigned long now = millis();

    if(
        now - lastHeartbeat >=
        HEARTBEAT_INTERVAL
    )
    {
        lastHeartbeat = now;

        sendHeartbeat();
    }


    // Very short yield
    delay(2);
}

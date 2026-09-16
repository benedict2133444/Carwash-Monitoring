/*
 * ============================================================
 * CARWASH CONTROLLER - WIRED UART
 * ============================================================
 *
 * LOCAL CONTROL:
 *   LCD ESP32-S3 <-> Controller ESP32-S3
 *
 * UART WIRING:
 *
 *   LCD GPIO17 TX  ->  Controller GPIO22 RX
 *   LCD GPIO18 RX  <-  Controller GPIO23 TX
 *   LCD GND        ->  Controller GND
 *
 * DO NOT CONNECT 3.3V BETWEEN THE BOARDS.
 *
 *
 * RELAYS - ACTIVE LOW:
 *
 *   LOW  = ON
 *   HIGH = OFF
 *
 *   WATER   = GPIO25
 *   SOAP    = GPIO26
 *   BLOWER  = GPIO27
 *   FAUCET  = GPIO33
 *
 *
 * PHYSICAL BUTTONS - INPUT_PULLUP:
 *
 *   PAUSE  = GPIO21
 *   WATER  = GPIO18
 *   SOAP   = GPIO5
 *   BLOWER = GPIO17
 *   FAUCET = GPIO4
 *
 *
 * UART PROTOCOL:
 *
 *   LCD -> Controller:
 *     <WATER_START>
 *     <WATER_STOP>
 *     <SOAP_START>
 *     <SOAP_STOP>
 *     <BLOWER_START>
 *     <BLOWER_STOP>
 *     <FAUCET_START>
 *     <FAUCET_STOP>
 *     <ALL_STOP>
 *     <PING>
 *
 *   Controller -> LCD:
 *     <ONLINE>
 *     <PHYSICAL_PAUSE>
 *     <PHYSICAL_WATER>
 *     <PHYSICAL_SOAP>
 *     <PHYSICAL_BLOWER>
 *     <PHYSICAL_FAUCET>
 *     ACK messages
 *
 * Wi-Fi is secondary only.
 * Local UART and physical buttons continue working
 * when Wi-Fi is unavailable.
 *
 * ============================================================
 */

#include <Arduino.h>
#include <WiFi.h>
#include "secrets.h"


// ============================================================
// UART
// ============================================================

#define CONTROLLER_UART_RX 22
#define CONTROLLER_UART_TX 23

#define UART_BAUD 115200

HardwareSerial CarwashUART(1);


// ============================================================
// RELAY OUTPUTS
// ============================================================
//
// ACTIVE LOW:
//
//   LOW  = ON
//   HIGH = OFF
//
// IMPORTANT:
// BLOWER IS GPIO27.
// FAUCET IS GPIO33.
// ============================================================

#define RELAY_WATER   25
#define RELAY_SOAP    26
#define RELAY_BLOWER  27
#define RELAY_FAUCET  33


// ============================================================
// PHYSICAL BUTTON INPUTS
// ============================================================
//
// INPUT_PULLUP:
//
//   HIGH = RELEASED
//   LOW  = PRESSED
// ============================================================

#define BTN_PAUSE         21
#define BTN_WATER_START   18
#define BTN_SOAP_START     5
#define BTN_BLOWER_START  17
#define BTN_FAUCET_START   4


// ============================================================
// BUTTON TIMING
// ============================================================

const unsigned long BUTTON_DEBOUNCE =
    150UL;

const unsigned long PAUSE_RELEASE_DEBOUNCE =
    500UL;


// ============================================================
// BUTTON STATES
// ============================================================

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


// ============================================================
// PAUSE BUTTON LOCK
// ============================================================
//
// One physical press produces exactly ONE
// PHYSICAL_PAUSE command.
//
// The button must be released before another
// PAUSE command can be generated.
// ============================================================

bool pauseLocked = false;

unsigned long pauseReleaseTime = 0;


// ============================================================
// UART RECEIVE STATE
// ============================================================

static char uartFrame[64];

static size_t uartFrameLength = 0;

static bool uartInFrame = false;


// ============================================================
// HEARTBEAT
// ============================================================

unsigned long lastHeartbeat = 0;

const unsigned long HEARTBEAT_INTERVAL =
    5000UL;


// ============================================================
// WIFI
// ============================================================
//
// Wi-Fi is secondary/background only.
// It does NOT control the relays.
// ============================================================

unsigned long lastWiFiAttempt = 0;

const unsigned long WIFI_RETRY_INTERVAL =
    30000UL;

const unsigned long WIFI_CONNECT_TIMEOUT =
    10000UL;


// ============================================================
// FUNCTION DECLARATIONS
// ============================================================

void sendFrame(
    const char *message
);

void sendPhysicalCommand(
    const char *command
);

void processUARTReceive();

void processUARTCommand(
    const char *command
);

bool buttonPressed(
    uint8_t pin,
    bool &lastState,
    unsigned long &lastTime
);

bool pauseButtonPressed();

void physicalButtonTask();

void sendHeartbeat();

void startWiFi();

void wifiTask();


// ============================================================
// SEND UART FRAME
// ============================================================
//
// Format:
//
//   <COMMAND>
//
// ============================================================

void sendFrame(
    const char *message
)
{
    CarwashUART.print("<");
    CarwashUART.print(message);
    CarwashUART.print(">\n");

    Serial.print("UART TX -> LCD: <");
    Serial.print(message);
    Serial.println(">");
}


// ============================================================
// SEND PHYSICAL BUTTON COMMAND
// ============================================================

void sendPhysicalCommand(
    const char *command
)
{
    Serial.print("PHYSICAL -> ");
    Serial.println(command);

    sendFrame(command);
}


// ============================================================
// NORMAL BUTTON PRESS DETECTION
// ============================================================
//
// Returns TRUE only once when a button changes:
//
//   HIGH -> LOW
//
// after debounce.
// ============================================================

bool buttonPressed(
    uint8_t pin,
    bool &lastState,
    unsigned long &lastTime
)
{
    const bool currentState =
        digitalRead(pin);

    const unsigned long now =
        millis();


    // --------------------------------------------------------
    // BUTTON CURRENTLY PRESSED
    // --------------------------------------------------------

    if(currentState == LOW)
    {
        if(
            lastState == HIGH &&
            now - lastTime >= BUTTON_DEBOUNCE
        )
        {
            lastTime = now;
            lastState = LOW;

            return true;
        }

        return false;
    }


    // --------------------------------------------------------
    // BUTTON RELEASED
    // --------------------------------------------------------

    if(
        now - lastTime >= BUTTON_DEBOUNCE
    )
    {
        lastState = HIGH;
    }

    return false;
}


// ============================================================
// PAUSE BUTTON
// ============================================================
//
// One press = one PAUSE command.
//
// Holding the button does NOT repeatedly send PAUSE.
//
// The button must be released for
// PAUSE_RELEASE_DEBOUNCE milliseconds.
// ============================================================

bool pauseButtonPressed()
{
    const bool currentState =
        digitalRead(BTN_PAUSE);

    const unsigned long now =
        millis();


    // --------------------------------------------------------
    // BUTTON PRESSED
    // --------------------------------------------------------

    if(currentState == LOW)
    {
        pauseReleaseTime = 0;


        if(!pauseLocked)
        {
            if(
                now - lastPauseTime >=
                BUTTON_DEBOUNCE
            )
            {
                lastPauseTime = now;

                pauseLocked = true;

                Serial.println(
                    "PHYSICAL PAUSE"
                );

                return true;
            }
        }
    }


    // --------------------------------------------------------
    // BUTTON RELEASED
    // --------------------------------------------------------

    else
    {
        if(pauseLocked)
        {
            if(pauseReleaseTime == 0)
            {
                pauseReleaseTime = now;
            }


            if(
                now - pauseReleaseTime >=
                PAUSE_RELEASE_DEBOUNCE
            )
            {
                pauseLocked = false;

                pauseReleaseTime = 0;

                lastPauseTime = now;

                Serial.println(
                    "PAUSE BUTTON READY"
                );
            }
        }
    }

    return false;
}


// ============================================================
// PHYSICAL BUTTON TASK
// ============================================================

void physicalButtonTask()
{
    // --------------------------------------------------------
    // PAUSE
    // --------------------------------------------------------

    if(pauseButtonPressed())
    {
        sendPhysicalCommand(
            "PHYSICAL_PAUSE"
        );
    }


    // --------------------------------------------------------
    // WATER
    // --------------------------------------------------------

    if(
        buttonPressed(
            BTN_WATER_START,
            lastWaterState,
            lastWaterTime
        )
    )
    {
        sendPhysicalCommand(
            "PHYSICAL_WATER"
        );
    }


    // --------------------------------------------------------
    // SOAP
    // --------------------------------------------------------

    if(
        buttonPressed(
            BTN_SOAP_START,
            lastSoapState,
            lastSoapTime
        )
    )
    {
        sendPhysicalCommand(
            "PHYSICAL_SOAP"
        );
    }


    // --------------------------------------------------------
    // BLOWER
    // --------------------------------------------------------

    if(
        buttonPressed(
            BTN_BLOWER_START,
            lastBlowerState,
            lastBlowerTime
        )
    )
    {
        sendPhysicalCommand(
            "PHYSICAL_BLOWER"
        );
    }


    // --------------------------------------------------------
    // FAUCET
    // --------------------------------------------------------

    if(
        buttonPressed(
            BTN_FAUCET_START,
            lastFaucetState,
            lastFaucetTime
        )
    )
    {
        sendPhysicalCommand(
            "PHYSICAL_FAUCET"
        );
    }
}


// ============================================================
// PROCESS COMMAND RECEIVED FROM LCD
// ============================================================

void processUARTCommand(
    const char *command
)
{
    Serial.print("UART RX <- LCD: ");
    Serial.println(command);


    // ========================================================
    // WATER
    // ========================================================

    if(
        strcmp(
            command,
            "WATER_START"
        ) == 0
    )
    {
        digitalWrite(
            RELAY_WATER,
            LOW
        );

        Serial.println(
            "WATER RELAY ON"
        );

        sendFrame(
            "WATER_ACK"
        );
    }

    else if(
        strcmp(
            command,
            "WATER_STOP"
        ) == 0
    )
    {
        digitalWrite(
            RELAY_WATER,
            HIGH
        );

        Serial.println(
            "WATER RELAY OFF"
        );

        sendFrame(
            "WATER_ACK"
        );
    }


    // ========================================================
    // SOAP
    // ========================================================

    else if(
        strcmp(
            command,
            "SOAP_START"
        ) == 0
    )
    {
        digitalWrite(
            RELAY_SOAP,
            LOW
        );

        Serial.println(
            "SOAP RELAY ON"
        );

        sendFrame(
            "SOAP_ACK"
        );
    }

    else if(
        strcmp(
            command,
            "SOAP_STOP"
        ) == 0
    )
    {
        digitalWrite(
            RELAY_SOAP,
            HIGH
        );

        Serial.println(
            "SOAP RELAY OFF"
        );

        sendFrame(
            "SOAP_ACK"
        );
    }


    // ========================================================
    // BLOWER
    // ========================================================
    //
    // BLOWER RELAY = GPIO27
    // ========================================================

    else if(
        strcmp(
            command,
            "BLOWER_START"
        ) == 0
    )
    {
        digitalWrite(
            RELAY_BLOWER,
            LOW
        );

        Serial.println(
            "BLOWER RELAY ON - GPIO27"
        );

        sendFrame(
            "BLOWER_ACK"
        );
    }

    else if(
        strcmp(
            command,
            "BLOWER_STOP"
        ) == 0
    )
    {
        digitalWrite(
            RELAY_BLOWER,
            HIGH
        );

        Serial.println(
            "BLOWER RELAY OFF - GPIO27"
        );

        sendFrame(
            "BLOWER_ACK"
        );
    }


    // ========================================================
    // FAUCET
    // ========================================================

    else if(
        strcmp(
            command,
            "FAUCET_START"
        ) == 0
    )
    {
        digitalWrite(
            RELAY_FAUCET,
            LOW
        );

        Serial.println(
            "FAUCET RELAY ON"
        );

        sendFrame(
            "FAUCET_ACK"
        );
    }

    else if(
        strcmp(
            command,
            "FAUCET_STOP"
        ) == 0
    )
    {
        digitalWrite(
            RELAY_FAUCET,
            HIGH
        );

        Serial.println(
            "FAUCET RELAY OFF"
        );

        sendFrame(
            "FAUCET_ACK"
        );
    }


    // ========================================================
    // ALL STOP
    // ========================================================

    else if(
        strcmp(
            command,
            "ALL_STOP"
        ) == 0
    )
    {
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

        Serial.println(
            "ALL RELAYS OFF"
        );

        sendFrame(
            "ALL_STOP_ACK"
        );
    }


    // ========================================================
    // PING
    // ========================================================

    else if(
        strcmp(
            command,
            "PING"
        ) == 0
    )
    {
        sendFrame(
            "PONG"
        );
    }


    // ========================================================
    // UNKNOWN COMMAND
    // ========================================================

    else
    {
        Serial.print(
            "UNKNOWN UART COMMAND: "
        );

        Serial.println(command);

        sendFrame(
            "UNKNOWN_COMMAND"
        );
    }
}


// ============================================================
// RECEIVE UART DATA
// ============================================================
//
// Expected:
//
//   <WATER_START>
//   <WATER_STOP>
//   <SOAP_START>
//   <SOAP_STOP>
//   <BLOWER_START>
//   <BLOWER_STOP>
//   <FAUCET_START>
//   <FAUCET_STOP>
//   <ALL_STOP>
//   <PING>
// ============================================================

void processUARTReceive()
{
    while(
        CarwashUART.available() > 0
    )
    {
        const char c =
            (char)CarwashUART.read();


        // ----------------------------------------------------
        // START FRAME
        // ----------------------------------------------------

        if(c == '<')
        {
            uartInFrame = true;

            uartFrameLength = 0;

            uartFrame[0] = '\0';

            continue;
        }


        // ----------------------------------------------------
        // END FRAME
        // ----------------------------------------------------

        if(c == '>')
        {
            if(uartInFrame)
            {
                uartFrame[
                    uartFrameLength
                ] = '\0';


                if(
                    uartFrameLength > 0
                )
                {
                    processUARTCommand(
                        uartFrame
                    );
                }
            }

            uartInFrame = false;

            uartFrameLength = 0;

            continue;
        }


        // ----------------------------------------------------
        // STORE FRAME DATA
        // ----------------------------------------------------

        if(uartInFrame)
        {
            if(
                c != '\n' &&
                c != '\r'
            )
            {
                if(
                    uartFrameLength <
                    sizeof(uartFrame) - 1
                )
                {
                    uartFrame[
                        uartFrameLength++
                    ] = c;

                    uartFrame[
                        uartFrameLength
                    ] = '\0';
                }
                else
                {
                    // Frame too long.
                    // Discard it safely.

                    uartInFrame = false;

                    uartFrameLength = 0;
                }
            }
        }
    }
}


// ============================================================
// HEARTBEAT
// ============================================================
//
// Sends ONLINE to LCD every 5 seconds.
// ============================================================

void sendHeartbeat()
{
    const unsigned long now =
        millis();


    if(
        now - lastHeartbeat >=
        HEARTBEAT_INTERVAL
    )
    {
        lastHeartbeat = now;

        sendFrame(
            "ONLINE"
        );
    }
}


// ============================================================
// START WIFI
// ============================================================
//
// Wi-Fi is secondary.
// The controller continues operating if Wi-Fi fails.
// ============================================================

void startWiFi()
{
    if(
        WiFi.status() ==
        WL_CONNECTED
    )
    {
        return;
    }


    Serial.println();
    Serial.println(
        "Starting secondary Wi-Fi..."
    );


    WiFi.mode(
        WIFI_STA
    );


    WiFi.setSleep(
        false
    );


    WiFi.begin(
        CARWASH_WIFI_SSID,
        CARWASH_WIFI_PASSWORD
    );


    lastWiFiAttempt =
        millis();
}


// ============================================================
// WIFI BACKGROUND TASK
// ============================================================
//
// IMPORTANT:
// This task never controls relays.
//
// UART + physical buttons continue operating
// regardless of Wi-Fi state.
// ============================================================

void wifiTask()
{
    if(
        WiFi.status() ==
        WL_CONNECTED
    )
    {
        return;
    }


    const unsigned long now =
        millis();


    if(
        now - lastWiFiAttempt >=
        WIFI_RETRY_INTERVAL
    )
    {
        startWiFi();
    }
}


// ============================================================
// SETUP
// ============================================================

void setup()
{
    // --------------------------------------------------------
    // SERIAL MONITOR
    // --------------------------------------------------------

    Serial.begin(
        115200
    );

    delay(1000);


    Serial.println();

    Serial.println(
        "========================================"
    );

    Serial.println(
        "CARWASH CONTROLLER"
    );

    Serial.println(
        "WIRED UART VERSION"
    );

    Serial.println(
        "========================================"
    );


    // --------------------------------------------------------
    // PIN MAP
    // --------------------------------------------------------

    Serial.println(
        "RELAY WATER   = GPIO25"
    );

    Serial.println(
        "RELAY SOAP    = GPIO26"
    );

    Serial.println(
        "RELAY BLOWER  = GPIO27"
    );

    Serial.println(
        "RELAY FAUCET  = GPIO33"
    );


    Serial.println(
        "UART RX       = GPIO22"
    );

    Serial.println(
        "UART TX       = GPIO23"
    );


    Serial.println(
        "========================================"
    );


    // --------------------------------------------------------
    // RELAY OUTPUTS
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // ACTIVE-LOW RELAYS
    //
    // HIGH = OFF
    // --------------------------------------------------------

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


    Serial.println(
        "All relays initialized OFF."
    );


    // --------------------------------------------------------
    // BUTTON INPUTS
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // READ INITIAL BUTTON STATES
    // --------------------------------------------------------

    lastPauseState =
        digitalRead(
            BTN_PAUSE
        );

    lastWaterState =
        digitalRead(
            BTN_WATER_START
        );

    lastSoapState =
        digitalRead(
            BTN_SOAP_START
        );

    lastBlowerState =
        digitalRead(
            BTN_BLOWER_START
        );

    lastFaucetState =
        digitalRead(
            BTN_FAUCET_START
        );


    // --------------------------------------------------------
    // UART
    // --------------------------------------------------------
    //
    // LCD:
    //   GPIO17 TX -> Controller GPIO22 RX
    //   GPIO18 RX <- Controller GPIO23 TX
    // --------------------------------------------------------

    CarwashUART.begin(
        UART_BAUD,
        SERIAL_8N1,
        CONTROLLER_UART_RX,
        CONTROLLER_UART_TX
    );


    Serial.println();
    Serial.println(
        "UART initialized."
    );

    Serial.println(
        "Controller RX = GPIO22"
    );

    Serial.println(
        "Controller TX = GPIO23"
    );

    Serial.println(
        "Baud = 115200"
    );


    // --------------------------------------------------------
    // INITIAL HEARTBEAT
    // --------------------------------------------------------

    delay(300);

    sendFrame(
        "ONLINE"
    );

    lastHeartbeat =
        millis();


    // --------------------------------------------------------
    // WIFI
    // --------------------------------------------------------
    //
    // Start Wi-Fi as a secondary background service.
    //
    // No relay depends on Wi-Fi.
    // --------------------------------------------------------

    WiFi.mode(
        WIFI_STA
    );

    WiFi.setSleep(
        false
    );

    lastWiFiAttempt =
        millis();


    // --------------------------------------------------------
    // READY
    // --------------------------------------------------------

    Serial.println();

    Serial.println(
        "========================================"
    );

    Serial.println(
        "CONTROLLER READY"
    );

    Serial.println(
        "========================================"
    );

    Serial.println(
        "LOCAL CONTROL : UART"
    );

    Serial.println(
        "UART          : PRIMARY"
    );

    Serial.println(
        "PHYSICAL BTNS : ACTIVE"
    );

    Serial.println(
        "WIFI          : SECONDARY"
    );

    Serial.println(
        "BLOWER RELAY  : GPIO27"
    );

    Serial.println(
        "========================================"
    );
}


// ============================================================
// MAIN LOOP
// ============================================================

void loop()
{
    // --------------------------------------------------------
    // UART FIRST
    // --------------------------------------------------------

    processUARTReceive();


    // --------------------------------------------------------
    // PHYSICAL BUTTONS
    // --------------------------------------------------------

    physicalButtonTask();


    // --------------------------------------------------------
    // HEARTBEAT
    // --------------------------------------------------------

    sendHeartbeat();


    // --------------------------------------------------------
    // WIFI BACKGROUND
    // --------------------------------------------------------

    wifiTask();


    // --------------------------------------------------------
    // VERY SHORT COOPERATIVE DELAY
    // --------------------------------------------------------

    delay(1);
}

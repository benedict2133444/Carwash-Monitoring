#include "ui.h"
#include <lvgl.h>

#include "commands.h"
#include "carwash_logic.h"

#include <Arduino.h>

#define UART_DEBUG 0

// ======================================================
// STEP 2 UART - CLEAN FRAMED PROTOCOL
// ======================================================
//
// LCD:
//   IO17 = TX
//   IO18 = RX
//   GND  = GND
//
// Controller:
//   GPIO22 = RX
//   GPIO23 = TX
//
// Wiring:
//   LCD IO17 -> Controller GPIO22
//   LCD IO18 <- Controller GPIO23
//   LCD GND  -> Controller GND
//
// UART carries ONLY protocol frames.
// USB Serial is used ONLY for diagnostics.
//
// Frame format:
//   <ONLINE>\n
//   <WATER_START>\n
//   <WATER_STOP>\n
//   ...
// ======================================================

static const int LCD_UART_TX = 17;
static const int LCD_UART_RX = 18;
static const uint32_t UART_BAUD = 115200;

HardwareSerial CarwashUART(2);

volatile unsigned long lastControllerHeartbeat = 0;
volatile bool heartbeatReceived = false;
bool controllerOnline = false;

const unsigned long CONTROLLER_TIMEOUT = 15000UL;

volatile bool physicalWaterRequest  = false;
volatile bool physicalSoapRequest   = false;
volatile bool physicalBlowerRequest = false;
volatile bool physicalFaucetRequest = false;
volatile bool physicalPauseRequest  = false;

extern bool waterSelected;
extern bool soapSelected;
extern bool blowerSelected;
extern bool faucetSelected;

static void sendFrame(const char *command)
{
    if(command == nullptr)
        return;

    CarwashUART.print('<');
    CarwashUART.print(command);
    CarwashUART.print(">\n");
    // DO NOT call flush() here. UART TX is already buffered and this
    // function must never wait for the wire to empty.
#if UART_DEBUG
    Serial.print("UART TX -> Controller: ");
    Serial.println(command);
#endif
}

static void processUARTReceive()
{
    static char frame[64];
    static size_t length = 0;
    static bool inFrame = false;

    while(CarwashUART.available() > 0)
    {
        const char c = (char)CarwashUART.read();

        if(c == '<')
        {
            inFrame = true;
            length = 0;
            continue;
        }

        if(!inFrame)
            continue;

        if(c == '>')
        {
            frame[length] = '\0';
            inFrame = false;

            if(length == 0)
                continue;

#if UART_DEBUG
            Serial.print("UART RX <- Controller: ");
            Serial.println(frame);
#endif

            if(strcmp(frame, "ONLINE") == 0)
            {
                lastControllerHeartbeat = millis();
                heartbeatReceived = true;
            }
            else if(strcmp(frame, "PHYSICAL_WATER") == 0)
            {
                physicalWaterRequest = true;
            }
            else if(strcmp(frame, "PHYSICAL_SOAP") == 0)
            {
                physicalSoapRequest = true;
            }
            else if(strcmp(frame, "PHYSICAL_BLOWER") == 0)
            {
                physicalBlowerRequest = true;
            }
            else if(strcmp(frame, "PHYSICAL_FAUCET") == 0)
            {
                physicalFaucetRequest = true;
            }
            else if(strcmp(frame, "PHYSICAL_PAUSE") == 0)
            {
                physicalPauseRequest = true;
            }

            continue;
        }

        // Ignore line breaks inside a frame.
        if(c == '\r' || c == '\n')
            continue;

        if(length < sizeof(frame) - 1)
        {
            frame[length++] = c;
        }
        else
        {
            // Corrupt/oversize frame: reset parser.
            inFrame = false;
            length = 0;
        }
    }
}

void updateControllerIndicator(bool online)
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

void uart_comm_init()
{
    CarwashUART.begin(
        UART_BAUD,
        SERIAL_8N1,
        LCD_UART_RX,
        LCD_UART_TX
    );

    controllerOnline = false;
    heartbeatReceived = false;

    physicalWaterRequest  = false;
    physicalSoapRequest   = false;
    physicalBlowerRequest = false;
    physicalFaucetRequest = false;
    physicalPauseRequest  = false;

    lastControllerHeartbeat = 0;

    Serial.println();
    Serial.println("========================================");
    Serial.println("WIRED UART COMMUNICATION READY");
    Serial.println("========================================");
    Serial.print("LCD TX GPIO: ");
    Serial.println(LCD_UART_TX);
    Serial.print("LCD RX GPIO: ");
    Serial.println(LCD_UART_RX);
    Serial.print("UART baud: ");
    Serial.println(UART_BAUD);
    Serial.println("Protocol: <COMMAND>\\n");
    Serial.println("ESP-NOW is NOT used.");
    Serial.println("========================================");
}

void sendCommand(const char *cmd)
{
    sendFrame(cmd);
}

void processPhysicalButtons()
{
    if(physicalPauseRequest)
    {
        physicalPauseRequest = false;
        toggleWaterPause();
        return;
    }

    if(physicalWaterRequest)
    {
        physicalWaterRequest = false;

        if(waterSelected)
            startCustomerWater();

        return;
    }

    if(physicalSoapRequest)
    {
        physicalSoapRequest = false;

        if(soapSelected)
            startCustomerSoap();

        return;
    }

    if(physicalBlowerRequest)
    {
        physicalBlowerRequest = false;

        if(blowerSelected)
            startCustomerBlower();

        return;
    }

    if(physicalFaucetRequest)
    {
        physicalFaucetRequest = false;

        if(faucetSelected)
            startCustomerFaucet();

        return;
    }
}

void uart_comm_task()
{
    const unsigned long now = millis();

    processUARTReceive();
    processPhysicalButtons();

    if(heartbeatReceived)
    {
        heartbeatReceived = false;

        if(!controllerOnline)
        {
            controllerOnline = true;

            Serial.println(
                "CONTROLLER ONLINE (WIRED UART)"
            );

            updateControllerIndicator(true);
        }
    }

    if(
        controllerOnline &&
        now - lastControllerHeartbeat >=
            CONTROLLER_TIMEOUT
    )
    {
        controllerOnline = false;

        Serial.println(
            "CONTROLLER OFFLINE (WIRED UART)"
        );

        updateControllerIndicator(false);
    }
}

bool isControllerOnline()
{
    return controllerOnline;
}

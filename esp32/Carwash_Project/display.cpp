#include "display.h"

#define TFT_BL 2

Arduino_ESP32RGBPanel *bus = new Arduino_ESP32RGBPanel(
    40, 41, 39, 42,
    45, 48, 47, 21, 14,
    5, 6, 7, 15, 16, 4,
    8, 3, 46, 9, 1,
    0, 8, 4, 8,
    0, 8, 4, 8,
    1,
    16000000,
    false,
    0,
    0
);

Arduino_GFX *gfx = new Arduino_RGB_Display(
    800,
    480,
    bus,
    0,
    true
);

bool display_init()
{
    if (!gfx->begin())
    {
        return false;
    }

    pinMode(TFT_BL, OUTPUT);
    digitalWrite(TFT_BL, HIGH);

    gfx->fillScreen(0x0000);

    return true;
}

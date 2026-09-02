#include "touch.h"
#include "display.h"

TAMC_GT911 ts(
    TOUCH_GT911_SDA,
    TOUCH_GT911_SCL,
    TOUCH_GT911_INT,
    TOUCH_GT911_RST,
    TOUCH_MAP_X1,
    TOUCH_MAP_Y1
);

int touch_last_x = 0;
int touch_last_y = 0;

static bool wasTouched = false;

void touch_init()
{
    Wire.begin(TOUCH_GT911_SDA, TOUCH_GT911_SCL);

    Serial.println("Scanning I2C...");

    for (uint8_t addr = 1; addr < 127; addr++)
    {
        Wire.beginTransmission(addr);
        if (Wire.endTransmission() == 0)
        {
            Serial.printf("Found I2C device: 0x%02X\n", addr);
        }
    }

    ts.begin();
    ts.setRotation(TOUCH_ROTATION);

    Serial.println("GT911 initialized.");
}

bool touch_has_signal()
{
    return true;
}

bool touch_touched()
{
    ts.read();

    if (ts.isTouched)
    {
        wasTouched = true;

        touch_last_x = map(ts.points[0].x,
                           TOUCH_MAP_X1,
                           TOUCH_MAP_X2,
                           0,
                           gfx->width() - 1);

        touch_last_y = map(ts.points[0].y,
                           TOUCH_MAP_Y1,
                           TOUCH_MAP_Y2,
                           0,
                           gfx->height() - 1);

        return true;
    }

    return false;
}


bool touch_released()
{
    ts.read();

    if (!ts.isTouched && wasTouched)
    {
        wasTouched = false;
        return true;
    }

    return false;
}

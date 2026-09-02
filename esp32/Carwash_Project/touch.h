#ifndef TOUCH_H
#define TOUCH_H

#include <Wire.h>
#include <TAMC_GT911.h>
#include "display.h"
// =============================
// GT911 Configuration
// =============================
#define TOUCH_GT911_SCL 20
#define TOUCH_GT911_SDA 19
#define TOUCH_GT911_INT 39
#define TOUCH_GT911_RST 38

#define TOUCH_MAP_X1 800
#define TOUCH_MAP_X2 0
#define TOUCH_MAP_Y1 480
#define TOUCH_MAP_Y2 0

#define TOUCH_ROTATION ROTATION_NORMAL

extern int touch_last_x;
extern int touch_last_y;

void touch_init();
bool touch_has_signal();
bool touch_touched();
bool touch_released();

#endif

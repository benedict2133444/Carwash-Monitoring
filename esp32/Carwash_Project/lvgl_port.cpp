#include "lvgl_port.h"

#include <lvgl.h>
#include "display.h"
#include "touch.h"
#include "ui.h"

static lv_disp_draw_buf_t draw_buf;
static lv_color_t *disp_draw_buf = NULL;
static lv_disp_drv_t disp_drv;

static uint32_t screenWidth = 800;
static uint32_t screenHeight = 480;

/* Display Flush */
static void my_disp_flush(lv_disp_drv_t *disp,
                          const lv_area_t *area,
                          lv_color_t *color_p)
{
    uint32_t w = area->x2 - area->x1 + 1;
    uint32_t h = area->y2 - area->y1 + 1;

#if (LV_COLOR_16_SWAP != 0)
    gfx->draw16bitBeRGBBitmap(
        area->x1,
        area->y1,
        (uint16_t *)&color_p->full,
        w,
        h);
#else
    gfx->draw16bitRGBBitmap(
        area->x1,
        area->y1,
        (uint16_t *)&color_p->full,
        w,
        h);
#endif

    lv_disp_flush_ready(disp);
}

static void my_touchpad_read(lv_indev_drv_t *indev_drv,
                             lv_indev_data_t *data)
{
   // Serial.println("LVGL callback");

    if (touch_touched())
    {
        Serial.printf("LVGL Touch X=%d Y=%d\n", touch_last_x, touch_last_y);

        data->state = LV_INDEV_STATE_PR;
        data->point.x = touch_last_x;
        data->point.y = touch_last_y;
    }
    else
    {
        data->state = LV_INDEV_STATE_REL;
    }
}
bool lvgl_port_init()
{
    lv_init();

    Serial.printf("PSRAM Size: %u bytes\n", ESP.getPsramSize());
    Serial.printf("Free PSRAM: %u bytes\n", ESP.getFreePsram());

    touch_init();

#ifdef ESP32
    disp_draw_buf = (lv_color_t *)heap_caps_malloc(
        sizeof(lv_color_t) * screenWidth * 80,
        MALLOC_CAP_SPIRAM | MALLOC_CAP_8BIT);
#else
    disp_draw_buf = (lv_color_t *)malloc(
        sizeof(lv_color_t) * screenWidth * 40);
#endif

    if (!disp_draw_buf)
    {
        Serial.println("LVGL buffer allocation failed!");
        return false;
    }

    Serial.println("Draw buffer allocated.");

    lv_disp_draw_buf_init(
        &draw_buf,
        disp_draw_buf,
        NULL,
        screenWidth * 40);

    lv_disp_drv_init(&disp_drv);

    disp_drv.hor_res = screenWidth;
    disp_drv.ver_res = screenHeight;
    disp_drv.flush_cb = my_disp_flush;
    disp_drv.draw_buf = &draw_buf;

    lv_disp_t *disp = lv_disp_drv_register(&disp_drv);

    if (disp)
        Serial.println("Display driver registered!");
    else
        Serial.println("Display driver FAILED!");

   static lv_indev_drv_t indev_drv;

lv_indev_drv_init(&indev_drv);
indev_drv.type = LV_INDEV_TYPE_POINTER;
indev_drv.read_cb = my_touchpad_read;

lv_indev_t *indev = lv_indev_drv_register(&indev_drv);

Serial.printf("Indev pointer = %p\n", indev);
Serial.printf("Default display = %p\n", lv_disp_get_default());

if (indev)
    Serial.println("Touch driver registered!");
else
    Serial.println("Touch driver FAILED!");

    ui_init();

    Serial.println("LVGL initialized.");

    return true;
}

void lvgl_port_task()
{
    lv_timer_handler();
}

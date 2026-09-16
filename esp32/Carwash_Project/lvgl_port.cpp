#include "lvgl_port.h"

#include <lvgl.h>
#include "display.h"
#include "touch.h"
#include "ui.h"

#include <esp_heap_caps.h>

static lv_disp_draw_buf_t draw_buf;
static lv_color_t *disp_draw_buf1 = NULL;
static lv_color_t *disp_draw_buf2 = NULL;
static lv_disp_drv_t disp_drv;

static uint32_t screenWidth = 800;
static uint32_t screenHeight = 480;
static const uint32_t DRAW_BUF_LINES = 40;


// ======================================================
// DISPLAY FLUSH
// ======================================================

static void my_disp_flush(
    lv_disp_drv_t *disp,
    const lv_area_t *area,
    lv_color_t *color_p
)
{
    uint32_t w = area->x2 - area->x1 + 1;
    uint32_t h = area->y2 - area->y1 + 1;

#if (LV_COLOR_16_SWAP != 0)
    gfx->startWrite();
    gfx->draw16bitBeRGBBitmap(
        area->x1,
        area->y1,
        (uint16_t *)&color_p->full,
        w,
        h
    );
#else
    gfx->startWrite();
    gfx->draw16bitRGBBitmap(
        area->x1,
        area->y1,
        (uint16_t *)&color_p->full,
        w,
        h
    );
#endif

    gfx->endWrite();
    lv_disp_flush_ready(disp);
}


// ======================================================
// TOUCH READ
//
// Do not print every touch poll. LVGL polls the touch
// controller repeatedly while a finger is on the screen.
// Serial output here can block the UI and make screen
// transitions visibly glitch.
// ======================================================

static void my_touchpad_read(
    lv_indev_drv_t *indev_drv,
    lv_indev_data_t *data
)
{
    (void)indev_drv;

    if (touch_touched())
    {
        data->state = LV_INDEV_STATE_PR;
        data->point.x = touch_last_x;
        data->point.y = touch_last_y;
    }
    else
    {
        data->state = LV_INDEV_STATE_REL;
    }
}


// ======================================================
// LVGL INITIALIZATION
// ======================================================

bool lvgl_port_init()
{
    lv_init();

    Serial.printf(
        "PSRAM Size: %u bytes\n",
        ESP.getPsramSize()
    );

    Serial.printf(
        "Free PSRAM: %u bytes\n",
        ESP.getFreePsram()
    );

    touch_init();


    // ==================================================
    // TWO DRAW BUFFERS
    //
    // The previous version allocated an 800x80 buffer
    // but initialized only 800x40 of it and used a single
    // buffer. This version uses two correctly sized 800x40
    // buffers. This reduces visible tearing/flicker during
    // touch-triggered screen redraws.
    // ==================================================

#ifdef ESP32
    disp_draw_buf1 = (lv_color_t *)heap_caps_malloc(
        sizeof(lv_color_t) * screenWidth * DRAW_BUF_LINES,
        MALLOC_CAP_SPIRAM | MALLOC_CAP_8BIT
    );

    disp_draw_buf2 = (lv_color_t *)heap_caps_malloc(
        sizeof(lv_color_t) * screenWidth * DRAW_BUF_LINES,
        MALLOC_CAP_SPIRAM | MALLOC_CAP_8BIT
    );
#else
    disp_draw_buf1 = (lv_color_t *)malloc(
        sizeof(lv_color_t) * screenWidth * DRAW_BUF_LINES
    );

    disp_draw_buf2 = (lv_color_t *)malloc(
        sizeof(lv_color_t) * screenWidth * DRAW_BUF_LINES
    );
#endif

    if (!disp_draw_buf1 || !disp_draw_buf2)
    {
        Serial.println("LVGL double buffer allocation failed!");

#ifdef ESP32
        if (disp_draw_buf1)
            heap_caps_free(disp_draw_buf1);

        if (disp_draw_buf2)
            heap_caps_free(disp_draw_buf2);
#else
        if (disp_draw_buf1)
            free(disp_draw_buf1);

        if (disp_draw_buf2)
            free(disp_draw_buf2);
#endif

        disp_draw_buf1 = NULL;
        disp_draw_buf2 = NULL;

        return false;
    }

    Serial.println("LVGL double draw buffer allocated.");


    // ==================================================
    // INITIALIZE LVGL DRAW BUFFER
    // ==================================================

    lv_disp_draw_buf_init(
        &draw_buf,
        disp_draw_buf1,
        disp_draw_buf2,
        screenWidth * DRAW_BUF_LINES
    );


    // ==================================================
    // DISPLAY DRIVER
    // ==================================================

    lv_disp_drv_init(&disp_drv);

    disp_drv.hor_res = screenWidth;
    disp_drv.ver_res = screenHeight;
    disp_drv.flush_cb = my_disp_flush;
    disp_drv.draw_buf = &draw_buf;

    lv_disp_t *disp = lv_disp_drv_register(&disp_drv);

    if (disp)
    {
        Serial.println("Display driver registered!");
    }
    else
    {
        Serial.println("Display driver FAILED!");
        return false;
    }


    // ==================================================
    // TOUCH DRIVER
    // ==================================================

    static lv_indev_drv_t indev_drv;

    lv_indev_drv_init(&indev_drv);

    indev_drv.type = LV_INDEV_TYPE_POINTER;
    indev_drv.read_cb = my_touchpad_read;

    lv_indev_t *indev = lv_indev_drv_register(&indev_drv);

    Serial.printf(
        "Indev pointer = %p\n",
        indev
    );

    Serial.printf(
        "Default display = %p\n",
        lv_disp_get_default()
    );

    if (indev)
    {
        Serial.println("Touch driver registered!");
    }
    else
    {
        Serial.println("Touch driver FAILED!");
        return false;
    }


    // ==================================================
    // UI
    // ==================================================

    ui_init();

    Serial.println("LVGL initialized.");

    return true;
}


// ======================================================
// LVGL TASK
// ======================================================

void lvgl_port_task()
{
    // Keep LVGL in the foreground loop; no network work is done here.
    lv_timer_handler();
}

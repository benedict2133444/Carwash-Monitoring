SET(SOURCES ui_welcomepage.c
    ui_AdminPanel.c
    ui_SelectPaymentpage.c
    ui_CoinPaymentpage.c
    ui_GcashPaymentScreen.c
    ui_GcashQRsc.c
    ui_MainScreen.c
    ui_thankyouscreen.c
    ui.c
    ui_comp_hook.c
    ui_helpers.c
    ui_events.cpp
    ui_img_logo_png.c
    ui_img_346396786.c
    ui_img_1834858727.c
    ui_img_water_png.c
    ui_img_2086251881.c
    ui_img_246023399.c
    ui_img_1364712669.c
    ui_img_898050187.c)

add_library(ui ${SOURCES})

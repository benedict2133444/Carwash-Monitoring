// STEP 1 - Fixed Amount Selection
// Based on SquareLine Studio generated ui_SelectPaymentpage.h
// Fixed amounts: PHP 10, PHP 20, PHP 30

#ifndef UI_SELECTPAYMENTPAGE_H
#define UI_SELECTPAYMENTPAGE_H

#ifdef __cplusplus
extern "C" {
#endif

#include "lvgl.h"

// SCREEN
extern void ui_SelectPaymentpage_screen_init(void);
extern void ui_SelectPaymentpage_screen_destroy(void);
extern lv_obj_t * ui_SelectPaymentpage;
extern lv_obj_t * ui_confirmamountbtn;
// Existing objects retained for compatibility
extern lv_obj_t * ui_PaymentMethodlbl;
extern lv_obj_t * ui_Container3;
extern lv_obj_t * ui_Coinlbl;
extern lv_obj_t * ui_Gcashlbl;
extern lv_obj_t * ui_gcashbtn;
extern lv_obj_t * ui_gcashimg;
extern lv_obj_t * ui_coinbtn;
extern lv_obj_t * ui_coinimg;
extern lv_obj_t * ui_Container4;
extern lv_obj_t * ui_CurrentCreditlbl;
extern lv_obj_t * ui_CreditVallbl;
extern lv_obj_t * ui_backbtn2;
extern lv_obj_t * ui_backlbl2;

// STEP 1 amount buttons
extern lv_obj_t * ui_amount10btn;
extern lv_obj_t * ui_amount20btn;
extern lv_obj_t * ui_amount30btn;
extern lv_obj_t * ui_amount10lbl;
extern lv_obj_t * ui_amount20lbl;
extern lv_obj_t * ui_amount30lbl;

void ui_event_confirmamountbtn(lv_event_t * e);
extern void ui_event_amount10btn(lv_event_t * e);
extern void ui_event_amount20btn(lv_event_t * e);
extern void ui_event_amount30btn(lv_event_t * e);
extern void ui_event_backbtn2(lv_event_t * e);

// Selected amount in whole pesos: 0, 10, 20, or 30.
extern volatile uint16_t selectedPaymentAmount;

#ifdef __cplusplus
} /*extern "C"*/
#endif

#endif

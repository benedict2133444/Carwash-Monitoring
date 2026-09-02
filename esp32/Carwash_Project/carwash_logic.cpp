#include "carwash_logic.h"
#include "ui.h"
#include "espnow.h"
#include "supabase_client.h"

#include <Arduino.h>
#include <lvgl.h>


// ======================================================
// CUSTOMER SELECTIONS
//
// These variables are used by espnow.cpp:
//
// Water physical button  -> waterSelected
// Soap physical button   -> soapSelected
// Blower physical button -> blowerSelected
// Faucet physical button -> faucetSelected
//
// ui_events.cpp should define these variables.
// ======================================================

extern bool waterSelected;
extern bool soapSelected;
extern bool blowerSelected;
extern bool faucetSelected;


// ======================================================
// ADMIN ENABLE STATES
// ======================================================

static bool waterEnabled  = false;
static bool soapEnabled   = false;
static bool blowerEnabled = false;
static bool faucetEnabled = false;


// ======================================================
// ADMIN TEST STATES
// ======================================================
static void processAdminTests();
static bool waterTesting  = false;
static bool soapTesting   = false;
static bool blowerTesting = false;
static bool faucetTesting = false;

static uint32_t waterTestLastUpdate  = 0;
static uint32_t soapTestLastUpdate   = 0;
static uint32_t blowerTestLastUpdate = 0;
static uint32_t faucetTestLastUpdate = 0;

static int waterTestRemaining  = 0;
static int soapTestRemaining   = 0;
static int blowerTestRemaining = 0;
static int faucetTestRemaining = 0;

static const uint32_t ADMIN_TEST_TIME = 10;


// ======================================================
// CUSTOMER RUNNING STATES
// ======================================================

static bool customerWaterRunning  = false;
static bool customerSoapRunning   = false;
static bool customerBlowerRunning = false;
static bool customerFaucetRunning = false;


// ======================================================
// WATER PAUSE STATE
//
// Water can be paused and resumed.
//
// Other functions are NOT affected by Water pause.
// ======================================================

static bool customerWaterPaused = false;

static uint32_t customerWaterRemaining = 0;


// ======================================================
// CUSTOMER TIMER REMAINING
//
// We store remaining milliseconds rather than continuously
// calculating everything from the original start time.
//
// This makes pause/resume reliable.
// ======================================================

static uint32_t waterRemainingMs  = 0;
static uint32_t soapRemainingMs   = 0;
static uint32_t blowerRemainingMs = 0;
static uint32_t faucetRemainingMs = 0;


// ======================================================
// CUSTOMER TIMER UPDATE
// ======================================================

static uint32_t lastCustomerTimerUpdate = 0;


// ======================================================
// CUSTOMER DURATIONS
// ======================================================

static const uint32_t CUSTOMER_WATER_TIME  = 120000UL; // 2:00
static const uint32_t CUSTOMER_SOAP_TIME   = 40000UL;  // 0:40
static const uint32_t CUSTOMER_BLOWER_TIME = 40000UL;  // 0:40
static const uint32_t CUSTOMER_FAUCET_TIME = 120000UL; // 2:00


// ======================================================
// LAST DISPLAYED SECOND
//
// Prevents LVGL from being updated hundreds of times
// per second.
// ======================================================

static int lastWaterDisplaySecond  = -1;
static int lastSoapDisplaySecond   = -1;
static int lastBlowerDisplaySecond = -1;
static int lastFaucetDisplaySecond = -1;


// ======================================================
// FORWARD DECLARATIONS
// ======================================================

static void updateWaterDisplay();
static void updateSoapDisplay();
static void updateBlowerDisplay();
static void updateFaucetDisplay();

static void resetWaterDisplay();
static void resetSoapDisplay();
static void resetBlowerDisplay();
static void resetFaucetDisplay();

static void processCustomerTimers();
static void processAdminTests();


// ======================================================
// FORMAT TIME
// ======================================================

static void formatTime(
    uint32_t milliseconds,
    char *buffer,
    size_t bufferSize
)
{
    uint32_t totalSeconds = milliseconds / 1000UL;

    uint32_t minutes = totalSeconds / 60UL;
    uint32_t seconds = totalSeconds % 60UL;

    snprintf(
        buffer,
        bufferSize,
        "%lu:%02lu",
        (unsigned long)minutes,
        (unsigned long)seconds
    );
}


// ======================================================
// LOGIC INITIALIZATION
// ======================================================

void carwash_logic_init()
{
    // ==================================================
    // RESET ADMIN TESTS
    // ==================================================

    waterTesting  = false;
    soapTesting   = false;
    blowerTesting = false;
    faucetTesting = false;

    waterTestRemaining  = 0;
    soapTestRemaining   = 0;
    blowerTestRemaining = 0;
    faucetTestRemaining = 0;


    // ==================================================
    // RESET CUSTOMER STATES
    // ==================================================

    customerWaterRunning  = false;
    customerSoapRunning   = false;
    customerBlowerRunning = false;
    customerFaucetRunning = false;

    customerWaterPaused = false;


    // ==================================================
    // RESET TIMERS
    // ==================================================

    waterRemainingMs  = 0;
    soapRemainingMs   = 0;
    blowerRemainingMs = 0;
    faucetRemainingMs = 0;

    customerWaterRemaining = 0;


    // ==================================================
    // RESET DISPLAY CACHE
    // ==================================================

    lastWaterDisplaySecond  = -1;
    lastSoapDisplaySecond   = -1;
    lastBlowerDisplaySecond = -1;
    lastFaucetDisplaySecond = -1;


    lastCustomerTimerUpdate = millis();


    // ==================================================
    // ADMIN FUNCTIONS START DISABLED
    // ==================================================

    setWaterEnabled(false);
    setSoapEnabled(false);
    setBlowerEnabled(false);
    setFaucetEnabled(false);


    Serial.println("Carwash Logic Ready");
}


// ==================================================
// SUPABASE STATUS GETTERS
// ==================================================

const char* getWaterStatus()
{
    if(customerWaterRunning)
        return "RUNNING";

    if(customerWaterPaused)
        return "PAUSED";

    return "READY";
}

const char* getSoapStatus()
{
    if(customerSoapRunning)
        return "RUNNING";

    return "READY";
}

const char* getBlowerStatus()
{
    if(customerBlowerRunning)
        return "RUNNING";

    return "READY";
}

const char* getFaucetStatus()
{
    if(customerFaucetRunning)
        return "RUNNING";

    return "READY";
}


uint32_t getWaterRemainingSeconds()
{
    if(customerWaterPaused)
        return customerWaterRemaining / 1000;

    return waterRemainingMs / 1000;
}

uint32_t getSoapRemainingSeconds()
{
    return soapRemainingMs / 1000;
}

uint32_t getBlowerRemainingSeconds()
{
    return blowerRemainingMs / 1000;
}

uint32_t getFaucetRemainingSeconds()
{
    return faucetRemainingMs / 1000;
}



// ======================================================
// WATER ADMIN ENABLE
// ======================================================

void setWaterEnabled(bool state)
{
    waterEnabled = state;

    if(state)
    {
        lv_obj_clear_state(
            ui_testwater,
            LV_STATE_DISABLED
        );

        lv_obj_set_style_bg_color(
            ui_testwater,
            lv_palette_main(LV_PALETTE_BLUE),
            LV_PART_MAIN
        );

        lv_label_set_text(
            ui_Label14,
            "TEST"
        );

        lv_obj_clear_state(
            ui_waterbtn,
            LV_STATE_DISABLED
        );
    }
    else
    {
        waterTesting = false;

        if(customerWaterRunning || customerWaterPaused)
        {
            customerWaterRunning = false;
            customerWaterPaused = false;
            customerWaterRemaining = 0;
            waterRemainingMs = 0;

            sendCommand("WATER_STOP");
        }

        lv_obj_add_state(
            ui_testwater,
            LV_STATE_DISABLED
        );

        lv_obj_set_style_bg_color(
            ui_testwater,
            lv_palette_main(LV_PALETTE_GREY),
            LV_PART_MAIN
        );

        lv_label_set_text(
            ui_Label14,
            "TEST"
        );

        lv_obj_add_state(
            ui_waterbtn,
            LV_STATE_DISABLED
        );

        resetWaterDisplay();
    }
}


// ======================================================
// SOAP ADMIN ENABLE
// ======================================================

void setSoapEnabled(bool state)
{
    soapEnabled = state;

    if(state)
    {
        lv_obj_clear_state(
            ui_testsoap,
            LV_STATE_DISABLED
        );

        lv_obj_set_style_bg_color(
            ui_testsoap,
            lv_palette_main(LV_PALETTE_BLUE),
            LV_PART_MAIN
        );

        lv_label_set_text(
            ui_Label16,
            "TEST"
        );

        lv_obj_clear_state(
            ui_soapbtn,
            LV_STATE_DISABLED
        );
    }
    else
    {
        soapTesting = false;

        if(customerSoapRunning)
        {
            customerSoapRunning = false;
            soapRemainingMs = 0;

            sendCommand("SOAP_STOP");
        }

        lv_obj_add_state(
            ui_testsoap,
            LV_STATE_DISABLED
        );

        lv_obj_set_style_bg_color(
            ui_testsoap,
            lv_palette_main(LV_PALETTE_GREY),
            LV_PART_MAIN
        );

        lv_label_set_text(
            ui_Label16,
            "TEST"
        );

        lv_obj_add_state(
            ui_soapbtn,
            LV_STATE_DISABLED
        );

        resetSoapDisplay();
    }
}


// ======================================================
// BLOWER ADMIN ENABLE
// ======================================================

void setBlowerEnabled(bool state)
{
    blowerEnabled = state;

    if(state)
    {
        lv_obj_clear_state(
            ui_testblower,
            LV_STATE_DISABLED
        );

        lv_obj_set_style_bg_color(
            ui_testblower,
            lv_palette_main(LV_PALETTE_BLUE),
            LV_PART_MAIN
        );

        lv_label_set_text(
            ui_Label17,
            "TEST"
        );

        lv_obj_clear_state(
            ui_blowerbtn,
            LV_STATE_DISABLED
        );
    }
    else
    {
        blowerTesting = false;

        if(customerBlowerRunning)
        {
            customerBlowerRunning = false;
            blowerRemainingMs = 0;

            sendCommand("BLOWER_STOP");
        }

        lv_obj_add_state(
            ui_testblower,
            LV_STATE_DISABLED
        );

        lv_obj_set_style_bg_color(
            ui_testblower,
            lv_palette_main(LV_PALETTE_GREY),
            LV_PART_MAIN
        );

        lv_label_set_text(
            ui_Label17,
            "TEST"
        );

        lv_obj_add_state(
            ui_blowerbtn,
            LV_STATE_DISABLED
        );

        resetBlowerDisplay();
    }
}


// ======================================================
// FAUCET ADMIN ENABLE
// ======================================================

void setFaucetEnabled(bool state)
{
    faucetEnabled = state;

    if(state)
    {
        lv_obj_clear_state(
            ui_testfaucet,
            LV_STATE_DISABLED
        );

        lv_obj_set_style_bg_color(
            ui_testfaucet,
            lv_palette_main(LV_PALETTE_BLUE),
            LV_PART_MAIN
        );

        lv_label_set_text(
            ui_Label18,
            "TEST"
        );

        lv_obj_clear_state(
            ui_faucetbtn,
            LV_STATE_DISABLED
        );
    }
    else
    {
        faucetTesting = false;

        if(customerFaucetRunning)
        {
            customerFaucetRunning = false;
            faucetRemainingMs = 0;

            sendCommand("FAUCET_STOP");
        }

        lv_obj_add_state(
            ui_testfaucet,
            LV_STATE_DISABLED
        );

        lv_obj_set_style_bg_color(
            ui_testfaucet,
            lv_palette_main(LV_PALETTE_GREY),
            LV_PART_MAIN
        );

        lv_label_set_text(
            ui_Label18,
            "TEST"
        );

        lv_obj_add_state(
            ui_faucetbtn,
            LV_STATE_DISABLED
        );

        resetFaucetDisplay();
    }
}


// ======================================================
// ADMIN WATER TEST
// ======================================================

void startWaterTest()
{
    if(!waterEnabled)
    {
        lv_label_set_text(
            ui_Label14,
            "DISABLED"
        );

        return;
    }


    // STOP CURRENT TEST
    if(waterTesting)
    {
        waterTesting = false;
        waterTestRemaining = 0;

        sendCommand("WATER_STOP");

        lv_obj_set_style_bg_color(
            ui_testwater,
            lv_palette_main(LV_PALETTE_BLUE),
            LV_PART_MAIN
        );

        lv_label_set_text(
            ui_Label14,
            "TEST"
        );

        return;
    }


    // START TEST
    waterTesting = true;

    waterTestRemaining = ADMIN_TEST_TIME;
    waterTestLastUpdate = millis();

    sendCommand("WATER_START");

    lv_obj_set_style_bg_color(
        ui_testwater,
        lv_palette_main(LV_PALETTE_RED),
        LV_PART_MAIN
    );

    lv_label_set_text(
        ui_Label14,
        "STOP (10)"
    );
}


// ======================================================
// ADMIN SOAP TEST
// ======================================================

void startSoapTest()
{
    if(!soapEnabled)
    {
        lv_label_set_text(
            ui_Label16,
            "DISABLED"
        );

        return;
    }


    if(soapTesting)
    {
        soapTesting = false;
        soapTestRemaining = 0;

        sendCommand("SOAP_STOP");

        lv_obj_set_style_bg_color(
            ui_testsoap,
            lv_palette_main(LV_PALETTE_BLUE),
            LV_PART_MAIN
        );

        lv_label_set_text(
            ui_Label16,
            "TEST"
        );

        return;
    }


    soapTesting = true;

    soapTestRemaining = ADMIN_TEST_TIME;
    soapTestLastUpdate = millis();

    sendCommand("SOAP_START");

    lv_obj_set_style_bg_color(
        ui_testsoap,
        lv_palette_main(LV_PALETTE_RED),
        LV_PART_MAIN
    );

    lv_label_set_text(
        ui_Label16,
        "STOP (10)"
    );
}


// ======================================================
// ADMIN BLOWER TEST
// ======================================================

void startBlowerTest()
{
    if(!blowerEnabled)
    {
        lv_label_set_text(
            ui_Label17,
            "DISABLED"
        );

        return;
    }


    if(blowerTesting)
    {
        blowerTesting = false;
        blowerTestRemaining = 0;

        sendCommand("BLOWER_STOP");

        lv_obj_set_style_bg_color(
            ui_testblower,
            lv_palette_main(LV_PALETTE_BLUE),
            LV_PART_MAIN
        );

        lv_label_set_text(
            ui_Label17,
            "TEST"
        );

        return;
    }


    blowerTesting = true;

    blowerTestRemaining = ADMIN_TEST_TIME;
    blowerTestLastUpdate = millis();

    sendCommand("BLOWER_START");

    lv_obj_set_style_bg_color(
        ui_testblower,
        lv_palette_main(LV_PALETTE_RED),
        LV_PART_MAIN
    );

    lv_label_set_text(
        ui_Label17,
        "STOP (10)"
    );
}


// ======================================================
// ADMIN FAUCET TEST
// ======================================================

void startFaucetTest()
{
    if(!faucetEnabled)
    {
        lv_label_set_text(
            ui_Label18,
            "DISABLED"
        );

        return;
    }


    if(faucetTesting)
    {
        faucetTesting = false;
        faucetTestRemaining = 0;

        sendCommand("FAUCET_STOP");

        lv_obj_set_style_bg_color(
            ui_testfaucet,
            lv_palette_main(LV_PALETTE_BLUE),
            LV_PART_MAIN
        );

        lv_label_set_text(
            ui_Label18,
            "TEST"
        );

        return;
    }


    faucetTesting = true;

    faucetTestRemaining = ADMIN_TEST_TIME;
    faucetTestLastUpdate = millis();

    sendCommand("FAUCET_START");

    lv_obj_set_style_bg_color(
        ui_testfaucet,
        lv_palette_main(LV_PALETTE_RED),
        LV_PART_MAIN
    );

    lv_label_set_text(
        ui_Label18,
        "STOP (10)"
    );
}


// ======================================================
// CUSTOMER WATER START
// ======================================================
// ======================================================
// CUSTOMER WATER START
//
// IMPORTANT:
//
// This function ONLY starts a NEW water session.
//
// If Water is paused, it MUST NOT restart the timer.
// Resume is handled ONLY by toggleWaterPause().
//
// Selecting or starting another function must also
// never call this function to reset Water.
// ======================================================

void startCustomerWater()
{
    if(!waterEnabled)
    {
        Serial.println(
            "CUSTOMER WATER DISABLED BY ADMIN"
        );

        return;
    }


    // ==================================================
    // WATER IS ALREADY RUNNING
    // ==================================================

    if(customerWaterRunning)
    {
        Serial.println(
            "CUSTOMER WATER ALREADY RUNNING"
        );

        return;
    }


    // ==================================================
    // WATER IS PAUSED
    //
    // NEVER restart the timer here.
    // ==================================================

    if(customerWaterPaused)
    {
        Serial.print(
            "CUSTOMER WATER STILL PAUSED - "
        );

        Serial.print(
            customerWaterRemaining / 1000UL
        );

        Serial.println(
            " seconds remaining"
        );

        return;
    }


    // ==================================================
    // START A COMPLETELY NEW WATER SESSION
    // ==================================================

    customerWaterRunning = true;

    customerWaterPaused = false;

    waterRemainingMs =
        CUSTOMER_WATER_TIME;

    customerWaterRemaining = 0;

    lastWaterDisplaySecond = -1;

    lastCustomerTimerUpdate = millis();


    Serial.println(
        "CUSTOMER WATER NEW SESSION START"
    );


   sendCommand(
    "WATER_START"
);

requestSupabaseUpdate();

updateWaterDisplay();
}
// ======================================================
// CUSTOMER WATER STOP
// ======================================================

void stopCustomerWater()
{
    if(
        !customerWaterRunning &&
        !customerWaterPaused
    )
    {
        return;
    }


    customerWaterRunning = false;
    customerWaterPaused = false;

    waterRemainingMs = 0;
    customerWaterRemaining = 0;

    sendCommand("WATER_STOP");

requestSupabaseUpdate();

resetWaterDisplay();

    resetWaterDisplay();
}


// ======================================================
// WATER PAUSE / RESUME
//
// IMPORTANT:
//
// While Water is paused:
//
//     Soap can run.
//     Blower can run.
//     Faucet can run.
//
// Water's remaining time is preserved.
// ======================================================
void toggleWaterPause()
{
    // ==================================================
    // PAUSE WATER
    // ==================================================

    if(customerWaterRunning)
    {
        if(waterRemainingMs == 0)
        {
            stopCustomerWater();
            return;
        }

        // Save the remaining time.
        customerWaterRemaining = waterRemainingMs;

        // Stop ONLY the Water timer.
        customerWaterRunning = false;

        // Mark Water as paused.
        customerWaterPaused = true;

        Serial.print("WATER PAUSED - ");
        Serial.print(
            customerWaterRemaining / 1000UL
        );
        Serial.println(" seconds remaining");

       // Stop ONLY the Water relay.
sendCommand("WATER_STOP");

requestSupabaseUpdate();

// Display the saved time.
updateWaterDisplay();
        return;
    }


    // ==================================================
    // RESUME WATER
    // ==================================================

    if(customerWaterPaused)
    {
        if(customerWaterRemaining == 0)
        {
            customerWaterPaused = false;

            resetWaterDisplay();

            return;
        }

        waterRemainingMs =
            customerWaterRemaining;

        customerWaterRunning = true;

        customerWaterPaused = false;

        customerWaterRemaining = 0;

        lastWaterDisplaySecond = -1;

        Serial.print("WATER RESUMED - ");
        Serial.print(
            waterRemainingMs / 1000UL
        );
        Serial.println(" seconds remaining");

        sendCommand("WATER_START");

requestSupabaseUpdate();

updateWaterDisplay();

        return;
    }


    // ==================================================
    // NOTHING TO PAUSE
    // ==================================================

    Serial.println(
        "WATER PAUSE IGNORED - WATER NOT RUNNING"
    );
}


// ======================================================
// CUSTOMER SOAP START
// ======================================================

void startCustomerSoap()
{
    if(!soapEnabled)
    {
        Serial.println(
            "CUSTOMER SOAP DISABLED BY ADMIN"
        );

        return;
    }


    if(customerSoapRunning)
    {
        return;
    }


    customerSoapRunning = true;

    soapRemainingMs = CUSTOMER_SOAP_TIME;

    lastSoapDisplaySecond = -1;

    Serial.println(
        "CUSTOMER SOAP START"
    );

   sendCommand("SOAP_START");

requestSupabaseUpdate();

updateSoapDisplay();
}


// ======================================================
// CUSTOMER SOAP STOP
// ======================================================

void stopCustomerSoap()
{
    if(!customerSoapRunning)
    {
        return;
    }


    customerSoapRunning = false;

    soapRemainingMs = 0;

    Serial.println(
        "CUSTOMER SOAP STOP"
    );

    sendCommand("SOAP_STOP");

    resetSoapDisplay();
}


// ======================================================
// CUSTOMER BLOWER START
// ======================================================

void startCustomerBlower()
{
    if(!blowerEnabled)
    {
        Serial.println(
            "CUSTOMER BLOWER DISABLED BY ADMIN"
        );

        return;
    }


    if(customerBlowerRunning)
    {
        return;
    }


    customerBlowerRunning = true;

    blowerRemainingMs = CUSTOMER_BLOWER_TIME;

    lastBlowerDisplaySecond = -1;

    Serial.println(
        "CUSTOMER BLOWER START"
    );

    sendCommand("BLOWER_START");

requestSupabaseUpdate();

updateBlowerDisplay();
}


// ======================================================
// CUSTOMER BLOWER STOP
// ======================================================

void stopCustomerBlower()
{
    if(!customerBlowerRunning)
    {
        return;
    }


    customerBlowerRunning = false;

    blowerRemainingMs = 0;

    Serial.println(
        "CUSTOMER BLOWER STOP"
    );

    sendCommand("BLOWER_STOP");

requestSupabaseUpdate();

resetBlowerDisplay();
}


// ======================================================
// CUSTOMER FAUCET START
// ======================================================

void startCustomerFaucet()
{
    if(!faucetEnabled)
    {
        Serial.println(
            "CUSTOMER FAUCET DISABLED BY ADMIN"
        );

        return;
    }


    if(customerFaucetRunning)
    {
        return;
    }


    customerFaucetRunning = true;

    faucetRemainingMs = CUSTOMER_FAUCET_TIME;

    lastFaucetDisplaySecond = -1;

    Serial.println(
        "CUSTOMER FAUCET START"
    );

    sendCommand("FAUCET_START");

requestSupabaseUpdate();

updateFaucetDisplay();
}


// ======================================================
// CUSTOMER FAUCET STOP
// ======================================================

void stopCustomerFaucet()
{
    if(!customerFaucetRunning)
    {
        return;
    }


    customerFaucetRunning = false;

    faucetRemainingMs = 0;

    Serial.println(
        "CUSTOMER FAUCET STOP"
    );

         sendCommand("FAUCET_STOP");

requestSupabaseUpdate();

resetFaucetDisplay();
}


// ======================================================
// UPDATE WATER DISPLAY
// ======================================================

static void updateWaterDisplay()
{
    if(customerWaterPaused)
    {
        char txt[16];

        formatTime(
            customerWaterRemaining,
            txt,
            sizeof(txt)
        );

        lv_label_set_text(
            ui_waterstatus,
            txt
        );

        return;
    }


    if(!customerWaterRunning)
    {
        resetWaterDisplay();
        return;
    }


    int currentSecond =
        waterRemainingMs / 1000UL;


    if(currentSecond == lastWaterDisplaySecond)
    {
        return;
    }


    lastWaterDisplaySecond = currentSecond;


    char txt[16];

    formatTime(
        waterRemainingMs,
        txt,
        sizeof(txt)
    );


    lv_label_set_text(
        ui_waterstatus,
        txt
    );
}


// ======================================================
// UPDATE SOAP DISPLAY
// ======================================================

static void updateSoapDisplay()
{
    if(!customerSoapRunning)
    {
        resetSoapDisplay();
        return;
    }


    int currentSecond =
        soapRemainingMs / 1000UL;


    if(currentSecond == lastSoapDisplaySecond)
    {
        return;
    }


    lastSoapDisplaySecond = currentSecond;


    char txt[16];

    formatTime(
        soapRemainingMs,
        txt,
        sizeof(txt)
    );


    lv_label_set_text(
        ui_soapstatus,
        txt
    );
}


// ======================================================
// UPDATE BLOWER DISPLAY
// ======================================================

static void updateBlowerDisplay()
{
    if(!customerBlowerRunning)
    {
        resetBlowerDisplay();
        return;
    }


    int currentSecond =
        blowerRemainingMs / 1000UL;


    if(currentSecond == lastBlowerDisplaySecond)
    {
        return;
    }


    lastBlowerDisplaySecond = currentSecond;


    char txt[16];

    formatTime(
        blowerRemainingMs,
        txt,
        sizeof(txt)
    );


    lv_label_set_text(
        ui_blowerstatus,
        txt
    );
}


// ======================================================
// UPDATE FAUCET DISPLAY
// ======================================================

static void updateFaucetDisplay()
{
    if(!customerFaucetRunning)
    {
        resetFaucetDisplay();
        return;
    }


    int currentSecond =
        faucetRemainingMs / 1000UL;


    if(currentSecond == lastFaucetDisplaySecond)
    {
        return;
    }


    lastFaucetDisplaySecond = currentSecond;


    char txt[16];

    formatTime(
        faucetRemainingMs,
        txt,
        sizeof(txt)
    );


    lv_label_set_text(
        ui_faucetstatus,
        txt
    );
}


// ======================================================
// RESET WATER DISPLAY
// ======================================================

static void resetWaterDisplay()
{
    lastWaterDisplaySecond = -1;

    lv_label_set_text(
        ui_waterstatus,
        "READY"
    );
}


// ======================================================
// RESET SOAP DISPLAY
// ======================================================

static void resetSoapDisplay()
{
    lastSoapDisplaySecond = -1;

    lv_label_set_text(
        ui_soapstatus,
        "READY"
    );
}


// ======================================================
// RESET BLOWER DISPLAY
// ======================================================

static void resetBlowerDisplay()
{
    lastBlowerDisplaySecond = -1;

    lv_label_set_text(
        ui_blowerstatus,
        "READY"
    );
}


// ======================================================
// RESET FAUCET DISPLAY
// ======================================================

static void resetFaucetDisplay()
{
    lastFaucetDisplaySecond = -1;

    lv_label_set_text(
        ui_faucetstatus,
        "READY"
    );
}
// ======================================================
// PROCESS CUSTOMER TIMERS
//
// ONE elapsed-time calculation for ALL services.
//
// Water, Soap, Blower and Faucet are independent.
// Pausing Water does NOT affect the others.
//
// IMPORTANT:
// No delay()
// No screen changes
// No screen navigation
// ======================================================

static void processCustomerTimers()
{
    uint32_t now = millis();

    uint32_t elapsed =
        now - lastCustomerTimerUpdate;

    // Protect against abnormal/huge elapsed values.
    if(elapsed > 1000UL)
    {
        elapsed = 1000UL;
    }

    lastCustomerTimerUpdate = now;


    // ==================================================
    // WATER
    // ==================================================

    if(customerWaterRunning)
    {
        if(waterRemainingMs > elapsed)
        {
            waterRemainingMs -= elapsed;

            updateWaterDisplay();
        }
        else
        {
            waterRemainingMs = 0;

            customerWaterRunning = false;
            customerWaterPaused = false;
            customerWaterRemaining = 0;

            Serial.println(
                "CUSTOMER WATER TIME FINISHED"
            );

           sendCommand("WATER_STOP");

requestSupabaseUpdate();

resetWaterDisplay();
        }
    }


    // ==================================================
    // SOAP
    // ==================================================

    if(customerSoapRunning)
    {
        if(soapRemainingMs > elapsed)
        {
            soapRemainingMs -= elapsed;

            updateSoapDisplay();
        }
        else
        {
            soapRemainingMs = 0;

            customerSoapRunning = false;

            Serial.println(
                "CUSTOMER SOAP TIME FINISHED"
            );

            sendCommand("SOAP_STOP");

requestSupabaseUpdate();

resetSoapDisplay();
        }
    }


    // ==================================================
    // BLOWER
    // ==================================================

    if(customerBlowerRunning)
    {
        if(blowerRemainingMs > elapsed)
        {
            blowerRemainingMs -= elapsed;

            updateBlowerDisplay();
        }
        else
        {
            blowerRemainingMs = 0;

            customerBlowerRunning = false;

            Serial.println(
                "CUSTOMER BLOWER TIME FINISHED"
            );

            sendCommand("BLOWER_STOP");

requestSupabaseUpdate();

resetBlowerDisplay();
        }
    }


    // ==================================================
    // FAUCET
    // ==================================================

    if(customerFaucetRunning)
    {
        if(faucetRemainingMs > elapsed)
        {
            faucetRemainingMs -= elapsed;

            updateFaucetDisplay();
        }
        else
        {
            faucetRemainingMs = 0;

            customerFaucetRunning = false;

            Serial.println(
                "CUSTOMER FAUCET TIME FINISHED"
            );

            sendCommand("FAUCET_STOP");

requestSupabaseUpdate();

resetFaucetDisplay();
        }
    }
}

// ======================================================
// MAIN CARWASH LOGIC TASK
//
// IMPORTANT:
//
// This function MUST remain fast.
//
// No delay()
// No while()
// No blocking loops
// ======================================================
// ======================================================
// PROCESS ADMIN TEST TIMERS
// ======================================================

static void processAdminTests()
{
    uint32_t now = millis();


    // ==================================================
    // WATER TEST
    // ==================================================

    if(waterTesting)
    {
        if(now - waterTestLastUpdate >= 1000UL)
        {
            waterTestLastUpdate += 1000UL;

            if(waterTestRemaining > 0)
            {
                waterTestRemaining--;
            }

            if(waterTestRemaining <= 0)
            {
                waterTesting = false;

                sendCommand("WATER_STOP");

                lv_obj_set_style_bg_color(
                    ui_testwater,
                    lv_palette_main(LV_PALETTE_BLUE),
                    LV_PART_MAIN
                );

                lv_label_set_text(
                    ui_Label14,
                    "TEST"
                );
            }
            else
            {
                char txt[20];

                snprintf(
                    txt,
                    sizeof(txt),
                    "STOP (%d)",
                    waterTestRemaining
                );

                lv_label_set_text(
                    ui_Label14,
                    txt
                );
            }
        }
    }


    // ==================================================
    // SOAP TEST
    // ==================================================

    if(soapTesting)
    {
        if(now - soapTestLastUpdate >= 1000UL)
        {
            soapTestLastUpdate += 1000UL;

            if(soapTestRemaining > 0)
            {
                soapTestRemaining--;
            }

            if(soapTestRemaining <= 0)
            {
                soapTesting = false;

                sendCommand("SOAP_STOP");

                lv_obj_set_style_bg_color(
                    ui_testsoap,
                    lv_palette_main(LV_PALETTE_BLUE),
                    LV_PART_MAIN
                );

                lv_label_set_text(
                    ui_Label16,
                    "TEST"
                );
            }
            else
            {
                char txt[20];

                snprintf(
                    txt,
                    sizeof(txt),
                    "STOP (%d)",
                    soapTestRemaining
                );

                lv_label_set_text(
                    ui_Label16,
                    txt
                );
            }
        }
    }


    // ==================================================
    // BLOWER TEST
    // ==================================================

    if(blowerTesting)
    {
        if(now - blowerTestLastUpdate >= 1000UL)
        {
            blowerTestLastUpdate += 1000UL;

            if(blowerTestRemaining > 0)
            {
                blowerTestRemaining--;
            }

            if(blowerTestRemaining <= 0)
            {
                blowerTesting = false;

                sendCommand("BLOWER_STOP");

                lv_obj_set_style_bg_color(
                    ui_testblower,
                    lv_palette_main(LV_PALETTE_BLUE),
                    LV_PART_MAIN
                );

                lv_label_set_text(
                    ui_Label17,
                    "TEST"
                );
            }
            else
            {
                char txt[20];

                snprintf(
                    txt,
                    sizeof(txt),
                    "STOP (%d)",
                    blowerTestRemaining
                );

                lv_label_set_text(
                    ui_Label17,
                    txt
                );
            }
        }
    }


    // ==================================================
    // FAUCET TEST
    // ==================================================

    if(faucetTesting)
    {
        if(now - faucetTestLastUpdate >= 1000UL)
        {
            faucetTestLastUpdate += 1000UL;

            if(faucetTestRemaining > 0)
            {
                faucetTestRemaining--;
            }

            if(faucetTestRemaining <= 0)
            {
                faucetTesting = false;

                sendCommand("FAUCET_STOP");

                lv_obj_set_style_bg_color(
                    ui_testfaucet,
                    lv_palette_main(LV_PALETTE_BLUE),
                    LV_PART_MAIN
                );

                lv_label_set_text(
                    ui_Label18,
                    "TEST"
                );
            }
            else
            {
                char txt[20];

                snprintf(
                    txt,
                    sizeof(txt),
                    "STOP (%d)",
                    faucetTestRemaining
                );

                lv_label_set_text(
                    ui_Label18,
                    txt
                );
            }
        }
    }
}
void carwash_logic_task()
{
    uint32_t now = millis();


    // ==================================================
    // CUSTOMER TIMERS
    //
    // Only process every ~100ms.
    // ==================================================

    if(now - lastCustomerTimerUpdate >= 100UL)
    {
        processCustomerTimers();
    }


    // ==================================================
    // ADMIN TESTS
    // ==================================================

    processAdminTests();
} 
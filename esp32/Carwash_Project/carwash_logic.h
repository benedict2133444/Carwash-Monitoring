#ifndef CARWASH_LOGIC_H
#define CARWASH_LOGIC_H

#include <Arduino.h>
 

const char* getWaterStatus();
const char* getSoapStatus();
const char* getBlowerStatus();
const char* getFaucetStatus();

uint32_t getWaterRemainingSeconds();
uint32_t getSoapRemainingSeconds();
uint32_t getBlowerRemainingSeconds();
uint32_t getFaucetRemainingSeconds();

// ======================================================
// ESP32 TO RELAY PINS
// ======================================================

#define RELAY_WATER    25
#define RELAY_SOAP     26
#define RELAY_BLOWER   32
#define RELAY_FAUCET   33


// ======================================================
// ADMIN PANEL
// 10 SECOND TEST FUNCTIONS
// ======================================================

void carwash_logic_init();
void carwash_logic_task();

void startWaterTest();
void startSoapTest();
void startBlowerTest();
void startFaucetTest();

void setWaterEnabled(bool state);
void setSoapEnabled(bool state);
void setBlowerEnabled(bool state);
void setFaucetEnabled(bool state);
void toggleWaterPause();
void startCustomerSoap();
void stopCustomerSoap();
// ======================================================
// CUSTOMER FUNCTIONS
// ======================================================

// Water = 2:00
void startCustomerWater();
void stopCustomerWater();
void toggleWaterPause();
// Soap = 0:40
void startCustomerSoap();
void stopCustomerSoap();

// Blower = 0:40
void startCustomerBlower();
void stopCustomerBlower();

// Faucet = 2:00
void startCustomerFaucet();
void stopCustomerFaucet();

#endif
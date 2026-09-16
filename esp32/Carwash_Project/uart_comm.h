#ifndef UART_COMM_H
#define UART_COMM_H

#include <Arduino.h>

void uart_comm_init();
void uart_comm_task();

void sendCommand(const char *cmd);

bool isControllerOnline();

void updateControllerIndicator(bool online);

#endif
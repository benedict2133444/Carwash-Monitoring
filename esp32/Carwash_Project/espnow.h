#ifndef ESPNOW_H
#define ESPNOW_H
bool isControllerOnline();
void espnow_init();

void sendCommand(const char *cmd);

void espnow_task();

#endif
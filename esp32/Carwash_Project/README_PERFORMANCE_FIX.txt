CARWASH LCD PERFORMANCE FIX

Use this project with the existing support files:
- display.h / display.cpp
- lvgl_port.h
- touch.h / touch.cpp
- carwash_logic.h
- supabase_client.h
- secrets.h
- generated LVGL UI files (ui.h, ui_events.cpp, etc.)

Replace the project's four core files with:
- Carwash_Project.ino
- carwash_logic.cpp
- uart_comm.cpp
- supabase_client.cpp

ALSO REPLACE lvgl_port.cpp with the supplied performance version.

LOCAL UART WIRING:
LCD GPIO17 TX -> Controller GPIO22 RX
LCD GPIO18 RX <- Controller GPIO23 TX
GND -> GND

Controller relay pins remain:
Water 25, Soap 26, Blower 27, Faucet 33

Performance changes:
1. UART send no longer calls flush(), so button presses never wait for the UART buffer.
2. USB Serial logging for every UART frame is disabled by default.
3. LVGL uses two 800x80 PSRAM buffers instead of 800x40.
4. RGB display flush is batched with startWrite()/endWrite().
5. Wi-Fi/Supabase task waits 15 seconds after boot before touching the radio.
6. Supabase periodic status update is reduced to every 15 seconds.
7. HTTP timeout is reduced to 1.8 seconds.
8. Main Arduino loop contains only LVGL, carwash logic and UART work.
9. No ESP-NOW is used.

Do not keep an old espnow.cpp / espnow.h implementation in the same sketch folder if it defines UART symbols.

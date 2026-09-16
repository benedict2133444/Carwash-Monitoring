DISPLAY GLITCH FIX

This version restores the display pipeline from the saved glitch-fixed project.

1. display.cpp uses the known working RGB-panel bounce buffer:
   800 * 10

2. lvgl_port.cpp uses TWO PSRAM LVGL draw buffers at 800 x 40 lines.

3. The experimental startWrite()/endWrite() wrapper is REMOVED.

4. The 800 x 80 LVGL buffer is REMOVED.

5. UART remains non-blocking and cloud/Wi-Fi remains in the background task.

Keep the existing display.h. The 800 * 10 setting is in display.cpp, not display.h.

Replace/add these files in the LCD project:
- Carwash_Project.ino
- carwash_logic.cpp
- uart_comm.cpp
- supabase_client.cpp
- lvgl_port.cpp
- display.cpp

Keep the existing support files:
- display.h
- lvgl_port.h
- touch.h / touch.cpp
- carwash_logic.h
- supabase_client.h
- secrets.h
- generated UI files

Do not add the old ESP-NOW .cpp/.h implementation.

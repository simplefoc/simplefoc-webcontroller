import { useState } from "react";
import "./App.css";
import { SimpleFocSerialPort } from "./simpleFoc/serial";
import Header from "./components/Header";
import { Box, Stack, Typography } from "@mui/material";
import { SerialManager } from "./components/SerialManager";
import { Motors } from "./components/Motors";
import { serialPortContext } from "./lib/serialContext";

function App() {
  const [serial, setSerial] = useState<SimpleFocSerialPort | null>(null);

  const supportSerial = typeof navigator.serial === "object";

  return (
    <Box
      sx={{
        bgcolor: "background.default",
        color: "text.primary",
        minHeight: "100vh",
        minWidth: "100vw",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Header />

      <Box sx={{ flex: 1, pb: 4, width: "100%" }}>
        <Stack gap={3} paddingTop={3} sx={{ width: "100%" }}>
          {!supportSerial && (
            <Box
              sx={{
                p: 3,
                bgcolor: "error.light",
                borderRadius: 1,
                border: "1px solid",
                borderColor: "error.main",
              }}
            >
              <Typography variant="h6" color="error.dark" sx={{ mb: 1 }}>
                WebSerial Not Supported
              </Typography>
              <Typography color="error.dark">
                Your browser doesn't support WebSerial. Please use a{" "}
                <a href="https://caniuse.com/web-serial" style={{ color: "inherit", fontWeight: 500 }}>
                  browser that supports it
                </a>
                .
              </Typography>
            </Box>
          )}
          {supportSerial && (
            <serialPortContext.Provider value={serial}>
              <SerialManager onSetSerial={setSerial} serial={serial} />
              <Motors />
            </serialPortContext.Provider>
          )}
        </Stack>
      </Box>
    </Box>
  );
}

export default App;

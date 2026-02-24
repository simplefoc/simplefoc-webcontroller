import { Chip, Stack, TextField, Slider, Typography } from "@mui/material";
import { Box } from "@mui/system";
import { KeyboardEventHandler, useState, MouseEventHandler } from "react";
import { useSerialPort } from "../lib/serialContext";
import { SimpleFocSerialPort } from "../simpleFoc/serial";

export const SerialCommandPrompt = () => {
  const serial = useSerialPort();
  const [promptValue, setPromptValue] = useState("");

  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.code === "Enter" && serial) {
      serial.send(promptValue);
      setPromptValue("");
    }
  };


  const handleStoredCommandClick = (command: string) => () => {
    serial?.send(command);
  };

  const handleRestart = () => {
    serial?.restartTarget();
  };

  
  const handleMachineReadable = () => {
    serial?.send("@3");
  };

  const handleClearOutput = () => {
    serial?.clearLines();
  };

  return (
    <Stack gap={2}>
      <Box sx={{ display: "flex", gap: 1 }}>
        <TextField
          disabled={!serial}
          variant="outlined"
          size="small"
          label="Command"
          placeholder="Enter command..."
          value={promptValue}
          onChange={(e) => setPromptValue(e.target.value)}
          onKeyDown={handleKeyDown}
          sx={{ flex: 1 }}
        />
      </Box>
      <Stack gap={1} direction={{ xs: "column", sm: "row" }} sx={{ flexWrap: "wrap" }}>
        <Chip 
          clickable 
          label="Machine Readable Mode" 
          onClick={handleMachineReadable}
          variant="outlined"
          size="small"
          sx={{ flex: { xs: 1, sm: "auto" } }}
        />
        <Chip 
          clickable 
          label="Restart Serial" 
          onClick={handleRestart}
          variant="outlined"
          size="small"
          sx={{ flex: { xs: 1, sm: "auto" } }}
        />
        <Chip 
          clickable 
          label="Clear Output" 
          onClick={handleClearOutput}
          variant="outlined"
          size="small"
          sx={{ flex: { xs: 1, sm: "auto" } }}
        />
      </Stack>
    </Stack>
  );
};

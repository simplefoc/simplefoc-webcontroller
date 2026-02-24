import { TextField, Stack, Button } from "@mui/material";
import { KeyboardEventHandler, useState } from "react";
import { useSerialPortRef } from "../../lib/serialContext";
import { useSerialIntervalSender } from "../../lib/useSerialIntervalSender";
import { useSerialLineEvent } from "../../lib/useSerialLineEvent";

export const FocScalar = (props: {
  motorKey: string;
  command: string;
  label: string;
  defaultMin: number;
  defaultMax: number;
  step: number;
  pollingEnabled?: boolean;
}) => {
  const fullCommandString = `${props.motorKey}${props.command}`;
  const [currentValue, setCurrentValue] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");
  const serialRef = useSerialPortRef();

  const sendValue = (value: number) => {
    serialRef.current?.send(`${fullCommandString}${value}`);
  };

  useSerialLineEvent((line) => {
    if (line.content.startsWith(fullCommandString)) {
      const receivedValue = Number(
        line.content.slice(fullCommandString.length)
      );
      if (!isNaN(receivedValue)) {
        setCurrentValue(receivedValue);
        if (inputValue === "") {
          setInputValue(String(receivedValue));
        }
      }
    }
  });
  useSerialIntervalSender(fullCommandString, 9000, props.pollingEnabled ?? true);

  const handleDirectInput = (event: any) => {
    const newInputValue = event.target.value;
    setInputValue(newInputValue);
  };

  const commitValue = () => {
    const newValue = parseFloat(inputValue);
    if (!isNaN(newValue) && inputValue !== "") {
      sendValue(newValue);
    }
  };

  const handleInputKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitValue();
    }
  };

  return (
    <Stack direction="row" spacing={0.5} alignItems="flex-end" sx={{ py: 0.3 }}>
      <TextField
        label={`${props.label} Current`}
        value={currentValue ?? ""}
        variant="outlined"
        size="small"
        type="number"
        disabled
        sx={{
          flex: 0.7,
          minWidth: "64px",
          "& .MuiOutlinedInput-input": {
            fontSize: "0.78rem",
            padding: "4px 6px",
          },
          "& .MuiInputLabel-root": {
            fontSize: "0.72rem",
          },
        }}
      />
      <TextField
        label={`${props.label} Set`}
        value={inputValue}
        onChange={handleDirectInput}
        onKeyDown={handleInputKeyDown}
        variant="outlined"
        size="small"
        type="number"
        inputProps={{ step: props.step }}
        sx={{ 
          flex: 1,
          minWidth: "80px",
          "& .MuiOutlinedInput-input": { 
            fontSize: "0.85rem",
            padding: "6px 8px",
          },
          "& .MuiInputLabel-root": {
            fontSize: "0.8rem",
          },
        }}
      />
      <Button size="small" variant="outlined" onClick={commitValue} sx={{ minWidth: 56, height: 30 }}>
        Send
      </Button>
    </Stack>
  );
};

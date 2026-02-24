import { Button, Stack, TextField, Typography, Paper } from "@mui/material";
import { useState } from "react";
import { useSerialPortRef } from "../../lib/serialContext";
import { useSerialIntervalSender } from "../../lib/useSerialIntervalSender";
import { useSerialLineEvent } from "../../lib/useSerialLineEvent";

export const JoggingControl = ({ motorKey }: { motorKey: string }) => {
  const fullCommandString = `${motorKey}`;
  const serialRef = useSerialPortRef();
  const [targetValue, setTargetValue] = useState<number | null>(null);
  const [increment, setIncrement] = useState("1.0");

  useSerialIntervalSender(fullCommandString, 3000);

  useSerialLineEvent((line) => {
    if (!line.content.startsWith(fullCommandString)) {
      return;
    }

    const value = Number(line.content.slice(fullCommandString.length));
    if (!Number.isNaN(value)) {
      setTargetValue(value);
    }
  });

  const sendTarget = (value: number) => {
    serialRef.current?.send(`${fullCommandString}${value}`);
    setTargetValue(value);
  };

  const jog = (multiplier: number) => {
    const step = parseFloat(increment);
    if (!Number.isFinite(step) || step <= 0) {
      return;
    }
    const nextTarget = (targetValue ?? 0) + step * multiplier;
    sendTarget(nextTarget);
  };

  return (
    <Paper variant="outlined" sx={{ px: 1, py: 0.5 }}>
      <Stack gap={0.5}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", lineHeight: 1.1 }}>
          Jogging Control
        </Typography>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: "100%" }}>
          <Stack direction="row" spacing={0.7} alignItems="center" sx={{ flexWrap: "wrap" }}>
            <Button size="small" variant="outlined" onClick={() => jog(-10)} sx={{ minWidth: 44 }}>
              -10x
            </Button>
            <Button size="small" variant="outlined" onClick={() => jog(-1)} sx={{ minWidth: 40 }}>
              -1x
            </Button>
            <Button size="small" variant="outlined" color="error" onClick={() => sendTarget(0)} sx={{ minWidth: 52 }}>
              Zero
            </Button>
            <Button size="small" variant="outlined" onClick={() => jog(1)} sx={{ minWidth: 40 }}>
              +1x
            </Button>
            <Button size="small" variant="outlined" onClick={() => jog(10)} sx={{ minWidth: 46 }}>
              +10x
            </Button>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Target: {targetValue === null ? "-" : targetValue.toFixed(3)}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={0.6} alignItems="center" sx={{ pl: 1 }}>
            <Typography variant="caption">Increment:</Typography>
            <TextField
              size="small"
              type="number"
              value={increment}
              onChange={(event) => setIncrement(event.target.value)}
              inputProps={{ min: 0.0001, step: 0.1 }}
              sx={{ width: 84 }}
            />
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
};

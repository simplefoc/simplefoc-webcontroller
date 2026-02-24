import { Button, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { useSerialPortRef } from "../../lib/serialContext";

export const StepGenerator = ({ motorKey }: { motorKey: string }) => {
  const serialRef = useSerialPortRef();
  const intervalRef = useRef<number | null>(null);

  const [highValueInput, setHighValueInput] = useState("1");
  const [lowValueInput, setLowValueInput] = useState("0");
  const [durationInput, setDurationInput] = useState("1000");
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<"high" | "low" | null>(null);

  const stopGenerator = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    setCurrentStep(null);
  };

  useEffect(() => {
    return () => {
      stopGenerator();
    };
  }, []);

  useEffect(() => {
    stopGenerator();
  }, [motorKey]);

  const sendTarget = (value: number) => {
    serialRef.current?.send(`${motorKey}${value}`);
  };

  const startGenerator = () => {
    const highValue = Number(highValueInput);
    const lowValue = Number(lowValueInput);
    const durationMs = Number(durationInput);

    if (!Number.isFinite(highValue) || !Number.isFinite(lowValue)) {
      return;
    }
    if (!Number.isFinite(durationMs) || durationMs <= 0) {
      return;
    }

    stopGenerator();

    let nextStep: "high" | "low" = "high";
    sendTarget(highValue);
    setCurrentStep("high");
    setIsRunning(true);

    intervalRef.current = window.setInterval(() => {
      if (nextStep === "high") {
        sendTarget(lowValue);
        setCurrentStep("low");
        nextStep = "low";
      } else {
        sendTarget(highValue);
        setCurrentStep("high");
        nextStep = "high";
      }
    }, durationMs);
  };

  return (
    <Stack gap={0.7}>
      <Stack direction="row" spacing={0.8} sx={{ flexWrap: "wrap" }}>
        <TextField
          size="small"
          type="number"
          label="High"
          value={highValueInput}
          onChange={(event) => setHighValueInput(event.target.value)}
          sx={{ width: 96 }}
        />
        <TextField
          size="small"
          type="number"
          label="Low"
          value={lowValueInput}
          onChange={(event) => setLowValueInput(event.target.value)}
          sx={{ width: 96 }}
        />
        <TextField
          size="small"
          type="number"
          label="Duration (ms)"
          value={durationInput}
          onChange={(event) => setDurationInput(event.target.value)}
          inputProps={{ min: 1, step: 1 }}
          sx={{ width: 136 }}
        />
        <Button
          size="small"
          variant={isRunning ? "outlined" : "contained"}
          color={isRunning ? "error" : "primary"}
          onClick={isRunning ? stopGenerator : startGenerator}
          sx={{ minWidth: 92 }}
        >
          {isRunning ? "Stop" : "Start"}
        </Button>
      </Stack>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        State: {isRunning ? (currentStep === "high" ? "High step" : "Low step") : "Stopped"}
      </Typography>
    </Stack>
  );
};

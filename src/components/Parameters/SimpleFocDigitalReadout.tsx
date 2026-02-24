import { Paper, Stack, TextField } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { useSerialPort } from "../../lib/serialContext";
import { useSerialLineEvent } from "../../lib/useSerialLineEvent";

type MetricKey = "6" | "5" | "3" | "0";

const metricConfig: { key: MetricKey; label: string }[] = [
  { key: "6", label: "Angle" },
  { key: "5", label: "Velocity" },
  { key: "3", label: "Current" },
  { key: "0", label: "Target" },
];

export const SimpleFocDigitalReadout = ({
  motorKey,
  onAngleUpdate,
}: {
  motorKey: string;
  onAngleUpdate?: (motorKey: string, angle: number) => void;
}) => {
  const serial = useSerialPort();
  const [values, setValues] = useState<Record<MetricKey, number | null>>({
    "6": null,
    "5": null,
    "3": null,
    "0": null,
  });
  const nextMetricIndexRef = useRef(0);
  const pendingMetricRef = useRef<MetricKey | null>(null);
  const pendingSentAtRef = useRef(0);

  useEffect(() => {
    nextMetricIndexRef.current = 0;
    pendingMetricRef.current = null;
    pendingSentAtRef.current = 0;
    setValues({
      "6": null,
      "5": null,
      "3": null,
      "0": null,
    });
  }, [motorKey]);

  useEffect(() => {
    if (!serial?.port) {
      return;
    }

    const sendNextMetric = () => {
      const now = Date.now();
      if (pendingMetricRef.current && now - pendingSentAtRef.current < 500) {
        return;
      }

      const nextMetric = metricConfig[nextMetricIndexRef.current].key;
      serial.send(`${motorKey}MG${nextMetric}`);
      pendingMetricRef.current = nextMetric;
      pendingSentAtRef.current = now;
      nextMetricIndexRef.current = (nextMetricIndexRef.current + 1) % metricConfig.length;
    };

    sendNextMetric();
    const intervalRef = window.setInterval(sendNextMetric, 150);

    return () => {
      window.clearInterval(intervalRef);
    };
  }, [serial, motorKey]);

  useSerialLineEvent((line) => {
    const metricMatch = line.content.trim().match(/^(?:\?)?(\w)MG([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)$/);
    if (!metricMatch) {
      return;
    }

    const [_, receivedMotorKey, rawValue] = metricMatch;
    if (receivedMotorKey !== motorKey) {
      return;
    }

    const pendingMetric = pendingMetricRef.current;
    if (!pendingMetric) {
      return;
    }

    const parsedValue = Number(rawValue);
    if (Number.isNaN(parsedValue)) {
      return;
    }

    setValues((currentValues) => ({
      ...currentValues,
      [pendingMetric]: parsedValue,
    }));

    if (pendingMetric === "6") {
      onAngleUpdate?.(motorKey, parsedValue);
    }

    pendingMetricRef.current = null;
    pendingSentAtRef.current = 0;
  });

  const formatValue = (value: number | null) => {
    if (value === null) {
      return "";
    }
    return value.toFixed(3);
  };

  return (
    <Paper variant="outlined" sx={{ px: 1, py: 0.9 }}>
      <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ flexWrap: "nowrap", overflowX: "auto", pt: 1, pb: 0.2 }}>
        {metricConfig.map((metric) => (
          <TextField
            key={metric.key}
            label={metric.label}
            value={formatValue(values[metric.key])}
            variant="outlined"
            size="small"
            inputProps={{ readOnly: true }}
            sx={{
              width: 90,
              flexShrink: 0,
              mt: 0.2,
              "& .MuiOutlinedInput-input": {
                fontSize: "0.82rem",
                fontWeight: 700,
              },
              "& .MuiInputLabel-root": {
                fontSize: "0.72rem",
              },
            }}
          />
        ))}
      </Stack>
    </Paper>
  );
};

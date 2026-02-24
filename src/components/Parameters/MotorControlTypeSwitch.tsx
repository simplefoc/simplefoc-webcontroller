import {
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useSerialPortRef } from "../../lib/serialContext";
import { useSerialIntervalSender } from "../../lib/useSerialIntervalSender";
import { useSerialLineEvent } from "../../lib/useSerialLineEvent";

const MOTION_MODES = [
  { value: "torque", label: "Torque", code: 0 },
  { value: "vel", label: "Velocity", code: 1 },
  { value: "angle", label: "Position", code: 2 },
  { value: "vel open", label: "Velocity open", code: 3 },
  { value: "angle open", label: "Position open", code: 4 },
  { value: "angle nocascade", label: "Position no cascade", code: 5 },
  { value: "custom", label: "Custom", code: 6 },
];

const PRIMARY_MODE_VALUES = [
  "torque",
  "vel",
  "angle nocascade",
  "angle",
  "custom",
];

const OPEN_LOOP_MODE_VALUES = ["vel open", "angle open"];

const PRIMARY_MODES = MOTION_MODES.filter((mode) =>
  PRIMARY_MODE_VALUES.includes(mode.value)
);

const OPEN_LOOP_MODES = MOTION_MODES.filter((mode) =>
  OPEN_LOOP_MODE_VALUES.includes(mode.value)
);

const MOTION_VALUE_TO_CODE = MOTION_MODES.reduce((acc, mode) => {
  acc[mode.value] = mode.code;
  return acc;
}, {} as Record<string, number>);

const MOTION_CODE_TO_VALUE = MOTION_MODES.reduce((acc, mode) => {
  acc[String(mode.code)] = mode.value;
  return acc;
}, {} as Record<string, string>);

const MOTION_TEXT_TO_VALUE = MOTION_MODES.reduce((acc, mode) => {
  acc[mode.value.toLowerCase()] = mode.value;
  return acc;
}, {} as Record<string, string>);

export const MotorControlTypeSwitch = ({
  motorKey,
  pollingEnabled = true,
}: {
  motorKey: string;
  pollingEnabled?: boolean;
}) => {
  const fullCommandString = `${motorKey}C`;
  const [value, setValue] = useState<string | null>(null);
  const serialRef = useSerialPortRef();

  const handleChange = (e: any, val: string) => {
    if (!val) {
      return;
    }
    serialRef.current?.send(
      `${fullCommandString}${MOTION_VALUE_TO_CODE[val]}`
    );
  };

  useSerialLineEvent((line) => {
    if (!line.content.startsWith(fullCommandString)) {
      return;
    }

    const receivedValue = line.content
      .slice(fullCommandString.length)
      .trim();

    if (!receivedValue || receivedValue.startsWith("T")) {
      return;
    }

    const parsedValue =
      MOTION_CODE_TO_VALUE[receivedValue] ||
      MOTION_TEXT_TO_VALUE[receivedValue.toLowerCase()];

    if (parsedValue) {
      setValue(parsedValue);
    }
  });
  useSerialIntervalSender(fullCommandString, 10000, pollingEnabled);

  return (
    <Stack>
      <Typography>Motion control:</Typography>
      <Stack gap={0.6}>
        <ToggleButtonGroup
          value={value}
          exclusive
          onChange={handleChange}
          size="small"
          sx={{ flexWrap: "wrap", gap: 0.5 }}
        >
          {PRIMARY_MODES.map((mode) => (
            <ToggleButton key={mode.value} value={mode.value} sx={{ textTransform: "none" }}>
              {mode.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <ToggleButtonGroup
          value={value}
          exclusive
          onChange={handleChange}
          size="small"
          sx={{ flexWrap: "wrap", gap: 0.5 }}
        >
          {OPEN_LOOP_MODES.map((mode) => (
            <ToggleButton key={mode.value} value={mode.value} sx={{ textTransform: "none" }}>
              {mode.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>
    </Stack>
  );
};

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

const TORQUE_MODES = [
  { value: "volt", label: "Voltage", code: 0 },
  { value: "est. curr", label: "Estimated current", code: 3 },
  { value: "foc curr", label: "FOC current", code: 2 },
  { value: "dc curr", label: "DC Current", code: 1 },
];

const TORQUE_VALUE_TO_CODE = TORQUE_MODES.reduce((acc, mode) => {
  acc[mode.value] = mode.code;
  return acc;
}, {} as Record<string, number>);

const TORQUE_CODE_TO_VALUE = TORQUE_MODES.reduce((acc, mode) => {
  acc[String(mode.code)] = mode.value;
  return acc;
}, {} as Record<string, string>);

const TORQUE_TEXT_TO_VALUE = TORQUE_MODES.reduce((acc, mode) => {
  acc[mode.value.toLowerCase()] = mode.value;
  return acc;
}, {} as Record<string, string>);

export const TorqueControlTypeSwitch = ({
  motorKey,
  pollingEnabled = true,
}: {
  motorKey: string;
  pollingEnabled?: boolean;
}) => {
  const fullCommandString = `${motorKey}T`;
  const [value, setValue] = useState<string | null>(null);
  const serialRef = useSerialPortRef();

  const handleChange = (e: any, val: string) => {
    if (!val) {
      return;
    }
    serialRef.current?.send(
      `${fullCommandString}${TORQUE_VALUE_TO_CODE[val]}`
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
      TORQUE_CODE_TO_VALUE[receivedValue] ||
      TORQUE_TEXT_TO_VALUE[receivedValue.toLowerCase()];

    if (parsedValue) {
      setValue(parsedValue);
    }
  });
  useSerialIntervalSender(fullCommandString, 10000, pollingEnabled);

  return (
    <Stack>
      <Typography>Torque mode:</Typography>
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={handleChange}
        size="small"
        sx={{ flexWrap: "wrap", gap: 0.5 }}
      >
        {TORQUE_MODES.map((mode) => (
          <ToggleButton key={mode.value} value={mode.value} sx={{ textTransform: "none" }}>
            {mode.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Stack>
  );
};

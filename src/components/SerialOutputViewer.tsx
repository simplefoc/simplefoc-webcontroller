import { Box } from "@mui/system";
import { FixedSizeList } from "react-window";
import { useEffect, useMemo, useRef } from "react";
import { useSerialPort, useSerialPortLines } from "../lib/serialContext";
import { SerialLine } from "../simpleFoc/serial";

const SerialLineDisplay = ({
  index,
  style,
  data,
}: {
  index: number;
  style: any;
  data: SerialLine[];
}) => (
  <div
    style={{
      ...style,
      lineHeight: "1.5",
      fontSize: "13px",
      padding: "6px 12px",
      fontFamily: "'Roboto Mono', monospace",
      borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
      backgroundColor: data[index].type === "received" ? "rgba(76, 175, 80, 0.05)" : "rgba(33, 150, 243, 0.05)",
    }}
  >
    <span style={{ fontWeight: 600, color: data[index].type === "received" ? "#4caf50" : "#2196f3" }}>
      {data[index].type === "received" ? "↓ RX" : "↑ TX"}
    </span>
    {" "}
    <span style={{ color: "#212121" }}>{data[index].content}</span>
  </div>
);

const serialLinesToKey = (index: number, data: SerialLine[]) => {
  return data[index].index;
};

const SerialLinesList = FixedSizeList<SerialLine[]>;

export const SerialOutputViewer = () => {
  const listRef = useRef<any>();
  const listOuterRef = useRef<any>();
  const lines = useSerialPortLines();
  const visibleLines = useMemo(
    () =>
      lines.filter((line) => {
        const content = line.content.trim();
        if (/^\wM[SD](?:[-+]?\d+|[01]{7})?$/.test(content)) {
          return false;
        }
        if (/^\wMG\d+$/.test(content)) {
          return false;
        }
        if (/^(?:\?)?\wMG[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?$/.test(content)) {
          return false;
        }
        if (/^(\w).*\t.*\1$/.test(content)) {
          return false;
        }
        return true;
      }),
    [lines]
  );

  useEffect(() => {
    if (!listRef.current) {
      return;
    }
    if (
      listOuterRef.current &&
      listOuterRef.current?.scrollHeight -
        (listOuterRef.current?.scrollTop + listOuterRef.current?.clientHeight) <
        1000
    ) {
      listRef.current.scrollToItem(visibleLines.length ? visibleLines.length - 1 : 0);
    }
  }, [visibleLines]);

  return (
    <Box
      sx={{
        borderRadius: 1,
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box
        sx={{
          bgcolor: "#f5f5f5",
          border: "1px solid",
          borderColor: "divider",
          flex: 1,
          height: 300,
          contain: "content",
        }}
      >
        <SerialLinesList
          itemData={visibleLines}
          itemCount={visibleLines.length}
          height={300}
          itemSize={20}
          width="100%"
          itemKey={serialLinesToKey}
          ref={listRef}
          outerRef={listOuterRef}
        >
          {SerialLineDisplay}
        </SerialLinesList>
      </Box>
    </Box>
  );
};

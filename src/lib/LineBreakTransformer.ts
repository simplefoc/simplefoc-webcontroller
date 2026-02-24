export class LineBreakTransformer implements Transformer<string, string> {
  static readonly MAX_CHUNKS_LENGTH = 200000;

  chunks = "";

  transform: TransformerTransformCallback<string, string> = (
    chunk,
    controller
  ) => {
    // Append new chunks to existing chunks.
    this.chunks += chunk;
    if (this.chunks.length > LineBreakTransformer.MAX_CHUNKS_LENGTH) {
      const cutoffIndex = this.chunks.length - LineBreakTransformer.MAX_CHUNKS_LENGTH;
      const nextNewline = this.chunks.indexOf("\n", cutoffIndex);
      this.chunks = nextNewline === -1 ? this.chunks.slice(-LineBreakTransformer.MAX_CHUNKS_LENGTH) : this.chunks.slice(nextNewline + 1);
    }

    let newlineIndex = this.chunks.indexOf("\n");
    while (newlineIndex !== -1) {
      const rawLine = this.chunks.slice(0, newlineIndex);
      const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;
      controller.enqueue(line);
      this.chunks = this.chunks.slice(newlineIndex + 1);
      newlineIndex = this.chunks.indexOf("\n");
    }
  };

  flush: TransformerFlushCallback<string> = (controller) => {
    // When the stream is closed, flush any remaining chunks out.
    controller.enqueue(this.chunks);
  };
}

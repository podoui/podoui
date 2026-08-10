import { z } from "zod";

const cssLengthSchema = z.string().regex(/^(?:0|\d+(?:\.\d+)?px)$/, "Use 0 or a pixel length.");

const shadowSchema = z
  .string()
  .regex(
    /^-?\d+(?:\.\d+)?px(?:\s+-?\d+(?:\.\d+)?px){3}\s+rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(?:0|1|0?\.\d+)\s*\)$/,
    "Use four pixel lengths followed by an rgba() color."
  )
  .superRefine((value, context) => {
    const channels = value.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)$/);
    if (!channels) return;
    if (channels.slice(1, 4).some((channel) => Number(channel) > 255)) {
      context.addIssue({
        code: "custom",
        message: "RGB shadow channels must be between 0 and 255.",
      });
    }
    const alpha = Number(channels[4]);
    if (alpha < 0 || alpha > 1) {
      context.addIssue({ code: "custom", message: "Shadow alpha must be between 0 and 1." });
    }
  });

const legacyElevationColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Use a six-digit hex color from the v1 elevation contract.");

const elevationModeSchema = z
  .object({ light: legacyElevationColorSchema, dark: legacyElevationColorSchema })
  .strict();

export const legacyUtilitiesDocumentSchema = z
  .object({
    schemaVersion: z.literal("2.0.0"),
    kind: z.literal("legacy-utilities"),
    border: z
      .object({
        style: z.literal("solid"),
        widths: z
          .object({
            "0": cssLengthSchema,
            "1": cssLengthSchema,
            "2": cssLengthSchema,
            "3": cssLengthSchema,
            "4": cssLengthSchema,
          })
          .strict(),
      })
      .strict(),
    radius: z
      .object({
        values: z
          .object({
            "0": cssLengthSchema,
            "1": cssLengthSchema,
            "2": cssLengthSchema,
            "3": cssLengthSchema,
            "4": cssLengthSchema,
            "5": cssLengthSchema,
            "6": cssLengthSchema,
            full: cssLengthSchema,
          })
          .strict(),
      })
      .strict(),
    shadow: z
      .object({
        values: z
          .object({
            "1": shadowSchema,
            "2": shadowSchema,
            "3": shadowSchema,
            "4": shadowSchema,
            "5": shadowSchema,
          })
          .strict(),
      })
      .strict(),
    elevation: z
      .object({
        values: z
          .object({
            base: elevationModeSchema,
            "1": elevationModeSchema,
            "2": elevationModeSchema,
            "3": elevationModeSchema,
          })
          .strict(),
      })
      .strict(),
    visibility: z
      .object({
        breakpoints: z
          .object({
            pc: z.object({ minWidth: cssLengthSchema }).strict(),
            tablet: z.object({ minWidth: cssLengthSchema, maxWidth: cssLengthSchema }).strict(),
            mobile: z.object({ maxWidth: cssLengthSchema }).strict(),
          })
          .strict(),
      })
      .strict(),
  })
  .strict();

export type LegacyUtilitiesDocument = z.infer<typeof legacyUtilitiesDocumentSchema>;

export function parseLegacyUtilitiesDocument(input: unknown): LegacyUtilitiesDocument {
  return legacyUtilitiesDocumentSchema.parse(input);
}

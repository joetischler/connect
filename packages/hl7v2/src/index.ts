import { HL7Message } from 'hl7v2';
import type { ParsedPayload, Classification } from '@connect/types';

export const VERSION = '0.1.0';

export interface HL7v2ParseResult {
  parsed: ParsedPayload;
  classification: Classification;
  /** Structured segment data extracted from the message */
  segments: Record<string, Record<string, string>[]>;
}

/**
 * Extract a field value from a segment, returning empty string if not present.
 */
function fieldValue(segment: ReturnType<HL7Message['getSegment']>, position: number): string {
  if (!segment) return '';
  try {
    const field = segment.field(position);
    return field?.toHL7String?.() ?? '';
  } catch {
    return '';
  }
}

/**
 * Parse raw HL7v2 message text into structured data.
 */
export function parseHL7v2(raw: string): HL7v2ParseResult {
  const msg = HL7Message.parse(raw);

  // Extract MSH header info
  const msh = msg.getSegment('MSH');
  const sendingApp = fieldValue(msh, 3);
  const sendingFacility = fieldValue(msh, 4);
  const receivingApp = fieldValue(msh, 5);
  const receivingFacility = fieldValue(msh, 6);
  const messageDateTime = fieldValue(msh, 7);
  const messageTypeRaw = fieldValue(msh, 9);
  const controlId = fieldValue(msh, 10);
  const version = fieldValue(msh, 12);

  // Parse message type (e.g., "ADT^A01" -> { messageType: "ADT", triggerEvent: "A01" })
  const [messageType = '', triggerEvent = ''] = messageTypeRaw.split(msg.componentSeparator);

  // Extract all segments into structured data
  const segments: Record<string, Record<string, string>[]> = {};
  for (const segment of msg.segments) {
    const segType = segment.segmentType;
    if (!segments[segType]) {
      segments[segType] = [];
    }
    const fieldData: Record<string, string> = {};
    for (let i = 1; i <= segment.fields.length; i++) {
      const val = fieldValue(segment, i);
      if (val) {
        fieldData[`${segType}.${i}`] = val;
      }
    }
    segments[segType].push(fieldData);
  }

  const parsed: ParsedPayload = {
    format: 'hl7v2',
    content: {
      messageType: `${messageType}^${triggerEvent}`,
      version,
      controlId,
      sendingApp,
      sendingFacility,
      receivingApp,
      receivingFacility,
      messageDateTime,
      segments,
    },
    parserVersion: VERSION,
  };

  const classification: Classification = {
    format: 'hl7v2',
    confidence: 1.0,
    tier: 'deterministic',
    hl7v2: {
      messageType,
      triggerEvent,
      version,
      sendingApp,
      sendingFacility,
    },
  };

  return { parsed, classification, segments };
}

/**
 * Detect if a string is likely HL7v2 format.
 */
export function isHL7v2(input: string): boolean {
  const trimmed = input.trim();
  return trimmed.startsWith('MSH|') || trimmed.startsWith('MSH\x1c');
}

/**
 * Generate an ACK response for an HL7v2 message.
 */
export function createAck(raw: string): string {
  const msg = HL7Message.parse(raw);
  const ack = msg.createAck();
  return ack.toHL7String();
}

/**
 * Generate a NAK response for an HL7v2 message.
 */
export function createNak(raw: string, errors: string[]): string {
  const msg = HL7Message.parse(raw);
  const nak = msg.createNak(errors);
  return nak.toHL7String();
}

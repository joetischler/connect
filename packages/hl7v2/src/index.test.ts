import { describe, it, expect } from 'vitest';
import { parseHL7v2, isHL7v2, createAck, VERSION } from './index.js';

// Sample ADT^A01 message (patient admit)
const ADT_A01 = [
  'MSH|^~\\&|EPIC|FACILITY1|DEST|DESTFAC|20240115120000||ADT^A01|MSG001|P|2.5.1',
  'EVN|A01|20240115120000',
  'PID|1||PAT001^^^FACILITY1^MR||DOE^JOHN^Q||19800515|M|||123 MAIN ST^^ANYTOWN^NY^12345^US',
  'PV1|1|I|ICU^101^A|||ATTENDING^DOCTOR^A|||SUR||||ADM|A0||||||||||||||||||||||||||20240115120000',
].join('\r');

// Sample ORU^R01 message (lab result)
const ORU_R01 = [
  'MSH|^~\\&|LAB|LABFAC|EHR|EHRFAC|20240115130000||ORU^R01|MSG002|P|2.3',
  'PID|1||PAT002^^^LABFAC^MR||SMITH^JANE||19901020|F',
  'OBR|1||ORD001|CBC^Complete Blood Count',
  'OBX|1|NM|WBC^White Blood Cell Count||7.5|10*3/uL|4.5-11.0|N|||F',
  'OBX|2|NM|RBC^Red Blood Cell Count||4.8|10*6/uL|4.0-5.5|N|||F',
].join('\r');

describe('isHL7v2', () => {
  it('detects valid HL7v2 messages', () => {
    expect(isHL7v2(ADT_A01)).toBe(true);
    expect(isHL7v2(ORU_R01)).toBe(true);
  });

  it('rejects non-HL7v2 content', () => {
    expect(isHL7v2('{"resourceType": "Patient"}')).toBe(false);
    expect(isHL7v2('<ClinicalDocument>')).toBe(false);
    expect(isHL7v2('ISA*00')).toBe(false);
    expect(isHL7v2('')).toBe(false);
  });

  it('handles leading whitespace', () => {
    expect(isHL7v2('  MSH|^~\\&|TEST')).toBe(true);
  });
});

describe('parseHL7v2', () => {
  it('parses ADT^A01 message', () => {
    const result = parseHL7v2(ADT_A01);

    expect(result.parsed.format).toBe('hl7v2');
    expect(result.parsed.parserVersion).toBe(VERSION);

    const content = result.parsed.content as Record<string, unknown>;
    expect(content.messageType).toBe('ADT^A01');
    expect(content.version).toBe('2.5.1');
    expect(content.controlId).toBe('MSG001');
    expect(content.sendingApp).toBe('EPIC');
    expect(content.sendingFacility).toBe('FACILITY1');
  });

  it('parses ORU^R01 message', () => {
    const result = parseHL7v2(ORU_R01);

    const content = result.parsed.content as Record<string, unknown>;
    expect(content.messageType).toBe('ORU^R01');
    expect(content.version).toBe('2.3');
    expect(content.sendingApp).toBe('LAB');
  });

  it('extracts classification with full confidence', () => {
    const result = parseHL7v2(ADT_A01);

    expect(result.classification.format).toBe('hl7v2');
    expect(result.classification.confidence).toBe(1.0);
    expect(result.classification.tier).toBe('deterministic');
    expect(result.classification.hl7v2).toBeDefined();
    expect(result.classification.hl7v2!.messageType).toBe('ADT');
    expect(result.classification.hl7v2!.triggerEvent).toBe('A01');
    expect(result.classification.hl7v2!.version).toBe('2.5.1');
  });

  it('extracts segments', () => {
    const result = parseHL7v2(ADT_A01);

    expect(result.segments).toBeDefined();
    expect(result.segments['MSH']).toBeDefined();
    expect(result.segments['PID']).toBeDefined();
    expect(result.segments['PV1']).toBeDefined();
    expect(result.segments['EVN']).toBeDefined();
  });

  it('extracts PID segment fields', () => {
    const result = parseHL7v2(ADT_A01);
    const pid = result.segments['PID']?.[0];
    expect(pid).toBeDefined();
    // PID.3 = patient ID, PID.5 = patient name
    expect(pid?.['PID.3']).toContain('PAT001');
    expect(pid?.['PID.5']).toContain('DOE');
  });

  it('handles multiple OBX segments in ORU', () => {
    const result = parseHL7v2(ORU_R01);
    const obxSegments = result.segments['OBX'];
    expect(obxSegments).toBeDefined();
    expect(obxSegments.length).toBe(2);
  });
});

describe('createAck', () => {
  it('creates an ACK response', () => {
    const ack = createAck(ADT_A01);
    expect(ack).toContain('MSH|');
    expect(ack).toContain('ACK');
    expect(ack).toContain('MSG001');
  });
});

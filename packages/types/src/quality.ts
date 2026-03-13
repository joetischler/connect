/**
 * Data quality scoring types.
 */

export interface QualityScore {
  /** Overall score 0-100 */
  overall: number;
  dimensions: {
    /** Required fields populated */
    completeness: number;
    /** Values match expected formats/valuesets */
    conformance: number;
    /** Cross-field logical consistency */
    consistency: number;
    /** How fresh is the data */
    timeliness: number;
    /** Duplicate detection score */
    uniqueness: number;
  };
  issues: QualityIssue[];
}

export interface QualityIssue {
  /** FHIR path or field reference */
  field: string;
  severity: 'critical' | 'major' | 'minor' | 'info';
  dimension: keyof QualityScore['dimensions'];
  message: string;
  /** Suggested fix */
  suggestion?: string;
}

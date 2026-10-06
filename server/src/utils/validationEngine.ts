import { IESGRecord } from '../models/ESGRecord';
import ESGIndicator from '../models/ESGIndicator';
import mongoose from 'mongoose';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates an ESG Record against generic rules and indicator-specific constraints.
 * This should ideally run within a transaction context if data consistency across collections is strictly required.
 */
export const validateRecord = async (record: IESGRecord): Promise<ValidationResult> => {
  const errors: string[] = [];

  // 1. Basic field presence
  if (!record.projectId) errors.push('Project is required.');
  if (!record.reportingPeriodId) errors.push('Reporting Period is required.');
  if (!record.indicatorId) errors.push('Indicator is required.');
  if (record.value === undefined || record.value === null) errors.push('Value is required.');
  
  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // 2. Fetch Indicator Configuration
  const indicator = await ESGIndicator.findById(record.indicatorId);
  if (!indicator) {
    return { isValid: false, errors: ['Invalid indicator configuration.'] };
  }

  // 3. Unit validation
  if (indicator.unit && record.unit !== indicator.unit) {
    errors.push(`Unit must be ${indicator.unit}. Received: ${record.unit}`);
  }

  // 4. Data Type validation
  if (indicator.dataType === 'NUMBER') {
    if (isNaN(Number(record.value))) {
      errors.push('Value must be a valid number.');
    } else {
      const numValue = Number(record.value);
      if (numValue < 0) {
        errors.push('Numeric value cannot be negative unless specified.');
      }
    }
  } else if (indicator.dataType === 'BOOLEAN') {
    if (typeof record.value !== 'boolean' && record.value !== 'true' && record.value !== 'false') {
      errors.push('Value must be a boolean (true/false).');
    }
  }

  // 5. Evidence requirements
  // In a full implementation, we could have an indicator flag `isEvidenceRequired`.
  // For now, if the indicator is mandatory, we might enforce evidence. Let's make it a strict rule for MVP if needed,
  // or we can just require evidence for all quantitative (NUMBER) entries.
  if (indicator.dataType === 'NUMBER' && (!record.evidenceIds || record.evidenceIds.length === 0)) {
    errors.push('Evidence is required for numeric indicators.');
  }

  // 6. Dynamic Validation Rules from Indicator
  if (indicator.validationRules && indicator.validationRules.length > 0) {
    for (const rule of indicator.validationRules) {
      const numValue = Number(record.value);
      if (rule.type === 'NUMERIC_MIN' && numValue < Number(rule.value)) {
        errors.push(rule.errorMessage || `Value must be at least ${rule.value}`);
      }
      if (rule.type === 'NUMERIC_MAX' && numValue > Number(rule.value)) {
        errors.push(rule.errorMessage || `Value cannot exceed ${rule.value}`);
      }
      if (rule.type === 'LOGICAL' && rule.expression) {
        // e.g. "value <= ENV-EN-01"
        try {
          const match = rule.expression.match(/value\s*(<=|<|>=|>|==)\s*([A-Z0-9-]+)/);
          if (match) {
            const operator = match[1];
            const targetIndicatorCode = match[2];
            
            // Need to fetch the target indicator ID and its corresponding record
            const targetIndicator = await ESGIndicator.findOne({ code: targetIndicatorCode });
            if (targetIndicator) {
              // Lazy-load ESGRecord to avoid circular dependency
              const ESGRecordModel = mongoose.model('ESGRecord');
              const targetRecord = await ESGRecordModel.findOne({
                indicatorId: targetIndicator._id,
                projectId: record.projectId,
                reportingPeriodId: record.reportingPeriodId,
                status: 'APPROVED'
              });

              if (targetRecord) {
                const targetValue = Number(targetRecord.value);
                const currentValue = Number(record.value);
                let ruleFailed = false;
                
                if (operator === '<=' && !(currentValue <= targetValue)) ruleFailed = true;
                if (operator === '<' && !(currentValue < targetValue)) ruleFailed = true;
                if (operator === '>=' && !(currentValue >= targetValue)) ruleFailed = true;
                if (operator === '>' && !(currentValue > targetValue)) ruleFailed = true;
                
                if (ruleFailed) {
                  errors.push(rule.errorMessage || `Logical rule failed: ${rule.expression}`);
                }
              }
            }
          }
        } catch (err) {
          console.error('Error evaluating logical validation rule', err);
        }
      }
      if (rule.type === 'VARIANCE_MAX') {
        try {
          const ESGRecordModel = mongoose.model('ESGRecord');
          // Find the most recent approved record for the same project and indicator (assuming previous period)
          const previousRecord = await ESGRecordModel.findOne({
            indicatorId: record.indicatorId,
            projectId: record.projectId,
            reportingPeriodId: { $ne: record.reportingPeriodId },
            status: 'APPROVED'
          }).sort({ createdAt: -1 });

          if (previousRecord && !isNaN(Number(previousRecord.value)) && !isNaN(numValue) && Number(previousRecord.value) !== 0) {
            const prevVal = Number(previousRecord.value);
            const variance = Math.abs((numValue - prevVal) / prevVal) * 100;
            if (variance > Number(rule.value)) {
              errors.push(rule.errorMessage || `Value variance (${variance.toFixed(2)}%) exceeds the maximum allowed (${rule.value}% YoY) compared to previous period.`);
            }
          }
        } catch (err) {
          console.error('Error evaluating YoY variance validation rule', err);
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

import mongoose, { Schema, Document } from 'mongoose';

export interface IValidationRule {
  type: 'NUMERIC_MIN' | 'NUMERIC_MAX' | 'REQUIRED' | 'LOGICAL';
  value?: number | string;
  expression?: string; // For complex logical validations
  errorMessage: string;
}

export interface IESGIndicator extends Document {
  code: string;
  name: string;
  category: 'ENVIRONMENT' | 'SOCIAL' | 'GOVERNANCE';
  subcategory?: string;
  unit: string;
  description?: string;
  dataType: 'NUMBER' | 'STRING' | 'BOOLEAN' | 'OPTIONS';
  options?: string[]; // If dataType is OPTIONS
  frequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
  aggregationMethod: 'SUM' | 'AVERAGE' | 'COUNT' | 'RATIO' | 'PERCENTAGE' | 'INTENSITY';
  mandatory: boolean;
  validationRules: IValidationRule[];
  brsrMappings: {
    section: string;
    principle?: string;
    disclosure: string;
  }[];
  status: 'ACTIVE' | 'INACTIVE';
}

const ESGIndicatorSchema: Schema = new Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['ENVIRONMENT', 'SOCIAL', 'GOVERNANCE'],
    required: true 
  },
  subcategory: { type: String },
  unit: { type: String, required: true },
  description: { type: String },
  dataType: { 
    type: String, 
    enum: ['NUMBER', 'STRING', 'BOOLEAN', 'OPTIONS'],
    required: true 
  },
  options: [{ type: String }],
  frequency: { 
    type: String, 
    enum: ['MONTHLY', 'QUARTERLY', 'ANNUALLY'],
    default: 'ANNUALLY' 
  },
  aggregationMethod: {
    type: String,
    enum: ['SUM', 'AVERAGE', 'COUNT', 'RATIO', 'PERCENTAGE', 'INTENSITY'],
    default: 'SUM'
  },
  mandatory: { type: Boolean, default: false },
  validationRules: [{
    type: { type: String, enum: ['NUMERIC_MIN', 'NUMERIC_MAX', 'REQUIRED', 'LOGICAL'] },
    value: { type: Schema.Types.Mixed },
    expression: { type: String },
    errorMessage: { type: String }
  }],
  brsrMappings: [{
    section: { type: String },
    principle: { type: String },
    disclosure: { type: String }
  }],
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
}, { timestamps: true });

export default mongoose.model<IESGIndicator>('ESGIndicator', ESGIndicatorSchema);

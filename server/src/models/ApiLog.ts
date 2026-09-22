import mongoose, { Schema, Document } from 'mongoose';

export interface IApiLog extends Document {
  serviceAccountId?: mongoose.Types.ObjectId;
  integrationId?: mongoose.Types.ObjectId;
  endpoint: string;
  method: string;
  statusCode: number;
  durationMs: number;
  requestId: string;
  errorMessage?: string;
  createdAt: Date;
}

const ApiLogSchema: Schema = new Schema({
  serviceAccountId: { type: Schema.Types.ObjectId, ref: 'ServiceAccount' },
  integrationId: { type: Schema.Types.ObjectId, ref: 'Integration' },
  endpoint: { type: String, required: true },
  method: { type: String, required: true },
  statusCode: { type: Number, required: true },
  durationMs: { type: Number, required: true },
  requestId: { type: String, required: true, index: true },
  errorMessage: { type: String }
}, { timestamps: { updatedAt: false } }); // Only need createdAt for logs

export default mongoose.model<IApiLog>('ApiLog', ApiLogSchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
  referenceType: 'ESGRecord' | 'Submission' | 'ValidationIssue' | 'Task';
  referenceId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  commentText: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema: Schema = new Schema({
  referenceType: { 
    type: String,
    enum: ['ESGRecord', 'Submission', 'ValidationIssue', 'Task'],
    required: true,
    index: true
  },
  referenceId: { type: Schema.Types.ObjectId, required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  commentText: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model<IComment>('Comment', CommentSchema);

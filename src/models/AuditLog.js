import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  action: String,
  entity: String,
  entityId: mongoose.Schema.Types.ObjectId
}, { timestamps: true });

export default mongoose.model("AuditLog", auditLogSchema);
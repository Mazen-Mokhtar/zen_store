import { Prop, raw, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { User } from "src/commen/Decorator/user.decorator";
import { IAttachments } from "src/commen/multer/cloud.service";

@Schema({ timestamps: true })
export class Game {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  description: string;

  @Prop(raw({
    secure_url: { type: String, required: false },
    public_id: { type: String, required: false }
  }))
  image?: IAttachments;

  // New field to define required/optional fields for account info
  @Prop({
    type: [{ fieldName: { type: String }, isRequired: { type: Boolean } }],
    required: false,
  })
  accountInfoFields: { fieldName: string; isRequired: boolean }[];

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categoryId: Types.ObjectId;

  @Prop({ type: Boolean })
  isDeleted: boolean
  @Prop({ type: Boolean, default: true })
  isActive: boolean
  
  @Prop({ type: Boolean, default: false })
  isPopular: boolean
  
  @Prop({ type: Types.ObjectId, ref: User.name })
  createdBy: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: User.name })
  updateBy: Types.ObjectId
}

export const GameSchema = SchemaFactory.createForClass(Game);
export type GameDocument = HydratedDocument<Game>;
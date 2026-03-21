import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type GameDocument = HydratedDocument<Game>;

@Schema({ timestamps: true })
export class Game {
  @Prop({ required: true, unique: true, trim: true })
  title!: string;

  @Prop({ required: true, unique: true, trim: true })
  slug!: string;

  @Prop({ required: true })
  genre!: string;

  @Prop({ required: true })
  publisher!: string;

  @Prop({ required: true })
  thumbnail!: string;

  @Prop({ required: true })
  heroImage!: string;

  @Prop({ default: true })
  isPopular!: boolean;

  @Prop({ default: false })
  isFeatured!: boolean;

  @Prop({ default: 0 })
  activePlayers!: number;

  @Prop({ default: 0 })
  liveStreams!: number;

  @Prop({ default: 4.5 })
  rating!: number;

  @Prop({ type: [String], default: [] })
  modes!: string[];
}

export const GameSchema = SchemaFactory.createForClass(Game);

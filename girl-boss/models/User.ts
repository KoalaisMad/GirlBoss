import { Schema, model, models } from "mongoose";

const EmergencyContacts = new Schema (
    {
        name: {type: String, required: true, trim: true},
        phone: {type: String, required: true, trim: true},
    },
    { _id: true, timestamps: true}
);

const UserSchema = new Schema(
    {
        name: {type: String, required: true, trim: true},
        email: {type: String, required: true, unique: true, trim: true},
        contacts: {type: [EmergencyContacts], default: []},
    },
    {timestamps: true}
);

UserSchema.index({email:1}, {unique:true});

export type EmergencyContact = {
    _id: string;
    name: string;
    phone: string;
}

export interface IUser {
    _id: string;
    name: string;
    email: string;
    contacts: EmergencyContact[];
}

export default models.User || model<IUser>("User", UserSchema);
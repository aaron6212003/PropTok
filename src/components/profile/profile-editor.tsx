"use client";

import { useState, useRef } from "react";
import { Camera, Edit2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { updateProfile } from "@/app/actions";

export default function ProfileEditor({
    userId,
    initialUsername,
    initialAvatarUrl,
    memberSince
}: {
    userId: string,
    initialUsername: string,
    initialAvatarUrl: string | null,
    memberSince: number
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [username, setUsername] = useState(initialUsername || "");
    const [avatarPreview, setAvatarPreview] = useState<string | null>(initialAvatarUrl);
    const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setNewAvatarFile(file);
            const objectUrl = URL.createObjectURL(file);
            setAvatarPreview(objectUrl);
            setIsEditing(true); // Auto enter edit mode on file pick
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        const formData = new FormData();
        formData.append("username", username);
        if (newAvatarFile) {
            formData.append("avatar", newAvatarFile);
        }

        const res = await updateProfile(formData);

        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success("Profile Updated!");
            setIsEditing(false);
            setNewAvatarFile(null);
        }
        setIsSaving(false);
    };

    return (
        <div className="mt-4 flex flex-col items-center gap-4">
            {/* Avatar Section */}
            <div className="relative group">
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative h-28 w-28 rounded-full border-2 border-brand bg-zinc-900 p-1 cursor-pointer overflow-hidden transition-transform hover:scale-105 active:scale-95"
                >
                    {avatarPreview ? (
                        <img
                            src={avatarPreview}
                            alt="Avatar"
                            className="h-full w-full rounded-full object-cover"
                        />
                    ) : (
                        <div className="h-full w-full rounded-full bg-gradient-to-br from-zinc-800 to-zinc-950" />
                    )}

                    {/* Overlay for "Change Photo" hint */}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                        <Camera size={24} className="text-white" />
                    </div>
                </div>

                {/* Edit Badge */}
                <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white shadow-lg hover:brightness-110 active:scale-90 transition-all"
                >
                    <Edit2 size={14} />
                </button>

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                />
            </div>

            {/* Username Section */}
            {isEditing ? (
                <div className="flex flex-col items-center gap-2 animate-in fade-in slide-in-from-top-2">
                    <input
                        type="text"
                        name="username_edit_field_generic"
                        id="username_edit_field"
                        autoComplete="new-password"
                        data-lpignore="true"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-center font-bold text-white focus:outline-none focus:border-brand w-48"
                        placeholder="Username"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={() => { setIsEditing(false); setAvatarPreview(initialAvatarUrl); setUsername(initialUsername); }}
                            disabled={isSaving}
                            className="p-2 rounded-full bg-zinc-800 text-zinc-400 hover:text-white"
                        >
                            <X size={18} />
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-brand text-white font-bold hover:brightness-110 disabled:opacity-50"
                        >
                            {isSaving ? "Saving..." : <><Save size={16} /> Save</>}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center">
                    <h2
                        onClick={() => setIsEditing(true)}
                        className="text-2xl font-bold tracking-tight lowercase cursor-pointer hover:text-brand transition-colors"
                    >
                        @{initialUsername}
                    </h2>
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                        Member since {memberSince}
                    </p>
                </div>
            )}
        </div>
    );
}

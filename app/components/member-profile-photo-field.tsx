"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { blobToDataUrl, resizeAvatarFile, validateAvatarFile } from "@/lib/avatar-upload";

type MemberProfilePhotoFieldProps = {
  image: string | null;
  initials: string;
  isGoogleAccount: boolean;
  loading: boolean;
  onUploaded: (image: string | null) => void;
  onError: (message: string) => void;
  onMessage: (message: string) => void;
  setLoading: (loading: boolean) => void;
};

function isGooglePhotoUrl(image: string | null) {
  return Boolean(image && image.includes("googleusercontent.com"));
}

export function ProfileAvatarImage({
  image,
  initials,
  sizeClass = "h-28 w-28",
}: {
  image: string | null;
  initials: string;
  sizeClass?: string;
}) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full border border-plum/10 bg-pink-soft ${sizeClass}`}
    >
      {image ? (
        image.startsWith("data:") || isGooglePhotoUrl(image) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="h-full w-full object-cover" />
        ) : (
          <Image src={image} alt="" fill className="object-cover" sizes="112px" />
        )
      ) : (
        <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-brand">
          {initials}
        </div>
      )}
    </div>
  );
}

export function MemberProfilePhotoField({
  image,
  initials,
  isGoogleAccount,
  loading,
  onUploaded,
  onError,
  onMessage,
  setLoading,
}: MemberProfilePhotoFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const displayImage = preview ?? image;
  const usingGooglePhoto = isGoogleAccount && isGooglePhotoUrl(displayImage);
  const hasCustomPhoto = Boolean(displayImage?.startsWith("data:"));

  const helperText = usingGooglePhoto
    ? "Using your Google profile photo. You can upload a different photo if you prefer."
    : displayImage
      ? "Your profile photo appears across your member account."
      : "Add a profile photo from your device (JPG, PNG, or WebP, up to 2 MB).";

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    const validationError = validateAvatarFile(file);
    if (validationError) {
      onError(validationError);
      return;
    }

    setLoading(true);
    onError("");
    onMessage("");

    try {
      const resized = await resizeAvatarFile(file);
      const uploadFile =
        resized instanceof File
          ? resized
          : new File([resized], file.name, { type: resized.type || file.type });

      const previewUrl = await blobToDataUrl(uploadFile);
      setPreview(previewUrl);

      const formData = new FormData();
      formData.append("photo", uploadFile);

      const response = await fetch("/api/members/profile/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        setPreview(null);
        throw new Error(data.error ?? "Unable to upload photo.");
      }

      onUploaded(data.profile.image ?? previewUrl);
      setPreview(null);
      onMessage("Profile photo updated.");
    } catch (error) {
      setPreview(null);
      onError(error instanceof Error ? error.message : "Unable to upload photo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove() {
    if (!displayImage) return;

    setLoading(true);
    onError("");
    onMessage("");

    try {
      const response = await fetch("/api/members/profile/avatar", {
        method: "DELETE",
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to remove photo.");
      }

      setPreview(null);
      onUploaded(data.profile.image ?? null);
      onMessage(
        isGoogleAccount && data.profile.image
          ? "Restored your Google profile photo."
          : "Profile photo removed.",
      );
    } catch (error) {
      onError(error instanceof Error ? error.message : "Unable to remove photo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 sm:items-start">
      <ProfileAvatarImage image={displayImage} initials={initials} />

      <p className="max-w-[11rem] text-center text-xs leading-relaxed text-muted sm:text-left">
        {helperText}
      </p>

      <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
        <button
          type="button"
          disabled={loading}
          onClick={() => inputRef.current?.click()}
          className="rounded-lg bg-plum px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-plum-hover disabled:opacity-60"
        >
          {loading ? "Saving…" : displayImage ? "Change photo" : "Upload photo"}
        </button>

        {hasCustomPhoto && (
          <button
            type="button"
            disabled={loading}
            onClick={handleRemove}
            className="rounded-lg border border-plum/20 px-4 py-2 text-xs font-semibold text-plum hover:border-brand hover:text-brand disabled:opacity-60"
          >
            {isGoogleAccount ? "Use Google photo" : "Remove"}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={handleFileChange}
      />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import api, { setAuthToken } from "../utils/axios";

export default function ShowForm({ initialShow = null, onSubmit, onClose }) {
  const [title, setTitle] = useState(initialShow?.title ?? "");
  const [mediaType, setMediaType] = useState(
    initialShow?.media_type ?? initialShow?.mediaType ?? "series",
  );
  const [status, setStatus] = useState(initialShow?.status ?? "Watching");
  const [currentEpisode, setCurrentEpisode] = useState(
    initialShow?.currentEpisode ?? initialShow?.current_episode ?? 0,
  );
  const [totalEpisodes, setTotalEpisodes] = useState(
    initialShow?.total_episodes ?? initialShow?.totalEpisodes ?? "",
  );
  const [profiles, setProfiles] = useState([]);
  const [profileId, setProfileId] = useState(
    initialShow?.profileid ?? initialShow?.profileId ?? "",
  );

  const [newProfileName, setNewProfileName] = useState("");
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { getToken, isLoaded, isSignedIn, userId } = useAuth();

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) return;

    let cancelled = false;

    const fetchProfiles = async () => {
      try {
        const token = await getToken();
        setAuthToken(token);

        const { data } = await api.get("/profiles");
        if (cancelled) return;

        const list = Array.isArray(data) ? data : (data?.profiles ?? []);
        setProfiles(list);
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to fetch profiles:", error);
          setFormError("Failed to load profiles");
        }
      }
    };

    fetchProfiles();

    return () => {
      cancelled = true;
    };
  }, [getToken, isLoaded, isSignedIn, userId]);

  const handleCreateProfile = async () => {
    const trimmed = newProfileName.trim();
    if (!trimmed) return;

    setIsCreatingProfile(true);
    setFormError("");

    try {
      const token = await getToken();
      setAuthToken(token);

      const { data } = await api.post("/profiles", { name: trimmed });
      setProfiles((prev) => [...prev, data]);
      setProfileId(String(data.id));
      setNewProfileName("");
    } catch (error) {
      setFormError(
        error.response?.data?.error ||
          error.message ||
          "Failed to create profile",
      );
    } finally {
      setIsCreatingProfile(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!title.trim()) return;

    setIsSubmitting(true);
    setFormError("");

    const isMovie = mediaType === "movie";
    const parsedCurrent = Math.max(0, Number(currentEpisode) || 0);
    const parsedTotal =
      !isMovie && totalEpisodes !== ""
        ? Math.max(1, Number(totalEpisodes) || 1)
        : null;

    const normalizedEpisode = isMovie
      ? status === "Completed"
        ? 1
        : 0
      : parsedTotal
        ? Math.min(parsedCurrent, parsedTotal)
        : parsedCurrent;

    const normalizedStatus =
      !isMovie && parsedTotal && normalizedEpisode >= parsedTotal
        ? "Completed"
        : status;

    try {
      await onSubmit({
        title: title.trim(),
        media_type: mediaType,
        status: normalizedStatus,
        current_episode: normalizedEpisode,
        total_episodes: isMovie ? 1 : parsedTotal,
        profile_id: profileId ? Number(profileId) : null,
      });
    } catch (error) {
      setFormError(
        error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Failed to save show",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {initialShow ? "Edit entry" : "Add entry"}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {formError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {formError}
          </div>
        )}

        <div className="space-y-4">
          {/* Series / Movie selector */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Type
            </label>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
              {[
                { value: "series", label: "Series" },
                { value: "movie", label: "Movie" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setMediaType(option.value)}
                  className={`rounded-lg py-2 text-sm font-semibold transition ${
                    mediaType === option.value
                      ? "bg-white text-indigo-600 shadow-sm dark:bg-gray-900 dark:text-indigo-400"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {mediaType === "movie" ? "Movie title" : "Series title"}
            </label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={
                mediaType === "movie"
                  ? "Enter movie title"
                  : "Enter series title"
              }
              required
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            />
          </div>

          {/* Profile */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Profile
            </label>
            <select
              value={profileId}
              onChange={(event) => setProfileId(event.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            >
              <option value="">No profile</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>

            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={newProfileName}
                onChange={(event) => setNewProfileName(event.target.value)}
                placeholder="New profile name"
                className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-900 outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              />
              <button
                type="button"
                onClick={handleCreateProfile}
                disabled={isCreatingProfile || !newProfileName.trim()}
                className="rounded-xl border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                {isCreatingProfile ? "Adding..." : "+ Profile"}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Status
            </label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            >
              {[
                "Watching",
                "Plan to watch",
                "On hold",
                "Completed",
                "Dropped",
              ].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          {/* Series only: episodes */}
          {mediaType === "series" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Current episode
                </label>
                <input
                  type="number"
                  min="0"
                  max={totalEpisodes ? Number(totalEpisodes) : undefined}
                  value={currentEpisode}
                  onChange={(event) => setCurrentEpisode(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Total episodes
                </label>
                <input
                  type="number"
                  min="1"
                  value={totalEpisodes}
                  onChange={(event) => setTotalEpisodes(event.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                />
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? "Saving..."
              : initialShow
                ? "Save changes"
                : mediaType === "movie"
                  ? "Add movie"
                  : "Add series"}
          </button>
        </div>
      </form>
    </div>
  );
}

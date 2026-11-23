"use client";

import { useEffect, useState } from "react";
import axios from "../utils/axios";

export default function ShowForm({ initialShow = null, onSubmit, onClose }) {
  const [title, setTitle] = useState(initialShow?.title ?? "");
  const [status, setStatus] = useState(initialShow?.status ?? "Watching");
  const [currentEpisode, setCurrentEpisode] = useState(
    initialShow?.currentEpisode ?? 0,
  );
  const [profiles, setProfiles] = useState([]);
  const [profileId, setProfileId] = useState(initialShow?.profileId ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const { data } = await axios.get("/profiles");
        setProfiles(data);
      } catch (error) {
        console.error("Failed to fetch profiles:", error);
      }
    };

    fetchProfiles();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!title.trim()) return;

    setIsSubmitting(true);

    try {
      await onSubmit({
        title: title.trim(),
        status,
        current_episode: Number(currentEpisode),
        profile_id: Number(profileId),
      });
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
            {initialShow ? "Edit show" : "Add show"}
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

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Show title
            </label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Enter show title"
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
              <option value="">Select profile</option>

              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
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

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Current episode
            </label>
            <input
              type="number"
              min="0"
              value={currentEpisode}
              onChange={(event) => setCurrentEpisode(event.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            />
          </div>
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
                : "Add show"}
          </button>
        </div>
      </form>
    </div>
  );
}

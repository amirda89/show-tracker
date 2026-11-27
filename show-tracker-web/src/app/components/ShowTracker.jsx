"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import api, { setAuthToken } from "../utils/axios";

import ShowForm from "./ShowForm";
import ShowFilters from "./ShowFilters";
import ShowList from "./ShowList";

function getShowFromResponse(data) {
  return data?.show ?? data;
}

export default function ShowTracker() {
  const [shows, setShows] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShow, setEditingShow] = useState(null);

  const [busyShowIds, setBusyShowIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const { getToken, isLoaded, isSignedIn, userId } = useAuth();

  // GET ALL SHOWS & PROFILES
  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !userId) {
      setShows([]);
      setProfiles([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        setError("");
        setShows([]);

        const token = await getToken();
        setAuthToken(token);

        const [showsRes, profilesRes] = await Promise.all([
          api.get("/shows"),
          api.get("/profiles"),
        ]);

        if (cancelled) return;

        const fetchedShows = showsRes.data?.shows ?? showsRes.data;
        if (!Array.isArray(fetchedShows)) {
          throw new Error("Invalid shows response from server");
        }

        setShows(
          fetchedShows.map((show) => ({
            ...show,
            id: show.id ?? show._id,
            currentEpisode: show.currentEpisode ?? show.current_episode ?? 0,
          })),
        );

        const fetchedProfiles = profilesRes.data?.profiles ?? profilesRes.data;
        if (Array.isArray(fetchedProfiles)) {
          setProfiles(fetchedProfiles);
        }
      } catch (err) {
        if (cancelled) return;
        setError(
          err.response?.data?.error ||
            err.response?.data?.message ||
            err.message ||
            "Failed to load data",
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchUserData();

    return () => {
      cancelled = true;
    };
  }, [getToken, isLoaded, isSignedIn, userId]);

  // LOADING STATE FOR INDIVIDUAL SHOWS
  const setShowBusy = (id, busy) => {
    setBusyShowIds((current) =>
      busy
        ? current.includes(id)
          ? current
          : [...current, id]
        : current.filter((item) => item !== id),
    );
  };

  // ADD SHOW
  const handleAddShow = async (newShow) => {
    setError("");

    try {
      const token = await getToken();
      setAuthToken(token);

      const { data } = await api.post("/shows", newShow);

      const createdShow = getShowFromResponse(data);

      setShows((current) => [
        {
          ...createdShow,
          id: createdShow.id ?? createdShow._id,
          currentEpisode:
            createdShow.currentEpisode ??
            createdShow.current_episode ??
            newShow.current_episode ??
            0,
        },
        ...current,
      ]);

      setActiveFilter("All");
      setTypeFilter("all");
      setIsModalOpen(false);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Failed to add show",
      );
    }
  };

  // EDIT SHOW
  const handleEditShow = async (updatedFields) => {
    if (!editingShow) return;

    const id = editingShow.id;

    setShowBusy(id, true);
    setError("");

    try {
      const token = await getToken();
      setAuthToken(token);

      const { data } = await api.put(`/shows/${id}`, updatedFields);

      const updatedShow = getShowFromResponse(data);

      setShows((current) =>
        current.map((show) =>
          show.id === id
            ? {
                ...show,
                ...updatedShow,
                id: updatedShow.id ?? updatedShow._id ?? id,
                currentEpisode:
                  updatedShow.currentEpisode ??
                  updatedShow.current_episode ??
                  updatedFields.current_episode ??
                  show.currentEpisode,
              }
            : show,
        ),
      );

      setEditingShow(null);
      setIsModalOpen(false);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Failed to update show",
      );
    } finally {
      setShowBusy(id, false);
    }
  };

  // DELETE SHOW
  const handleDeleteShow = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this show?",
    );

    if (!confirmed) return;

    setShowBusy(id, true);
    setError("");

    try {
      const token = await getToken();
      setAuthToken(token);

      await api.delete(`/shows/${id}`);

      setShows((current) => current.filter((show) => show.id !== id));
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Failed to delete show",
      );
    } finally {
      setShowBusy(id, false);
    }
  };

  // INCREMENT / DECREMENT EPISODE
  const handleEpisodeChange = async (show, action) => {
    const id = show.id;

    if (action === "decrement" && show.currentEpisode <= 0) {
      return;
    }

    setShowBusy(id, true);
    setError("");

    try {
      const token = await getToken();
      setAuthToken(token);

      const { data } = await api.patch(`/shows/${id}/episode`, { action });

      const updatedShow = getShowFromResponse(data);

      setShows((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                ...updatedShow,
                id: updatedShow.id ?? updatedShow._id ?? id,
                status: updatedShow.status ?? item.status,
                currentEpisode:
                  updatedShow.currentEpisode ??
                  updatedShow.current_episode ??
                  item.currentEpisode,
              }
            : item,
        ),
      );
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Failed to update episode",
      );
    } finally {
      setShowBusy(id, false);
    }
  };

  // MARK MOVIE COMPLETED
  const handleMarkCompleted = async (show) => {
    setShowBusy(show.id, true);
    setError("");

    try {
      const token = await getToken();
      setAuthToken(token);

      const { data } = await api.put(`/shows/${show.id}`, {
        title: show.title,
        media_type: "movie",
        status: "Completed",
        current_episode: 1,
        total_episodes: 1,
        profile_id: show.profileid ?? show.profileId ?? null,
      });

      const updatedShow = getShowFromResponse(data);

      setShows((current) =>
        current.map((item) =>
          item.id === show.id
            ? {
                ...item,
                ...updatedShow,
                id: updatedShow.id ?? updatedShow._id ?? show.id,
                status: updatedShow.status ?? "Completed",
                currentEpisode:
                  updatedShow.currentEpisode ??
                  updatedShow.current_episode ??
                  1,
              }
            : item,
        ),
      );
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Failed to mark movie completed",
      );
    } finally {
      setShowBusy(show.id, false);
    }
  };

  // MODAL CONTROLS
  const openAddModal = () => {
    setEditingShow(null);
    setIsModalOpen(true);
  };

  const openEditModal = (show) => {
    setEditingShow(show);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingShow(null);
  };

  const handleFormSubmit = async (formData) => {
    if (editingShow) {
      await handleEditShow(formData);
    } else {
      await handleAddShow(formData);
    }
  };

  const filteredShows = shows.filter((show) => {
    const mediaType = show.media_type ?? show.mediaType ?? "series";
    const matchesType = typeFilter === "all" || mediaType === typeFilter;
    const matchesStatus =
      activeFilter === "All" || show.status === activeFilter;
    return matchesType && matchesStatus;
  });

  return (
    <main className="mx-auto min-h-screen w-full max-w-[680px] px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            Show Tracker
          </h1>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Keep track of what you are watching
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          + Add entry
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          <p>{error}</p>

          <button
            type="button"
            onClick={() => setError("")}
            className="shrink-0 font-semibold underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="py-16 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-600" />

          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Loading shows...
          </p>
        </div>
      ) : (
        <>
          <ShowFilters
            shows={shows}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
          />

          <ShowList
            shows={filteredShows}
            activeFilter={activeFilter}
            busyShowIds={busyShowIds}
            onEdit={openEditModal}
            onDelete={handleDeleteShow}
            onEpisodeChange={handleEpisodeChange}
            onMarkCompleted={handleMarkCompleted}
          />
        </>
      )}

      {isModalOpen && (
        <ShowForm
          initialShow={editingShow}
          onSubmit={handleFormSubmit}
          onClose={closeModal}
        />
      )}
    </main>
  );
}

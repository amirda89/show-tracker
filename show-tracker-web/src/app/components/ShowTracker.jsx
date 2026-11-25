"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import api, { setAuthToken } from "../utils/axios";

import ShowForm from "./ShowForm";
import ShowFilters from "./ShowFilters";
import ShowList from "./ShowList";

// Supports both { show: {...} } and direct show responses
function getShowFromResponse(data) {
  return data?.show ?? data;
}

export default function ShowTracker() {
  const [shows, setShows] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShow, setEditingShow] = useState(null);

  const [busyShowIds, setBusyShowIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const { getToken, isLoaded } = useAuth();

  // GET ALL SHOWS
  useEffect(() => {
    if (!isLoaded) return;

    const fetchShows = async () => {
      try {
        setIsLoading(true);
        setError("");

        const token = await getToken();
        setAuthToken(token);

        const { data } = await api.get("/shows");

        // Supports { shows: [...] } or [...]
        const fetchedShows = data?.shows ?? data;

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
      } catch (err) {
        setError(
          err.response?.data?.message || err.message || "Failed to load shows",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchShows();
  }, [getToken, isLoaded]);

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
      setIsModalOpen(false);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to add show",
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
        err.response?.data?.message || err.message || "Failed to update show",
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
        err.response?.data?.message || err.message || "Failed to delete show",
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
        err.response?.data?.message ||
          err.message ||
          "Failed to update episode",
      );
    } finally {
      setShowBusy(id, false);
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

  // FILTER SHOWS
  const filteredShows =
    activeFilter === "All"
      ? shows
      : shows.filter((show) => show.status === activeFilter);

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
          + Add show
        </button>
      </div>

      {/* Error message */}
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

      {/* Loading */}
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
          />

          <ShowList
            shows={filteredShows}
            activeFilter={activeFilter}
            busyShowIds={busyShowIds}
            onEdit={openEditModal}
            onDelete={handleDeleteShow}
            onEpisodeChange={handleEpisodeChange}
          />
        </>
      )}

      {/* Add / Edit modal */}
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

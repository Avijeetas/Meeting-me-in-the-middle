import React, { useState, useEffect, useCallback } from "react";
import usePlaceOperations from "./usePlaceSelect";
import { useSharedStateDestructured } from "./sharedState";
import Modal from "./Modal";
import { ChangeTransportation } from "./ChangeTransportation";
import { Filters } from "./Filters";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPencilAlt,
  faWheelchair,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import { faStar as faStarRegular } from "@fortawesome/free-regular-svg-icons";
import {
  FilterTabs,
  AccessibilityTabFilter,
  FavoritesTabFilter,
} from "./FilterTabs";
import { InviteFriend } from "../ui/friends/buttons";
import { set } from "zod";
import { getTravelMode } from "./ChangeTransportation";

export function SuggestedPlaces() {
  const {
    places,
    selectedPlace,
    setSelectedPlace,
    distanceInMiles,
    userInfo,
    friendInfo,
    map,
    placeTypeFilters,
    setPlaceTypeFilters,
    priceLevelFilters,
    setPriceLevelFilters,
    accessibilityFilter,
    setAccessibilityFilter,
    tripDuration,
    setTripDuration,
    error,
    setError,
    meetingTime,
    favorites,
    setFavorites,
    favoritesFilter,
    setFavoritesFilter,
    originLocation,
    travelMode,
  } = useSharedStateDestructured();

  const { handlePlaceSelect, updatePlaces } = usePlaceOperations();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isWheelChairAccessible, setIsWheelChairAccessible] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [reviews, setReviews] = useState<
    google.maps.places.PlaceReview[] | null
  >(null);
  const [activePlaces, setActivePlaces] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [distances, setDistances] = useState<{ [key: string]: number }>({});
  const [durations, setDurations] = useState<{ [key: string]: string }>({});

  const handlePlaceClick = (place: google.maps.places.PlaceResult) => {
    handlePlaceSelect(place);
    setIsModalOpen(true);
    setError(null);
  };

  const handleFavoritesClick = (place: google.maps.places.PlaceResult) => {
    const newFavorites = [...favorites];
    const index = newFavorites.findIndex(
      (favorite) => favorite.place_id === place.place_id
    );
    if (index === -1) {
      newFavorites.push(place);
    } else {
      newFavorites.splice(index, 1);
    }
    setFavorites(newFavorites);
    setIsActive(!isActive);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleFiltersClick = () => {
    setIsFiltersOpen(true);
    setError(null);
  };

  // Effect for fetching reviews
  useEffect(() => {
    if (!selectedPlace || !map) return;

    console.log("Making API request for reviews...");
    const service = new google.maps.places.PlacesService(map);

    service.getDetails(
      {
        placeId: selectedPlace.place_id ?? "",
        fields: ["reviews"],
      },
      (place, status) => {
        console.log("API request complete:", status);
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          const reviews = place.reviews ?? [];
          console.log("Reviews:", reviews);
          if (reviews.length === 0) {
            console.log("No reviews found for this place.");
          }
          setReviews(reviews);
        } else {
          console.error("Error fetching reviews:", status);
        }
      }
    );
  }, [selectedPlace, map]); // Only depends on selectedPlace and map

  // Effect for updating places when none exist
  useEffect(() => {
    if (!places.length && originLocation && !selectedPlace) {
      updatePlaces();
    }
  }, [places.length, originLocation, selectedPlace, updatePlaces]);

  // Effect for distance matrix calculations
  const calculateDistances = useCallback(() => {
    if (!(places.length > 0 && originLocation && travelMode)) return;

    const distanceService = new google.maps.DistanceMatrixService();
    const origins = [originLocation];
    const destinations = places.map((place) => place.vicinity ?? "");

    distanceService.getDistanceMatrix(
      {
        origins,
        destinations,
        travelMode: getTravelMode(travelMode),
      },
      (response, status) => {
        if (status === google.maps.DistanceMatrixStatus.OK && response) {
          const newDistances: { [key: string]: number } = {};
          const newDurations: { [key: string]: string } = {};

          response.rows[0].elements.forEach((element, index) => {
            const placeId = places[index]?.place_id ?? "";
            newDistances[placeId] = element.distance?.value ?? 0;
            newDurations[placeId] = element.duration?.text ?? "";
          });

          setDistances(newDistances);
          setDurations(newDurations);
        }
      }
    );
  }, [places, originLocation, travelMode]);

  // Debounced effect for distance calculations
  useEffect(() => {
    const debounceTimeout = setTimeout(calculateDistances, 1000);
    return () => clearTimeout(debounceTimeout);
  }, [
    calculateDistances,
    // These filters should only be included if they actually affect the distance calculations
    // If they don't, remove them from this dependency array
    placeTypeFilters,
    priceLevelFilters,
    accessibilityFilter,
    favoritesFilter,
  ]);

  return (
    <>
      <div className="flex flex-col h-full w-full">
        <div className="flex flex-row h-full w-full">
          <h2 className="text-lg font-bold mb-2">
            {places.length > 0
              ? `${places.length} Places Found`
              : "Search for Places"}
            <button
              onClick={handleFiltersClick}
              type="button"
              aria-label="Filters"
              style={{ marginLeft: "auto" }}
            >
              <FontAwesomeIcon icon={faPencilAlt} size="lg" />
            </button>
            <Modal
              isOpen={isFiltersOpen}
              onClose={() => setIsFiltersOpen(false)}
            >
              <Filters onClose={() => setIsFiltersOpen(false)} />
            </Modal>
          </h2>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              width: "60%",
            }}
          >
            <ChangeTransportation />
          </div>
        </div>
        <FilterTabs
          filters={placeTypeFilters}
          onDeleteFilter={(key: string) => {
            setPlaceTypeFilters({ ...placeTypeFilters, [key]: false });
            updatePlaces();
          }}
        />
        <FilterTabs
          filters={priceLevelFilters}
          onDeleteFilter={(key: string) => {
            setPriceLevelFilters({ ...priceLevelFilters, [key]: false });
            updatePlaces();
          }}
        />
        <AccessibilityTabFilter
          onChange={() => {
            setAccessibilityFilter(!accessibilityFilter);
            updatePlaces();
          }}
        />
        <FavoritesTabFilter
          onChange={() => {
            setFavoritesFilter(!favoritesFilter);
            updatePlaces();
          }}
        />
        {!Object.values(placeTypeFilters).some(Boolean) &&
        !Object.values(priceLevelFilters).some(Boolean) &&
        !accessibilityFilter &&
        !favoritesFilter ? (
          <p>No filters added</p>
        ) : null}

        {!selectedPlace && <p>No place selected</p>}
        <div
          style={{
            display: "grid",
            flexDirection: "column",
            height: "100%",
          }}
        >
          <div
            style={{
              overflowY: "auto",
              maxHeight: "600px",
              width: "full",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {places.length > 0 ? (
              places.map((place, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor:
                      selectedPlace?.name === place?.name
                        ? "lightblue"
                        : "white",
                    borderRadius: "10px",
                    padding: "10px",
                    marginBottom: "10px",
                    boxShadow: "0px 0px 10px rgba(0,0,0,0.1)",
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                  }}
                  onClick={() => handlePlaceSelect(place)}
                >
                  {place.photos && place.photos[0] ? (
                    <img
                      src={place.photos[0].getUrl()}
                      alt={place.name}
                      style={{
                        width: "100px",
                        height: "100px",
                        borderRadius: "5px",
                        marginRight: "10px",
                      }}
                      onError={(e) =>
                        console.error(
                          `Error loading image for place ${place.name}:`,
                          e
                        )
                      }
                    />
                  ) : (
                    <div
                      style={{
                        width: "100px",
                        height: "100px",
                        borderRadius: "5px",
                        marginRight: "10px",
                        backgroundColor: "#ccc",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <p className="text-center">No photo available</p>
                    </div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <h3 className="text-lg font-bold">
                      {place.name}
                      {isWheelChairAccessible && (
                        <FontAwesomeIcon
                          icon={faWheelchair}
                          size="sm"
                          style={{ marginLeft: "5px" }}
                        />
                      )}
                      <button
                        aria-label="Add to favorites"
                        type="button"
                        style={{
                          backgroundColor: "transparent",
                          border: "none",
                          padding: 0,
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          handleFavoritesClick(place);
                          const newActivePlaces: { [key: string]: boolean } = {
                            ...activePlaces,
                          };
                          newActivePlaces[place?.place_id ?? ""] =
                            !newActivePlaces[place?.place_id ?? ""];
                          setActivePlaces(newActivePlaces);
                        }}
                      >
                        <FontAwesomeIcon
                          icon={
                            activePlaces[place?.place_id ?? ""]
                              ? faStar
                              : faStarRegular
                          }
                          size="lg"
                          style={{
                            color: activePlaces[place?.place_id ?? ""]
                              ? "#FFD700"
                              : "#000",
                          }}
                        />
                      </button>
                    </h3>
                    <p className="text-sm">{place.vicinity}</p>
                    <p className="text-sm">
                      Distance:{" "}
                      {distances[place?.place_id ?? ""]
                        ? (distances[place?.place_id ?? ""] / 1609.34).toFixed(
                            2
                          )
                        : " "}
                      miles ({durations[place?.place_id ?? ""] || " "})
                    </p>
                    <p className="text-sm">
                      {place.price_level !== undefined
                        ? place.price_level === 0
                          ? "Price Level: Free"
                          : place.price_level === 1
                          ? "Price Level: $"
                          : place.price_level === 2
                          ? "Price Level: $$"
                          : place.price_level === 3
                          ? "Price Level: $$$"
                          : place.price_level === 4
                          ? "Price Level: $$$$"
                          : " "
                        : " "}
                    </p>
                  </div>
                  <button
                    onClick={() => handlePlaceClick(place)}
                    className="text-blue-600 underline"
                    style={{ marginLeft: "auto" }}
                  >
                    More
                  </button>
                </div>
              ))
            ) : favoritesFilter ? (
              <p>No favorite places found.</p>
            ) : (
              <p>No places found matching your filters.</p>
            )}
          </div>
        </div>

        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          style={{
            // width: "900px",
            // height: "600px",
            margin: "auto",
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0px 0px 10px rgba(0,0,0,0.1)",
          }}
        >
          {selectedPlace && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
              }}
            >
              {selectedPlace.photos && selectedPlace.photos.length > 0 ? (
                <img
                  src={selectedPlace.photos[0].getUrl() ?? ""}
                  alt={selectedPlace.name}
                  style={{
                    width: "100%",
                    height: "200px",
                    borderRadius: "10px",
                  }}
                />
              ) : (
                <p
                  style={{
                    textAlign: "center",
                    fontSize: "18px",
                    padding: "20px",
                  }}
                >
                  Photo not available
                </p>
              )}
              <h2 className="text-lg font-bold">{selectedPlace.name}</h2>
              <p>{selectedPlace.vicinity}</p>
              <p>
                Miles: {distanceInMiles.toFixed(2)} ({tripDuration})
              </p>
              <p>Rating: {selectedPlace.rating}/5</p>
              <h2 className="text-md font-bold mt-4 flex items-center">
                Reviews
                {userInfo && friendInfo && selectedPlace && (
                  <InviteFriend
                    inviter={userInfo}
                    invitee={friendInfo}
                    place={selectedPlace}
                    meetingTime={meetingTime}
                  />
                )}
              </h2>
              <div
                style={{
                  display: "grid",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "20px",
                    maxHeight: "250px",
                    width: "full",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {reviews &&
                    reviews.map((review, index) => (
                      <div
                        key={index}
                        style={{
                          backgroundColor: "white",
                          borderRadius: "10px",
                          padding: "10px",
                          marginBottom: "10px",
                          boxShadow: "0px 0px 10px rgba(0,0,0,0.1)",
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                        }}
                      >
                        <p>
                          <strong>{review.author_name}</strong> ({review.rating}
                          /5)
                        </p>
                        <p>{review.text}</p>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </>
  );
}

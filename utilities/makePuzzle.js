// libraries
const axios = require("axios");
require("dotenv").config();
const fs = require("fs");

// variables
const API_KEY = process.env.TMDB_API_KEY;
const TMDB_SEARCH_POP_URL = process.env.TMDB_SEARCH_POP_URL;
const TMDB_SEARCH_CREDITS_FRONT = process.env.TMDB_SEARCH_CREDITS_FRONT;
const TMBD_SEARCH_CREDITS_BACK = process.env.TMBD_SEARCH_CREDITS_BACK;
const TMDB_DISCOVER_MOVIE_BY_ACTOR = process.env.TMDB_DISCOVER_MOVIE_BY_ACTOR;

const LOWEST_YEAR = 1990;
const CURRENT_YEAR = new Date().getFullYear();

const movieArray = [];
let actorArray = [];

// save the data
function saveData(data) {
  let timestamp = Date.now();
  fs.writeFile(`./data/${timestamp}.json`, data, (err) => {
    if (err) {
      console.error(err);
    }
  });
}

/**
 * Function to generate a puzzle.
 */
const makePuzzle = async () => {
  // const hold the puzzle

  // generate a random year
  const randomYear = Math.floor(
    Math.random() * (CURRENT_YEAR - LOWEST_YEAR) + LOWEST_YEAR
  );

  // generate a random number
  const randomPick = Math.floor(Math.random() * 10);

  // randomly get one of the most popular movies of a random year.
  const keyMovie = await axios
    .get(`${TMDB_SEARCH_POP_URL}${randomYear}&api_key=${API_KEY}`)
    .then((res) => {
      return res.data.results.find((movie, i) => {
        if (i === randomPick) {
          return movie;
        }
      });
    })
    .catch((e) => console.error(e));
  console.log(`key movie: ${keyMovie.original_title}`);
  movieArray[0] = keyMovie.id;

  // get the first five actors
  const firstFiveActors = await getFirstFiveActors(keyMovie.id, actorArray);
  actorArray = [...actorArray, ...firstFiveActors];

  for (let i = 1; i < 6; i++) {
    let actor = await getRandomActor(actorArray);
    console.log(`actor: ${actor.name}`);
    let movie = await getMovieByActorID(actor.id, movieArray);
    movieArray.push(movie.id);
    console.log(`movie: ${movie.original_title}`);
    let fiveMoreActors = await getFiveActors(movie.id, actorArray);
    actorArray = [...actorArray, ...fiveMoreActors];
  }

  // // get a random actor
  // const randomActor = await getRandomActor(actorArray);
  // console.log(`random actor: ${randomActor.name}`);

  // // get a random movie by that actor
  // const randomMovie = await getMovieByActorID(randomActor.id, movieArray);
  // movieArray[1] = randomMovie.id;
  // console.log(`movie2: ${randomMovie.original_title}`);

  const newPuzzle = { movies: movieArray, actors: actorArray };

  saveData(JSON.stringify(newPuzzle));
  return newPuzzle;
};

/**
 * Get five movies from one actor
 * @param {string} id
 * @returns
 */
const getFirstFiveActors = async (id) => {
  let tempArray = [];
  await axios
    .get(
      `${TMDB_SEARCH_CREDITS_FRONT}${id}${TMBD_SEARCH_CREDITS_BACK}?api_key=${API_KEY}`
    )
    .then((res) => {
      res.data.cast.forEach((actor) => {
        if (actor.order < 5) {
          tempArray.push(actor);
        }
      });
    })
    .catch((e) => {
      console.error(e);
    });
  return tempArray;
};

/**
 * Get five actors, filtering out any already chosen actors.
 * @param {string} id
 * @param {array} array
 */
const getFiveActors = async (id, array) => {
  let ids = array.map((item) => item.id);
  let tempArray = [];
  let filtered = [];

  await axios
    .get(
      `${TMDB_SEARCH_CREDITS_FRONT}${id}${TMBD_SEARCH_CREDITS_BACK}?api_key=${API_KEY}`
    )
    .then((res) => {
      filtered = res.data.cast.filter((actor) => !ids.includes(actor.id));
      for (let i = 0; i < 5; i++) {
        tempArray.push(filtered[i]);
      }
    })
    .catch((e) => {
      console.error(e);
    });
  return tempArray;
};

/**
 * get a random actor from the array
 * @param {array} array
 * @returns {object}
 */
const getRandomActor = async (array) => {
  const randomPick = Math.floor(Math.random() * array.length);
  const randomActor = array.find((actor, i) => {
    if (actor && i === randomPick) {
      return actor;
    }
  });
  return randomActor;
};

/**
 * Return a random movie from an actors top five most popular
 * @param {string} actorId
 */
const getMovieByActorID = async (actorId, movieIds) => {
  const randomPicka = Math.floor(Math.random() * 5);
  let rMovie = {};
  let filtered = [];
  await axios
    .get(`${TMDB_DISCOVER_MOVIE_BY_ACTOR}${actorId}&api_key=${API_KEY}`)
    .then((res) => {
      filtered = res.data.results.filter((movie) => {
        return !movieIds.includes(movie.id);
      });

      rMovie = filtered.find((movie, i) => {
        if (i === randomPicka) {
          return movie;
        }
      });
    })
    .catch((e) => {
      console.error(e);
    });
  return rMovie;
};

module.exports = { makePuzzle };
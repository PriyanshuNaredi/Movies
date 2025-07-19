import React, {useEffect, useState} from 'react'
import {useDebounce} from "react-use";
import Search from "./components/Search.jsx";
import Spinner from "./components/Spinner.jsx";
import MovieCard from "./components/MovieCard.jsx";
import {getTrendingMovies, updateSearchCount} from "./appwrite.js";

const API_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const API_OPTIONS = {
    method: "GET",
    headers: {
        accept: "application/json",
        Authorization: `Bearer ${API_KEY}`
    }
};

const App = () => {

    const [searchTerm, setSearchTerm] = useState('');

    const [errorMessage, setErrorMessage] = useState('');

    const [movieList, setMovieList] = useState([]);

    const [trendingMovies, setTrendingMovies] = useState([]);

    const [isLoading, setIsLoading] = useState(false);

    const [debouchedSearchTerm, setDebouchedSearchTerm] = useState('');


    useDebounce( () => setDebouchedSearchTerm(searchTerm), 800 , [searchTerm]);

    const fetchMovies = async (query = '') => {
        setIsLoading(true);
        setErrorMessage('');

        try {
            const endpoint = query
                ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
                : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;

            const response = await fetch(endpoint, API_OPTIONS);

            if (!response.ok) {
                throw new Error('Manual error');
            }
            const data = await response.json();

            if (data.response === "False"){
                setErrorMessage(data.Error || 'Failed to fetch Movies.');
                setMovieList([]);
                return;
            }

            setMovieList(data.results || []);

            if (query && data.results.length > 0){
                await updateSearchCount(query, data.results[0]);
            }

            // console.log(data);

        } catch (error){
            console.log(error.message);
            setErrorMessage("Error Fetching Movies.");
        } finally {
            setIsLoading(false);
        }
    };
    const loadTrendingMovies = async () => {
        try{
            const movies = await getTrendingMovies();

            setTrendingMovies(movies);

        }catch (error) {
            console.log(error);
            // setErrorMessage('Error Fetching Trending movies.');
        }
    };

    useEffect(() => {
        fetchMovies(debouchedSearchTerm);
    }, [debouchedSearchTerm]);

    useEffect(() => {
        loadTrendingMovies();
    },[]);

    return (
        <main>
            <div className={"pattern"} />

            <div className={"wrapper"} >
                <header>
                    <img src="./hero.png" alt={"hero-png"}/>
                    <h1> Find <span className={"text-gradient"}>Movies</span> without any HASSLE </h1>
                    <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                </header>

                {trendingMovies.length > 0 && (
                    <section className={"trending"}>
                        <h2> Trending Movies</h2>
                        <ul>
                            {trendingMovies.map(((movie, index) => (
                                <li key={movie.$id}>
                                    <p>{index + 1}</p>
                                    <img src={movie.poster_url} alt={movie.title} />
                                </li>
                            )))}
                        </ul>
                    </section>
                )}

                <section className={"all-movies"}>
                    <h2>All Movies</h2>

                    { isLoading ?
                        ( <Spinner/> ) :
                        errorMessage ? ( <p className={'text-red-500'}> {errorMessage}  </p>) :
                            (<ul>
                                {movieList.map( (movie) => (
                                    <MovieCard key={movie.id} movie={movie} />
                                    // <p key={movie.id} className={"text-white"}>{movie.title}</p>)
                                ))}
                            </ul>)
                    }

                    {/*{errorMessage && <p className={"text-red-500"}> {errorMessage} </p>}*/}

                </section>


            </div>

        </main>
    )
}
export default App

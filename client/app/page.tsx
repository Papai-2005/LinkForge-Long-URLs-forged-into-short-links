"use client";
import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type ApiResponse = {
  status?: boolean;
  data?: string;
  error?: string;
};

const readApiResponse = async (response: Response): Promise<ApiResponse> => {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    throw new Error(`Server returned ${response.status} instead of JSON`);
  }

  return response.json() as Promise<ApiResponse>;
};

const getShortUrlId = (value: string): string => {
  const trimmedValue = value.trim();

  try {
    const parsedUrl = new URL(trimmedValue);
    return parsedUrl.pathname.split("/").filter(Boolean).pop() ?? "";
  } catch {
    return trimmedValue.replace(/^\/+|\/+$/g, "").split("/").pop() ?? "";
  }
};

export default function Home() {

const [longUrl, setLongUrl] = useState("");
const [shortUrl, setShortUrl] = useState("");
const [generateShortUrl, setGenerateShortUrl] = useState("");
const [retrievedLongUrl, setRetrievedLongUrl] = useState("");
const [error, setError] = useState<string>("");


const handelGenerateShortUrl = async()=>{
  try {
    setError("");

    const response = await fetch(`${API_URL}/shortUrl`, {
      method: "POST",
      headers:{
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "originalUrl": longUrl
      })
    });

    const data = await readApiResponse(response);
    console.log(data);
    if(response.ok && data.data){
      setGenerateShortUrl(data.data);
    } else {
      setError(data.error ?? "Short URL was not generated");
    }

  } catch (err){
    console.error(err);
    setError(err instanceof Error ? err.message : "Request failed");
  }
};

const handelRetrieveLongUrl = async()=>{

  try {
      setError("");
      const shortUrlId = getShortUrlId(shortUrl);

      if(!shortUrlId){
        setError("Please provide a short URL or short URL ID");
        return;
      }

      const response = await fetch(`${API_URL}/${encodeURIComponent(shortUrlId)}`)
      const data = await readApiResponse(response);
      if(response.ok && data.data){
        setRetrievedLongUrl(data.data);
      } else {
        setError(data.error ?? "Long URL was not retrieved");
      }
  } catch (err){
    console.error(err);
    setError(err instanceof Error ? err.message : "Request failed");
  }
;


};




  return (
    <div className = "min-h-screen bg-purple-500 text-black-100 flex flex-col items-center justify-center p-4">
      <h1 className = "text-3xl font-bold mb-8 font-serif">
        Welcome to Url-Worlds!!!
      </h1>

      {/* Generate the Short Url */}
      <div className = "w-full max-w-md bg-yellow-400 rounded-lg p-6 mb-6">
        <h2 className = "text-xl font-semibold mb-4">
          Generate your desired Short Url
        </h2>

        <input type="text" placeholder="Enter the long URL" 
        value = {longUrl}
        onChange = {(e) => setLongUrl(e.target.value)} 
        className="w-full p-3 bg-gray-600 text-gray-300 placeholder:text-gray-500 border border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"/>


        <button 
        onClick = {handelGenerateShortUrl}
        className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Generate
        </button>

        {generateShortUrl && (
          <p className="mt-4 text-black-500">
            Short URL: <a href = {`${API_URL}/${generateShortUrl}`} target="_blank" rel="noopener noreferrer">
              {`${API_URL}/${generateShortUrl}`}
            </a>
          </p>
        )}
        {error && <p className="mt-4 text-red-300">{error}</p>}
      </div>


      {/*Retreieve the Long Url */}
      <div className = "w-full max-w-md bg-yellow-400 rounded-lg p-6">
        <h2 className = "text-xl font-semibold mb-4">
          Retrieve the Long Url from Short Url
        </h2>


        <input type="text" placeholder="Enter the short URL" 
        value = {shortUrl}
        onChange = {(e) => setShortUrl(e.target.value)} 
        className="w-full p-3 bg-gray-600 text-gray-300 placeholder:text-gray-500 border border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"/>


        <button 
        onClick = {handelRetrieveLongUrl}
        className="w-full mt-4 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded focus:outline-none"
        >
          Retrieve
        </button>

        {retrievedLongUrl && (
          <p className="mt-4 text-black-500">
            Long URL: <a href = {retrievedLongUrl} target="_blank" rel="noopener noreferrer">
              {retrievedLongUrl}
            </a>
          </p>
        )}


      </div>
    </div>
  );
}

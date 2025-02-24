"use client";
import React from "react";

import { useHandleStreamResponse } from "../utilities/runtime-helpers";

function MainComponent() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("web");
  const [translations, setTranslations] = useState({});
  const [aiInsights, setAiInsights] = useState({});
  const [streamingInsight, setStreamingInsight] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("es");
  const [generatedImage, setGeneratedImage] = useState(null);
  const [selectedResult, setSelectedResult] = useState(null);
  const handleStreamResponse = useHandleStreamResponse({
    onChunk: setStreamingInsight,
    onFinish: (message) => {
      if (selectedResult !== null) {
        setAiInsights((prev) => ({ ...prev, [selectedResult]: message }));
        setStreamingInsight("");
      }
    },
  });
  const performSearch = async (isLucky = false) => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      if (activeTab === "anime") {
        const response = await fetch(
          `/integrations/stable-diffusion-v-3/?prompt=${encodeURIComponent(
            query + ", anime style, high quality anime artwork"
          )}`
        );
        if (!response.ok) throw new Error("Image generation failed");
        const data = await response.json();
        setGeneratedImage(data.data[0]);
        setResults([]);
        return;
      }

      const searchResponse = await fetch(
        `/integrations/google-search/search?q=${encodeURIComponent(query)}`
      );
      if (!searchResponse.ok) throw new Error("Search failed");
      const searchData = await searchResponse.json();

      if (isLucky && searchData.items?.[0]) {
        window.location.href = searchData.items[0].link;
        return;
      }

      setResults(searchData.items || []);
      setGeneratedImage(null);

      if (activeTab === "ai") {
        const aiResponse = await fetch(
          "/integrations/chat-gpt/conversationgpt4",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: [
                {
                  role: "user",
                  content: `Search query: "${query}". Please provide insights and analysis.`,
                },
              ],
              stream: true,
            }),
          }
        );
        handleStreamResponse(aiResponse);
      }
    } catch (err) {
      setError(
        activeTab === "anime"
          ? "Image generation failed. Please try again."
          : "Search failed. Please try again."
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const translateResult = async (text, index) => {
    try {
      const response = await fetch(
        "/integrations/google-translate/language/translate/v2",
        {
          method: "POST",
          body: new URLSearchParams({
            q: text,
            target: selectedLanguage,
          }),
        }
      );
      const data = await response.json();
      setTranslations((prev) => ({
        ...prev,
        [index]: data.data.translations[0].translatedText,
      }));
    } catch (err) {
      console.error(err);
    }
  };
  const getAiInsight = async (result, index) => {
    try {
      setSelectedResult(index);
      const response = await fetch("/integrations/chat-gpt/conversationgpt4", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Analyze this search result and provide key insights: "${result.title} - ${result.snippet}"`,
            },
          ],
          stream: true,
        }),
      });
      handleStreamResponse(response);
    } catch (err) {
      console.error(err);
      setSelectedResult(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a202c] to-[#2d3748] relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a202c] to-[#2d3748]"></div>
        <div className="absolute inset-0 backdrop-blur-sm bg-[rgba(255,255,255,0.05)]"></div>
        <img
          src="https://ucarecdn.com/77e4a95d-423f-4b20-acd0-22b7cbd4c6e8/-/format/auto/"
          alt="Goku silhouette"
          className="absolute inset-0 w-full h-full object-contain opacity-30"
        />
        <div className="absolute inset-0 backdrop-blur-[2px]"></div>
      </div>
      <nav className="absolute top-4 right-4 flex gap-4 z-20">
        <button
          onClick={() => setActiveTab("web")}
          className={`text-sm px-4 py-2 rounded-full transition-all duration-300 hover-glow ${
            activeTab === "web"
              ? "text-white bg-[rgba(255,255,255,0.1)]"
              : "text-[rgba(255,255,255,0.7)]"
          }`}
        >
          Web
        </button>
        <button
          onClick={() => setActiveTab("ai")}
          className={`text-sm px-4 py-2 rounded-full transition-all duration-300 hover-glow ${
            activeTab === "ai"
              ? "text-white bg-[rgba(255,255,255,0.1)]"
              : "text-[rgba(255,255,255,0.7)]"
          }`}
        >
          AI Search
        </button>
        <button
          onClick={() => setActiveTab("anime")}
          className={`text-sm px-4 py-2 rounded-full transition-all duration-300 hover-glow ${
            activeTab === "anime"
              ? "text-white bg-[rgba(255,255,255,0.1)]"
              : "text-[rgba(255,255,255,0.7)]"
          }`}
        >
          Anime Image Search
        </button>
        <a
          href="/webdeck"
          className="text-sm px-4 py-2 rounded-full transition-all duration-300 hover-glow text-[rgba(255,255,255,0.7)] bg-[rgba(255,255,255,0.1)]"
        >
          Web Deck
        </a>
      </nav>

      <div className="max-w-3xl mx-auto pt-16 relative z-10">
        <h1 className="text-4xl font-bold text-center mb-8 text-white font-crimson-text">
          Search
        </h1>
        <div className="flex flex-col items-center gap-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && performSearch()}
            className="w-full max-w-2xl px-6 py-4 text-white bg-[rgba(255,255,255,0.1)] rounded-full focus:outline-none border-0 glow-effect font-crimson-text"
            placeholder={
              activeTab === "anime"
                ? "Describe the anime image you want..."
                : "Search the web..."
            }
          />

          <div className="flex gap-3">
            <button
              onClick={() => performSearch()}
              className="px-8 py-3 bg-[rgba(255,255,255,0.1)] text-white rounded-full hover-glow transition-all duration-300 font-crimson-text"
            >
              {activeTab === "anime" ? "Generate" : "Search"}
            </button>
            {activeTab !== "anime" && (
              <button
                onClick={() => performSearch(true)}
                className="px-8 py-3 bg-[rgba(255,255,255,0.05)] text-white rounded-full hover-glow transition-all duration-300 font-crimson-text"
              >
                I'm Feeling Lucky
              </button>
            )}
          </div>
        </div>

        {loading && activeTab !== "anime" && (
          <div className="mt-8 space-y-4">
            {[...Array.from({ length: 3 })].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        )}

        {loading && activeTab === "anime" && (
          <div className="flex justify-center mt-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
          </div>
        )}

        {error && <div className="mt-8 text-red-500 text-center">{error}</div>}

        {activeTab === "anime" && !loading && generatedImage && (
          <div className="mt-8 flex flex-col items-center">
            <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <img
                src={generatedImage}
                alt="Generated anime artwork"
                className="w-full h-auto"
              />
            </div>
            <button
              onClick={() => performSearch()}
              className="mt-4 px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-md hover:bg-gray-700 dark:hover:bg-gray-100"
            >
              Generate New
            </button>
          </div>
        )}

        {activeTab !== "anime" && results.length > 0 && (
          <div className="mt-8 space-y-6">
            {results.map((result, index) => (
              <div
                key={index}
                className="p-6 rounded-lg bg-[rgba(255,255,255,0.05)] backdrop-blur-sm transition-all duration-300 hover:bg-[rgba(255,255,255,0.08)]"
              >
                <a
                  href={result.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-[rgba(255,255,255,0.8)] transition-all duration-300"
                >
                  <h2 className="text-xl mb-1 font-crimson-text">
                    {result.title}
                  </h2>
                </a>
                <p className="text-sm text-[rgba(255,255,255,0.7)] mb-2 font-crimson-text">
                  {result.displayLink}
                </p>
                <p className="text-[rgba(255,255,255,0.9)] font-crimson-text">
                  {translations[index] || result.snippet}
                </p>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => translateResult(result.snippet, index)}
                    className="text-sm px-4 py-2 rounded-full bg-[rgba(255,255,255,0.1)] text-white hover-glow transition-all duration-300 font-crimson-text"
                  >
                    Translate
                  </button>
                  <button
                    onClick={() => getAiInsight(result, index)}
                    className="text-sm px-4 py-2 rounded-full bg-[rgba(255,255,255,0.1)] text-white hover-glow transition-all duration-300 font-crimson-text"
                  >
                    AI Insights
                  </button>
                </div>

                {aiInsights[index] && (
                  <div className="mt-4 p-4 rounded-lg bg-[rgba(255,255,255,0.08)] font-crimson-text">
                    <p className="text-sm text-[rgba(255,255,255,0.9)]">
                      {aiInsights[index]}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === "ai" && streamingInsight && (
          <div className="mt-8 p-6 rounded-lg bg-[rgba(255,255,255,0.05)] backdrop-blur-sm">
            <h3 className="text-lg font-semibold mb-2 text-white font-crimson-text">
              AI Analysis
            </h3>
            <p className="text-[rgba(255,255,255,0.9)] font-crimson-text">
              {streamingInsight}
            </p>
          </div>
        )}
      </div>
      <style jsx global>{`
        @keyframes glow {
          0% { box-shadow: 0 0 5px rgba(255,255,255,0.5), 0 0 10px rgba(255,255,255,0.3); }
          50% { box-shadow: 0 0 20px rgba(255,255,255,0.7), 0 0 30px rgba(255,255,255,0.5); }
          100% { box-shadow: 0 0 5px rgba(255,255,255,0.5), 0 0 10px rgba(255,255,255,0.3); }
        }
        .glow-effect {
          animation: glow 2s infinite;
        }
        .hover-glow:hover {
          animation: glow 2s infinite;
        }
      `}</style>
    </div>
  );
}

export default MainComponent;
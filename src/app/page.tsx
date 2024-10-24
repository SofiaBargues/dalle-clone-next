"use client";

import { useEffect, useState } from "react";
import React from "react";

import { Loader, Card, FormField } from "@/components/index";
import { Post } from "@/components/Card";

const RenderCards = ({ data, title }: { data: Post[]; title: string }) => {
  if (data?.length > 0) {
    return data.map((post) => <Card key={post._id} {...post} />);
  }
  return (
    <h2 className="mt-5 font-bold text-[#6449ff] text-xl uppercase">{title}</h2>
  );
};

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [allPosts, setAllPosts] = useState<Post[]>([]);

  const [searchText, setSearchText] = useState("");
  const [searchedResults, setSearchedResults] = useState<Post[]>([]);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/v1/post", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          console.log(response);
          const result = await response.json();
          console.log(result);
          setAllPosts(result.data.reverse());
        } else {
          const errorData = await response.json();
          console.log(errorData);
          throw new Error(errorData.message || "Error en la solicitud");
        }
      } catch (error) {
        alert(error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    setSearchText(e.target.value);

    setSearchText(e.target.value);

    setSearchTimeout(
      setTimeout(() => {
        const searchResults = allPosts.filter(
          (item) =>
            item.name
              .toLocaleLowerCase()
              .includes(searchText.toLocaleLowerCase()) ||
            item.prompt
              .toLocaleLowerCase()
              .includes(searchText.toLocaleLowerCase())
        );

        setSearchedResults(searchResults);
      }, 500)
    );
  };

  return (
    <section className="max-w-7xl mx-auto">
      <div>
        <h1 className="font-extrabold text-[#222328] text-[32px]">
          The Community Showcase
        </h1>
        <p className="mt-2 text-[#666e75] text-[16px] max-w-[500px]">
          Browse through a collection of imaginative and visually stunning
          images generated by DALL-E AI
        </p>
      </div>
      <div className="mt-16">
        <FormField
          labelName="Seach posts"
          type="text"
          name="text"
          placeholder="Search posts"
          value={searchText}
          handleChange={handleSearchChange}
        />
      </div>
      <div className="mt-10">
        {loading ? (
          <div className="flex justify-center items-center">
            <Loader />
          </div>
        ) : (
          <>
            {searchText && (
              <h2 className="font-medium text-[#666e75] text-xl mb-3">
                Showing results for
                <span className="text-[#222328] ">{searchText}</span>
              </h2>
            )}
            <div className="grid lg:grid-cold-4 sm:grid-cols-3 xs:grid-cols-2 grid-cols-1 gap-3"></div>
            {searchText ? (
              <RenderCards
                data={searchedResults}
                title="No search results found"
              />
            ) : (
              <RenderCards data={allPosts} title="No posts found" />
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default Home;

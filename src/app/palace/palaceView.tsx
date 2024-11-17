"use client";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import { Palace } from "../api/v1/generate/types";
import { Title } from "./title";
import { WordsInput } from "./wordsInput";
import { WordsList } from "./wordList";
import { PalaceStory } from "./palaceStory";
import { Description } from "./description";
import { Loader } from "@/components";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { selectRandomWords } from "./selectRandomWords";

export type PalaceStep =
  | "start"
  | "fill1"
  | "results1"
  | "palace"
  | "fill2"
  | "results2";

export function PalaceView({
  initialPalace,
  initialStep,
}: {
  initialPalace: Palace;
  initialStep: PalaceStep;
}) {
  const [palace, setPalace] = useState(initialPalace);
  const [step, setStep] = useState<PalaceStep>(initialStep);
  // const [step, setStep] = useState<PalaceStep>("results1");
  const [loading, setLoading] = useState(false);
  // const [loading, setLoading] = useState(true);

  const [referenceWords, setReferenceWords] = useState<string[]>(palace.words);
  const [inputWords, setInputWords] = useState<string[]>([]);
  const [results, setResults] = useState<boolean[]>([]);
  const [slideSelected, setSlideSelected] = useState(0);

  async function generatePalace(): Promise<Palace | undefined> {
    setLoading(true);
    try {
      const response = await fetch("/api/v1/generate", {
        method: "POST",
        body: JSON.stringify({ words: referenceWords }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok " + response.statusText);
      }
      const generatedPalace = await response.json(); // Convierte la respuesta a JSON
      console.log(generatedPalace); // Imprime cada nombre de usuario
      return generatedPalace as Palace;
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleWordsChoiceSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    const newArr = [];
    e.preventDefault();
    for (let i = 0; i < referenceWords.length; i++) {
      // @ts-expect-error  form has elements attribute
      newArr.push(e.target.elements["input_" + i].value);
    }
    setReferenceWords(newArr);
    console.log(newArr);
    await goToNextStep();
  };

  const handleFillSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    const newArr = [];
    e.preventDefault();
    for (let i = 0; i < referenceWords.length; i++) {
      // @ts-expect-error  form has elements attribute
      newArr.push(e.target.elements["input_" + i].value);
    }
    setInputWords(newArr);

    const isCorrectArr = [];
    for (let i = 0; i < newArr.length; i++) {
      const palabra = newArr[i];
      if (palabra.toLowerCase() === referenceWords[i].toLowerCase()) {
        isCorrectArr.push(true);
      } else {
        isCorrectArr.push(false);
      }
    }
    setResults(isCorrectArr);
    await goToNextStep();
  };

  async function goToNextStep() {
    if (step === "start") {
      setStep("fill1");
    } else if (step === "fill1") {
      setStep("results1");
    } else if (step === "results1") {
      console.log("Creating New Palace");
      console.log("Loading");
      const generatedPalace = await generatePalace();
      if (!generatedPalace) {
        console.log("Palace is undefined");
        return;
      }
      setPalace(generatedPalace);
      setStep("palace");
    } else if (step === "palace") {
      setStep("fill2");
    } else if (step === "fill2") {
      setStep("results2");
    } else if (step === "results2") {
      setResults([]);
      setInputWords([]);
      setStep("start");
    }
  }

  console.log(slideSelected);
  return (
    <div className="w-full container m-auto md:p-10 flex flex-col  gap-4">
      <Card className="w-full md:max-w-5xl rounded-none md:rounded-xl ">
        <>
          {step === "palace" && (
            <>
              <CardHeader className="pb-0">
                <CardTitle className="text-2xl font-bold ">
                  Read the story to remember
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Welcome to the Palace of Memory. Transform words into lasting
                  memories through vivid images and immersive stories. Link each
                  word to a location in your palace, making recall effortless
                  and engaging.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PalaceStory
                  palace={palace}
                  onSlideSelected={(num) => {
                    console.log(" changed", num);
                    setSlideSelected(num);
                  }}
                />
              </CardContent>
            </>
          )}
        </>

        {step === "fill1" && (
          <>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl font-bold">Memory Place</CardTitle>
            </CardHeader>
            <CardContent>
              <h2 className="text-xl font-semibold mb-4">Fill</h2>
              <p className="text-gray-600 mb-6">
                Complete the blanks with the previous words in the correct
                order.
              </p>
              <WordsInput
                initialWords={new Array(9).fill(undefined)}
                handleSubmit={handleFillSubmit}
                step={step}
              />
            </CardContent>
          </>
        )}
        {step === "fill2" && (
          <>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl font-bold">
                Remember the story and complete the words
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                It is time to put your journey through the palace of memory to
                the test. Remember each scene from the story, visualizing the
                details. Fill in the blanks as you mentally progress through the
                narrative.
              </p>
              <WordsInput
                initialWords={new Array(9).fill(undefined)}
                handleSubmit={handleFillSubmit}
                step={step}
              />
            </CardContent>
          </>
        )}
        {step === "start" && (
          <>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl font-bold">
                Choose words to remember
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                Select the words you want to remember.
              </p>
              <p className="text-gray-600 mb-6">
                You can generate random lists or customize the list of words to
                your liking. With these, we'll create a memory palace that will
                become part of the library on our home page, ready to be
                revisited.{" "}
              </p>
              <p className="font-bold text-gray-600 mb-6">
                Once you have memorized your words, go to the next step.
              </p>
              <div className="flex justify-end mt-0 pt-0">
                <Button onClick={() => setReferenceWords(selectRandomWords())}>
                  Random
                </Button>
              </div>
              <WordsInput
                key={JSON.stringify(referenceWords)}
                initialWords={referenceWords}
                handleSubmit={handleWordsChoiceSubmit}
                step={step}
              />
            </CardContent>
          </>
        )}
        {loading ? (
          <CardContent className="flex justify-center items-center h-[900px]">
            <Loader />
          </CardContent>
        ) : (
          step === "results1" && (
            //paso previo a ver el palace
            <>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-2xl font-bold">Results</CardTitle>
              </CardHeader>
              <CardContent>
                <Description>
                  These are the results of your first attempt.
                </Description>
                <WordsList
                  step={step}
                  inputWords={inputWords}
                  originalWords={referenceWords}
                  results={results}
                />
              </CardContent>
            </>
          )
        )}
        {step === "results2" && (
          <>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl font-bold">Results</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                These are the results of your journey by the memory palace.
              </p>
              <WordsList
                step={step}
                inputWords={inputWords}
                originalWords={referenceWords}
                results={results}
              />
            </CardContent>
          </>
        )}
        <CardFooter className="flex flex-col items-start space-y-4">
          {step != "fill1" &&
          step != "fill2" &&
          step != "results2" &&
          step != "start" &&
          slideSelected >= palace.images.length &&
          !loading ? (
            <Button className="w-full" onClick={goToNextStep}>
              Next
            </Button>
          ) : step === "results2" ? (
            <a className="w-full" href="/">
              <Button className="w-full mt-4">Go home</Button>
            </a>
          ) : null}
        </CardFooter>
      </Card>
    </div>
  );
}

import { OpenAI } from "openai";
import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { z } from "zod";
import { uploadToCloudinary } from "./uploadToCloudinary";

export const Story = z.object({
  sentences: z.string().array(),
  imagePrompts: z.string().array(),
});

export type Story = z.infer<typeof Story>;

export const Palace = z.object({
  words: z.string().array(),
  images: z.string().array(),
  sentences: z.string().array(),
  imagePrompts: z.string().array(),
});

export type Palace = z.infer<typeof Palace>;

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    // 1. obtengo words del request
    const res = await request.json();
    const words = res.words;

    // 2. crea un cliente de open ai
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // 3. crea senteces y img Promt
    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o",
      temperature: 1.14,
      messages: [
        {
          role: "system",
          content:
            "You are a Loci method builder. \n- Create a memorable story using all the words in the list, keeping them **in the exact order of the input**.\n\nStyle:\n - Keep the writing at a **5th grade level**, using clear, simple imagery.\n- The story is narrated in **first person**, where the reader moves through different places and interacts with the words.\n- The word from the input is wrapped in a bold HTML tag in the `sentences` array E.g.  alice -> <b>alice</b\n\nSteps:\n1. For each word in the user input write a sentence in the output sentences array. The `sentences` array has 9 elements.\n2. For each group of 3 consecutive sentences generate a DALL-E 3 prompt based on the scene described that contains the 3 words from the input related to those 3 sentences. The `imagePrompts` array has 3 elements.\n  ",
        },
        {
          role: "user",
          content: JSON.stringify(words),
        },
      ],
      response_format: zodResponseFormat(Story, "story"),
    });
    const story = completion.choices[0].message.parsed;

    if (story === null) {
      return new Response(JSON.stringify({ message: "Story is Null" }), {
        status: 500,
      });
    }

    // 4. creo las imagenes con dalle 3

    const imgPrompts = story.imagePrompts;

    // DALLE
    const promises = imgPrompts.map((imgPrompt) =>
      openai.images.generate({
        response_format: "url", // Can be `b64_json`
        model: "dall-e-3",
        size: "1024x1024",
        // model: "dall-e-2",
        // size: "256x256",
        prompt: imgPrompt,
        n: 1,
        quality: "standard",
      })
    );
    const responses = await Promise.all(promises);
    const temporalImages = responses.map((res) => res.data[0].url!); // Can be `b64_json`

    // 5. guardo img en cloudinary

    const persistentImages = [];
    for (const image of temporalImages) {
      persistentImages.push(await uploadToCloudinary(image));
    }

    // 6. construyo Palace
    const { imagePrompts, sentences } = story;
    const palace = { words, imagePrompts, sentences, images: persistentImages };
    console.log(sentences);
    console.log(story);
    // 7. guardo palace en mongo
    const palaceResponse = await fetch(
      process.env.NEXT_PUBLIC_URL + "/api/v1/palace",
      {
        method: "POST",
        body: JSON.stringify(palace),
      }
    );
    const savedPalace = await palaceResponse.json();

    return Response.json(savedPalace);
  } catch (error) {
    console.error(error);
    const errorMessage = (error as Error).message;
    console.error(errorMessage);
    return new Response(JSON.stringify({ message: errorMessage }), {
      status: 500,
    });
  }
}

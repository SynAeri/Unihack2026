import { GoogleGenerativeAI } from "@google/generative-ai";
import { EncodingType, readAsStringAsync } from "expo-file-system/legacy";

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Sends a photo to Google Gemini and returns the name of the detected object.
 * @param photoPath - The local file path of the photo
 * @returns The detected object name, or null if detection failed
 */
export async function detectObject(photoPath: string): Promise<string | null> {
  try {
    // Read the image file as base64 using the legacy API to avoid deprecation warnings
    const base64 = await readAsStringAsync(photoPath, {
      encoding: EncodingType.Base64,
    });

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = "Look at this image. Is the main object a FOOD item or a BOOK? If it is a food item, reply with only the word 'Food'. If it is a book, reply with only the word 'Book'. If it is neither a food nor a book, reply with exactly 'Unknown'. Reply with ONLY one of these three words: Food, Book, or Unknown. Do not provide any other text.";

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64,
          mimeType: "image/jpeg",
        },
      },
    ]);

    const response = await result.response;
    const text = response.text().trim();
    
    return text || null;
  } catch (error) {
    console.warn("Gemini SDK error:", error);
    return null;
  }
}
